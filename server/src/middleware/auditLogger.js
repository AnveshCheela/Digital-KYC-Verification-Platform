const pool = require('../config/database');

/**
 * Audit logging middleware.
 *
 * Wraps state-changing routes to automatically log every mutation.
 * Uses res.on('finish') to capture the response status and log after
 * the route handler completes.
 *
 * @param {string} action - The action name (e.g., 'USER_REGISTER', 'KYC_UPLOAD', 'ADMIN_REVIEW')
 */
function auditLog(action) {
  return (req, res, next) => {
    // Store the original res.json to capture the response body
    const originalJson = res.json.bind(res);
    let responseBody = null;

    res.json = (body) => {
      responseBody = body;
      return originalJson(body);
    };

    res.on('finish', async () => {
      // Only log successful state-changing operations
      if (res.statusCode >= 200 && res.statusCode < 400) {
        try {
          const details = {
            method: req.method,
            path: req.originalUrl,
            statusCode: res.statusCode,
            // Sanitize: exclude password fields from logged body
            body: sanitizeBody(req.body),
            verificationId: req.params.id || responseBody?.id || null,
          };

          await pool.query(
            `INSERT INTO audit_logs (verification_id, actor_id, action, details, ip_address)
             VALUES ($1, $2, $3, $4, $5)`,
            [
              req.params.id || responseBody?.id || null,
              req.user?.id || null,
              action,
              JSON.stringify(details),
              req.ip,
            ]
          );
        } catch (err) {
          // Audit logging should never crash the request
          console.error('Audit log error:', err.message);
        }
      }
    });

    next();
  };
}

/**
 * Remove sensitive fields from request body before logging.
 */
function sanitizeBody(body) {
  if (!body) return null;

  const sanitized = { ...body };
  const sensitiveFields = ['password', 'passwordHash', 'token', 'secret'];

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
}

module.exports = { auditLog };
