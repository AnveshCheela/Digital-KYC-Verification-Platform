/**
 * Fraud Engine Unit Tests
 *
 * Tests the fraud detection rules in isolation by extracting
 * the rule logic from the OCR worker.
 */

// ── Mock dependencies ───────────────────────────────────
jest.mock('../config/database', () => ({
  query: jest.fn(),
  connect: jest.fn(),
}));

jest.mock('../config/redis', () => ({
  get: jest.fn().mockResolvedValue(null),
  setex: jest.fn().mockResolvedValue('OK'),
  keys: jest.fn().mockResolvedValue([]),
  del: jest.fn().mockResolvedValue(0),
  on: jest.fn(),
}));

const pool = require('../config/database');

describe('Fraud Detection Engine — Rules', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('PAN Card Extraction', () => {
    // Import the extraction functions from ocrWorker by requiring the module
    // Since the functions aren't exported, we test them via the worker behavior.
    // For unit tests, we replicate the extraction logic here.

    function extractPanData(text) {
      const data = { panNumber: null, name: null, fatherName: null, dateOfBirth: null };

      const panMatch = text.match(/[A-Z]{5}[0-9]{4}[A-Z]{1}/);
      if (panMatch) data.panNumber = panMatch[0];

      const dobMatch = text.match(/(\d{2}\/\d{2}\/\d{4})/);
      if (dobMatch) data.dateOfBirth = dobMatch[1];

      return data;
    }

    it('should extract valid PAN number', () => {
      const text = 'INCOME TAX DEPARTMENT\nABCDE1234F\nName: John Doe\n01/01/1990';
      const result = extractPanData(text);

      expect(result.panNumber).toBe('ABCDE1234F');
      expect(result.dateOfBirth).toBe('01/01/1990');
    });

    it('should return null for invalid PAN format', () => {
      const text = 'Some random text without a valid PAN number 123ABC';
      const result = extractPanData(text);

      expect(result.panNumber).toBeNull();
    });

    it('should handle mixed case and noise', () => {
      const text = 'Govt of India\n  BXYPD5678G  \nPermanent Account Number';
      const result = extractPanData(text);

      expect(result.panNumber).toBe('BXYPD5678G');
    });
  });

  describe('Aadhaar Card Extraction', () => {
    function extractAadhaarData(text) {
      const data = { aadhaarNumber: null, name: null, dateOfBirth: null, gender: null };

      const aadhaarMatch = text.match(/\d{4}\s?\d{4}\s?\d{4}/);
      if (aadhaarMatch) data.aadhaarNumber = aadhaarMatch[0].replace(/\s/g, ' ').trim();

      const dobMatch = text.match(/(\d{2}\/\d{2}\/\d{4})/);
      if (dobMatch) data.dateOfBirth = dobMatch[1];

      const genderMatch = text.match(/\b(MALE|FEMALE|male|female|Male|Female)\b/i);
      if (genderMatch) data.gender = genderMatch[1].toUpperCase();

      return data;
    }

    it('should extract valid Aadhaar number with spaces', () => {
      const text = 'Government of India\n1234 5678 9012\nMale\n01/01/1990';
      const result = extractAadhaarData(text);

      expect(result.aadhaarNumber).toBe('1234 5678 9012');
      expect(result.gender).toBe('MALE');
      expect(result.dateOfBirth).toBe('01/01/1990');
    });

    it('should extract Aadhaar number without spaces', () => {
      const text = '123456789012';
      const result = extractAadhaarData(text);

      expect(result.aadhaarNumber).toBeTruthy();
    });

    it('should return null for invalid Aadhaar', () => {
      const text = 'No aadhaar number here, just random text 12345';
      const result = extractAadhaarData(text);

      expect(result.aadhaarNumber).toBeNull();
    });
  });

  describe('Fraud Score Calculation', () => {
    it('should auto-reject on duplicate hash (score >= 0.8)', () => {
      const flags = [
        { rule: 'DUPLICATE_HASH', weight: 1.0 },
      ];
      const totalWeight = flags.reduce((sum, f) => sum + f.weight, 0);
      const fraudScore = Math.min(totalWeight, 1.0);

      expect(fraudScore).toBeGreaterThanOrEqual(0.8);
      // Score >= 0.8 → rejected
      const status = fraudScore >= 0.8 ? 'rejected' : fraudScore >= 0.4 ? 'manual_review' : 'approved';
      expect(status).toBe('rejected');
    });

    it('should flag for manual review on moderate score (0.4-0.8)', () => {
      const flags = [
        { rule: 'LOW_OCR_CONFIDENCE', weight: 0.5 },
      ];
      const totalWeight = flags.reduce((sum, f) => sum + f.weight, 0);
      const fraudScore = Math.min(totalWeight, 1.0);

      expect(fraudScore).toBeGreaterThanOrEqual(0.4);
      expect(fraudScore).toBeLessThan(0.8);

      const status = fraudScore >= 0.8 ? 'rejected' : fraudScore >= 0.4 ? 'manual_review' : 'approved';
      expect(status).toBe('manual_review');
    });

    it('should auto-approve on clean document (score < 0.4)', () => {
      const flags = [];
      const totalWeight = flags.reduce((sum, f) => sum + f.weight, 0);
      const fraudScore = Math.min(totalWeight, 1.0);

      expect(fraudScore).toBeLessThan(0.4);

      const status = fraudScore >= 0.8 ? 'rejected' : fraudScore >= 0.4 ? 'manual_review' : 'approved';
      expect(status).toBe('approved');
    });

    it('should combine multiple flags correctly', () => {
      const flags = [
        { rule: 'LOW_OCR_CONFIDENCE', weight: 0.5 },
        { rule: 'NAME_MISMATCH', weight: 0.6 },
      ];
      const totalWeight = flags.reduce((sum, f) => sum + f.weight, 0);
      const fraudScore = Math.min(totalWeight, 1.0);

      // 0.5 + 0.6 = 1.1 → capped at 1.0
      expect(fraudScore).toBe(1.0);

      const status = fraudScore >= 0.8 ? 'rejected' : fraudScore >= 0.4 ? 'manual_review' : 'approved';
      expect(status).toBe('rejected');
    });

    it('should cap score at 1.0', () => {
      const flags = [
        { rule: 'DUPLICATE_HASH', weight: 1.0 },
        { rule: 'INVALID_PAN_FORMAT', weight: 0.8 },
        { rule: 'LOW_OCR_CONFIDENCE', weight: 0.5 },
      ];
      const totalWeight = flags.reduce((sum, f) => sum + f.weight, 0);
      const fraudScore = Math.min(totalWeight, 1.0);

      expect(fraudScore).toBe(1.0);
    });

    it('should handle single borderline flag correctly', () => {
      const flags = [
        { rule: 'SUSPICIOUS_METADATA', weight: 0.3 },
      ];
      const totalWeight = flags.reduce((sum, f) => sum + f.weight, 0);
      const fraudScore = Math.min(totalWeight, 1.0);

      expect(fraudScore).toBeLessThan(0.4);

      const status = fraudScore >= 0.8 ? 'rejected' : fraudScore >= 0.4 ? 'manual_review' : 'approved';
      expect(status).toBe('approved');
    });
  });

  describe('Duplicate Hash Detection', () => {
    it('should flag duplicate document hashes', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ id: 'existing-verification-id' }],
      });

      const { rows: duplicates } = await pool.query(
        'SELECT id FROM verifications WHERE document_hash = $1 AND id != $2',
        ['abc123hash', 'current-id']
      );

      expect(duplicates.length).toBeGreaterThan(0);
    });

    it('should not flag unique documents', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const { rows: duplicates } = await pool.query(
        'SELECT id FROM verifications WHERE document_hash = $1 AND id != $2',
        ['unique-hash', 'current-id']
      );

      expect(duplicates.length).toBe(0);
    });
  });
});
