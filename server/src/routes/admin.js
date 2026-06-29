const express = require('express');
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { auditLog } = require('../middleware/auditLogger');
const { cacheMiddleware, invalidateCache } = require('../middleware/cache');
const { addNotificationJob } = require('../queues/notificationQueue');

const router = express.Router();

// All admin routes require authentication + admin role
router.use(authenticate, authorize('admin'));

/**
 * GET /api/admin/stats
 * Dashboard statistics for the admin panel.
 */
router.get('/stats', cacheMiddleware('admin:stats', 30), async (req, res) => {
  try {
    const { rows: counts } = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'pending') AS pending,
        COUNT(*) FILTER (WHERE status = 'processing') AS processing,
        COUNT(*) FILTER (WHERE status = 'manual_review') AS manual_review,
        COUNT(*) FILTER (WHERE status = 'approved') AS approved,
        COUNT(*) FILTER (WHERE status = 'rejected') AS rejected,
        COUNT(*) AS total
      FROM verifications
    `);

    const { rows: recentActivity } = await pool.query(`
      SELECT COUNT(*) AS count
      FROM verifications
      WHERE created_at > NOW() - INTERVAL '24 hours'
    `);

    res.json({
      stats: {
        pending: parseInt(counts[0].pending),
        processing: parseInt(counts[0].processing),
        manualReview: parseInt(counts[0].manual_review),
        approved: parseInt(counts[0].approved),
        rejected: parseInt(counts[0].rejected),
        total: parseInt(counts[0].total),
        last24h: parseInt(recentActivity[0].count),
      },
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

/**
 * GET /api/admin/queue
 * Get paginated verification queue with optional status filter.
 *
 * Query params: status, page (default 1), limit (default 20)
 */
router.get('/queue', cacheMiddleware('admin:queue', 30), async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereClause = '';
    const params = [];

    if (status) {
      whereClause = 'WHERE v.status = $1';
      params.push(status);
    }

    const countQuery = `SELECT COUNT(*) FROM verifications v ${whereClause}`;
    const { rows: countRows } = await pool.query(countQuery, params);
    const total = parseInt(countRows[0].count);

    const dataQuery = `
      SELECT v.id, v.document_type, v.status, v.ocr_confidence, v.fraud_score,
             v.fraud_flags, v.created_at, v.updated_at,
             u.email AS user_email, u.full_name AS user_name
      FROM verifications v
      JOIN users u ON v.user_id = u.id
      ${whereClause}
      ORDER BY
        CASE v.status
          WHEN 'manual_review' THEN 1
          WHEN 'pending' THEN 2
          WHEN 'processing' THEN 3
          ELSE 4
        END,
        v.created_at ASC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    params.push(parseInt(limit), offset);
    const { rows } = await pool.query(dataQuery, params);

    res.json({
      verifications: rows.map((v) => ({
        id: v.id,
        documentType: v.document_type,
        status: v.status,
        ocrConfidence: v.ocr_confidence,
        fraudScore: v.fraud_score,
        fraudFlags: v.fraud_flags,
        userEmail: v.user_email,
        userName: v.user_name,
        createdAt: v.created_at,
        updatedAt: v.updated_at,
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error('Queue error:', err);
    res.status(500).json({ error: 'Failed to fetch queue' });
  }
});

/**
 * POST /api/admin/review/:id
 * Approve or reject a verification.
 * Uses row-level locking to prevent race conditions.
 */
router.post('/review/:id', auditLog('ADMIN_REVIEW'), async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const { action, notes } = req.body;

    if (!action || !['approved', 'rejected'].includes(action)) {
      return res.status(400).json({ error: 'Action must be "approved" or "rejected"' });
    }

    if (!notes || notes.trim().length === 0) {
      return res.status(400).json({ error: 'Review notes are required' });
    }

    await client.query('BEGIN');

    // Row-level lock — prevents concurrent updates to the same verification
    const { rows } = await client.query(
      'SELECT v.*, u.email AS user_email, u.full_name AS user_name FROM verifications v JOIN users u ON v.user_id = u.id WHERE v.id = $1 FOR UPDATE',
      [id]
    );

    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Verification not found' });
    }

    const verification = rows[0];

    // Only allow review of pending or manual_review submissions
    if (!['pending', 'manual_review', 'processing'].includes(verification.status)) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: `Cannot review a verification with status "${verification.status}"`,
      });
    }

    // Update status
    await client.query(
      `UPDATE verifications
       SET status = $1, reviewed_by = $2, review_notes = $3, updated_at = NOW()
       WHERE id = $4`,
      [action, req.user.id, notes.trim(), id]
    );

    // Insert audit log within the same transaction
    await client.query(
      `INSERT INTO audit_logs (verification_id, actor_id, action, details, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        id,
        req.user.id,
        `ADMIN_REVIEW_${action.toUpperCase()}`,
        JSON.stringify({
          previousStatus: verification.status,
          newStatus: action,
          notes: notes.trim(),
        }),
        req.ip,
      ]
    );

    await client.query('COMMIT');

    // Invalidate relevant caches
    await invalidateCache('admin:queue');
    await invalidateCache('admin:stats');
    await invalidateCache('kyc:status');

    // Enqueue notification email
    try {
      await addNotificationJob({
        userEmail: verification.user_email,
        userName: verification.user_name,
        verificationId: id,
        status: action,
        notes: notes.trim(),
      });
    } catch (notifErr) {
      console.error('Failed to enqueue notification:', notifErr.message);
    }

    res.json({
      id,
      status: action,
      reviewedBy: req.user.id,
      message: `Verification ${action} successfully`,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Review error:', err);
    res.status(500).json({ error: 'Review failed' });
  } finally {
    client.release();
  }
});

/**
 * GET /api/admin/audit-logs
 * View audit trail with pagination.
 *
 * Query params: page (default 1), limit (default 50), action (optional filter)
 */
router.get('/audit-logs', cacheMiddleware('admin:audit', 30), async (req, res) => {
  try {
    const { page = 1, limit = 50, action } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereClause = '';
    const params = [];

    if (action) {
      whereClause = 'WHERE al.action = $1';
      params.push(action);
    }

    const countQuery = `SELECT COUNT(*) FROM audit_logs al ${whereClause}`;
    const { rows: countRows } = await pool.query(countQuery, params);
    const total = parseInt(countRows[0].count);

    const dataQuery = `
      SELECT al.id, al.verification_id, al.action, al.details, al.ip_address, al.created_at,
             u.email AS actor_email, u.full_name AS actor_name
      FROM audit_logs al
      LEFT JOIN users u ON al.actor_id = u.id
      ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    params.push(parseInt(limit), offset);
    const { rows } = await pool.query(dataQuery, params);

    res.json({
      logs: rows.map((log) => ({
        id: log.id,
        verificationId: log.verification_id,
        action: log.action,
        details: log.details,
        ipAddress: log.ip_address,
        actorEmail: log.actor_email,
        actorName: log.actor_name,
        createdAt: log.created_at,
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error('Audit logs error:', err);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

module.exports = router;
