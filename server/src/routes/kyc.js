const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const pool = require('../config/database');
const upload = require('../middleware/upload');
const { authenticate } = require('../middleware/auth');
const { uploadLimiter } = require('../middleware/rateLimiter');
const { auditLog } = require('../middleware/auditLogger');
const { cacheMiddleware } = require('../middleware/cache');
const { addVerificationJob } = require('../queues/verificationQueue');

const router = express.Router();

/**
 * POST /api/kyc/upload
 * Upload a PAN or Aadhaar document for verification.
 * Enqueues a BullMQ job for async processing.
 */
router.post(
  '/upload',
  authenticate,
  uploadLimiter,
  upload.single('document'),
  auditLog('KYC_UPLOAD'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Document file is required' });
      }

      const { documentType } = req.body;

      if (!documentType || !['pan', 'aadhaar', 'passport'].includes(documentType)) {
        // Clean up uploaded file if validation fails
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: 'Document type must be "pan", "aadhaar", or "passport"' });
      }

      // ── Compute SHA-256 hash for duplicate detection ──
      const fileBuffer = fs.readFileSync(req.file.path);
      const documentHash = crypto
        .createHash('sha256')
        .update(fileBuffer)
        .digest('hex');

      // ── Create verification record ────────────────────
      const { rows } = await pool.query(
        `INSERT INTO verifications (user_id, document_type, document_path, document_hash, status)
         VALUES ($1, $2, $3, $4, 'pending')
         RETURNING id, status, created_at`,
        [req.user.id, documentType, req.file.path, documentHash]
      );

      const verification = rows[0];

      // ── Enqueue verification job ──────────────────────
      await addVerificationJob({
        verificationId: verification.id,
        documentPath: req.file.path,
        documentType,
        documentHash,
        userId: req.user.id,
      });

      res.status(201).json({
        id: verification.id,
        status: verification.status,
        message: 'Document uploaded successfully. Verification in progress.',
        createdAt: verification.created_at,
      });
    } catch (err) {
      // Clean up file on error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      console.error('Upload error:', err);
      res.status(500).json({ error: 'Upload failed' });
    }
  }
);

/**
 * GET /api/kyc/status/:id
 * Get verification status for a specific submission.
 * Users can only view their own verifications.
 */
router.get(
  '/status/:id',
  authenticate,
  cacheMiddleware('kyc:status', 10),
  async (req, res) => {
    try {
      const { id } = req.params;

      const { rows } = await pool.query(
        `SELECT v.id, v.document_type, v.status, v.ocr_data, v.ocr_confidence,
                v.fraud_flags, v.fraud_score, v.review_notes, v.created_at, v.updated_at,
                u.full_name AS reviewed_by_name
         FROM verifications v
         LEFT JOIN users u ON v.reviewed_by = u.id
         WHERE v.id = $1`,
        [id]
      );

      if (rows.length === 0) {
        return res.status(404).json({ error: 'Verification not found' });
      }

      const verification = rows[0];

      // Users can only see their own verifications (admins bypass this check)
      if (req.user.role !== 'admin') {
        const { rows: ownerCheck } = await pool.query(
          'SELECT user_id FROM verifications WHERE id = $1',
          [id]
        );

        if (ownerCheck[0].user_id !== req.user.id) {
          return res.status(403).json({ error: 'Access denied' });
        }
      }

      res.json({
        id: verification.id,
        documentType: verification.document_type,
        status: verification.status,
        ocrData: verification.ocr_data,
        ocrConfidence: verification.ocr_confidence,
        fraudFlags: verification.fraud_flags,
        fraudScore: verification.fraud_score,
        reviewNotes: verification.review_notes,
        reviewedBy: verification.reviewed_by_name,
        createdAt: verification.created_at,
        updatedAt: verification.updated_at,
      });
    } catch (err) {
      console.error('Status check error:', err);
      res.status(500).json({ error: 'Failed to fetch status' });
    }
  }
);

/**
 * GET /api/kyc/my-verifications
 * Get all verifications for the authenticated user.
 */
router.get('/my-verifications', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, document_type, status, ocr_confidence, fraud_score,
              created_at, updated_at
       FROM verifications
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.json({
      verifications: rows.map((v) => ({
        id: v.id,
        documentType: v.document_type,
        status: v.status,
        ocrConfidence: v.ocr_confidence,
        fraudScore: v.fraud_score,
        createdAt: v.created_at,
        updatedAt: v.updated_at,
      })),
    });
  } catch (err) {
    console.error('My verifications error:', err);
    res.status(500).json({ error: 'Failed to fetch verifications' });
  }
});

module.exports = router;
