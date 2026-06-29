const request = require('supertest');

// ── Mock dependencies before requiring app ──────────────
// Mock the database pool
jest.mock('../config/database', () => {
  const mockQuery = jest.fn();
  const mockConnect = jest.fn();
  const mockRelease = jest.fn();

  mockConnect.mockResolvedValue({
    query: mockQuery,
    release: mockRelease,
  });

  return {
    query: mockQuery,
    connect: mockConnect,
  };
});

// Mock Redis
jest.mock('../config/redis', () => ({
  get: jest.fn().mockResolvedValue(null),
  setex: jest.fn().mockResolvedValue('OK'),
  keys: jest.fn().mockResolvedValue([]),
  del: jest.fn().mockResolvedValue(0),
  on: jest.fn(),
}));

// Mock BullMQ queues
jest.mock('../queues/verificationQueue', () => ({
  addVerificationJob: jest.fn().mockResolvedValue({ id: 'mock-job-id' }),
}));

jest.mock('../queues/notificationQueue', () => ({
  addNotificationJob: jest.fn().mockResolvedValue({ id: 'mock-notif-id' }),
}));

const pool = require('../config/database');

// Set test env vars
process.env.JWT_SECRET = 'test-jwt-secret-key-minimum-32-chars!!';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-min-32-chars!!';

// Import app after mocks
const app = require('../index');

describe('Auth API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user and return JWT', async () => {
      // Mock: no existing user
      pool.query
        .mockResolvedValueOnce({ rows: [] }) // Check existing user
        .mockResolvedValueOnce({              // INSERT user
          rows: [{
            id: 'user-uuid-123',
            email: 'test@example.com',
            full_name: 'Test User',
            role: 'user',
            created_at: new Date().toISOString(),
          }],
        })
        .mockResolvedValue({ rows: [] });    // Audit log insert

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'securePassword123',
          fullName: 'Test User',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body.user).toHaveProperty('id', 'user-uuid-123');
      expect(res.body.user).toHaveProperty('email', 'test@example.com');
      expect(res.body.user).toHaveProperty('role', 'user');
    });

    it('should reject registration with missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com' });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should reject registration with short password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'short',
          fullName: 'Test User',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/8 characters/);
    });

    it('should reject registration with invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'not-an-email',
          password: 'securePassword123',
          fullName: 'Test User',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/email/i);
    });

    it('should return 409 if email already exists', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ id: 'existing' }] });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'existing@example.com',
          password: 'securePassword123',
          fullName: 'Test User',
        });

      expect(res.statusCode).toBe(409);
      expect(res.body.error).toMatch(/already registered/i);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash('correctPassword', 12);

      pool.query
        .mockResolvedValueOnce({
          rows: [{
            id: 'user-uuid-123',
            email: 'test@example.com',
            password_hash: hash,
            full_name: 'Test User',
            role: 'user',
          }],
        })
        .mockResolvedValue({ rows: [] }); // Audit log

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'correctPassword',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body.user.email).toBe('test@example.com');
    });

    it('should reject login with wrong password', async () => {
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash('correctPassword', 12);

      pool.query.mockResolvedValueOnce({
        rows: [{
          id: 'user-uuid-123',
          email: 'test@example.com',
          password_hash: hash,
          full_name: 'Test User',
          role: 'user',
        }],
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongPassword',
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toMatch(/invalid/i);
    });

    it('should reject login with non-existent email', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'noone@example.com',
          password: 'anyPassword',
        });

      expect(res.statusCode).toBe(401);
    });

    it('should reject login with missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(res.statusCode).toBe(400);
    });
  });
});
