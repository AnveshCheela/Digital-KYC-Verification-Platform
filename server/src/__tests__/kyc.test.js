const request = require('supertest');
const jwt = require('jsonwebtoken');

// ── Mock dependencies ───────────────────────────────────
jest.mock('../config/database', () => {
  const mockQuery = jest.fn();
  return { query: mockQuery, connect: jest.fn() };
});

jest.mock('../config/redis', () => ({
  get: jest.fn().mockResolvedValue(null),
  setex: jest.fn().mockResolvedValue('OK'),
  keys: jest.fn().mockResolvedValue([]),
  del: jest.fn().mockResolvedValue(0),
  on: jest.fn(),
}));

jest.mock('../queues/verificationQueue', () => ({
  addVerificationJob: jest.fn().mockResolvedValue({ id: 'mock-job-id' }),
}));

jest.mock('../queues/notificationQueue', () => ({
  addNotificationJob: jest.fn().mockResolvedValue({ id: 'mock-notif-id' }),
}));

process.env.JWT_SECRET = 'test-jwt-secret-key-minimum-32-chars!!';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-min-32-chars!!';

const pool = require('../config/database');
const app = require('../index');

// Helper to generate a valid test JWT
function generateToken(payload = {}) {
  return jwt.sign(
    { id: 'user-uuid-123', email: 'test@example.com', role: 'user', ...payload },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

function generateAdminToken() {
  return jwt.sign(
    { id: 'admin-uuid-456', email: 'admin@example.com', role: 'admin' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

describe('KYC API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/kyc/status/:id', () => {
    it('should return verification status for the owner', async () => {
      pool.query
        .mockResolvedValueOnce({
          rows: [{
            id: 'verif-uuid-789',
            document_type: 'pan',
            status: 'processing',
            ocr_data: null,
            ocr_confidence: null,
            fraud_flags: [],
            fraud_score: 0,
            review_notes: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            reviewed_by_name: null,
          }],
        })
        .mockResolvedValueOnce({
          rows: [{ user_id: 'user-uuid-123' }], // Owner check
        });

      const token = generateToken();
      const res = await request(app)
        .get('/api/kyc/status/verif-uuid-789')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 'processing');
      expect(res.body).toHaveProperty('documentType', 'pan');
    });

    it('should deny access to another user\'s verification', async () => {
      pool.query
        .mockResolvedValueOnce({
          rows: [{
            id: 'verif-uuid-789',
            document_type: 'pan',
            status: 'pending',
            ocr_data: null,
            ocr_confidence: null,
            fraud_flags: [],
            fraud_score: 0,
            review_notes: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            reviewed_by_name: null,
          }],
        })
        .mockResolvedValueOnce({
          rows: [{ user_id: 'other-user-uuid' }], // Different owner
        });

      const token = generateToken();
      const res = await request(app)
        .get('/api/kyc/status/verif-uuid-789')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(403);
    });

    it('should return 404 for non-existent verification', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const token = generateToken();
      const res = await request(app)
        .get('/api/kyc/status/non-existent-id')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(404);
    });

    it('should reject requests without authentication', async () => {
      const res = await request(app)
        .get('/api/kyc/status/verif-uuid-789');

      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/kyc/my-verifications', () => {
    it('should return all verifications for the authenticated user', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'v1',
            document_type: 'pan',
            status: 'approved',
            ocr_confidence: 85,
            fraud_score: 0.1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 'v2',
            document_type: 'aadhaar',
            status: 'pending',
            ocr_confidence: null,
            fraud_score: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
      });

      const token = generateToken();
      const res = await request(app)
        .get('/api/kyc/my-verifications')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.verifications).toHaveLength(2);
      expect(res.body.verifications[0]).toHaveProperty('documentType', 'pan');
      expect(res.body.verifications[1]).toHaveProperty('status', 'pending');
    });
  });
});

describe('Admin API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/admin/queue', () => {
    it('should return verification queue for admin', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ count: '2' }] }) // Count query
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'v1',
              document_type: 'pan',
              status: 'manual_review',
              ocr_confidence: 45,
              fraud_score: 0.5,
              fraud_flags: [{ rule: 'LOW_OCR_CONFIDENCE' }],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              user_email: 'user@example.com',
              user_name: 'Test User',
            },
          ],
        });

      const token = generateAdminToken();
      const res = await request(app)
        .get('/api/admin/queue')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.verifications).toHaveLength(1);
      expect(res.body).toHaveProperty('pagination');
      expect(res.body.pagination).toHaveProperty('total', 2);
    });

    it('should deny access to non-admin users', async () => {
      const token = generateToken(); // Regular user token
      const res = await request(app)
        .get('/api/admin/queue')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(403);
    });
  });

  describe('GET /api/admin/stats', () => {
    it('should return dashboard statistics for admin', async () => {
      pool.query
        .mockResolvedValueOnce({
          rows: [{
            pending: '5',
            processing: '2',
            manual_review: '3',
            approved: '20',
            rejected: '4',
            total: '34',
          }],
        })
        .mockResolvedValueOnce({
          rows: [{ count: '7' }],
        });

      const token = generateAdminToken();
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.stats).toHaveProperty('pending', 5);
      expect(res.body.stats).toHaveProperty('total', 34);
      expect(res.body.stats).toHaveProperty('last24h', 7);
    });
  });

  describe('GET /api/admin/audit-logs', () => {
    it('should return paginated audit logs for admin', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({
          rows: [{
            id: 'log-1',
            verification_id: 'v1',
            action: 'KYC_UPLOAD',
            details: { method: 'POST' },
            ip_address: '127.0.0.1',
            created_at: new Date().toISOString(),
            actor_email: 'user@example.com',
            actor_name: 'Test User',
          }],
        });

      const token = generateAdminToken();
      const res = await request(app)
        .get('/api/admin/audit-logs')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.logs).toHaveLength(1);
      expect(res.body.logs[0]).toHaveProperty('action', 'KYC_UPLOAD');
      expect(res.body).toHaveProperty('pagination');
    });
  });
});
