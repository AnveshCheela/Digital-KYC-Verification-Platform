const { Worker } = require('bullmq');
const IORedis = require('ioredis');
const fs = require('fs');
const { GoogleGenAI } = require('@google/genai');
const pool = require('../config/database');
const { invalidateCache } = require('../middleware/cache');

const connection = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: null,
});

/**
 * AI OCR Worker — the first stage of the verification pipeline.
 *
 * Pipeline: receive job → update status to 'processing' 
 *           → run Gemini Multimodal AI → extract structured JSON → store results
 *           → enqueue fraud detection job
 */
const ocrWorker = new Worker(
  'verification',
  async (job) => {
    const { verificationId, documentPath, documentType, documentHash, userId } = job.data;

    console.log(`[OCR] Processing verification ${verificationId} (${documentType})`);

    // ── Step 1: Update status to 'processing' ───────────
    await pool.query(
      "UPDATE verifications SET status = 'processing', updated_at = NOW() WHERE id = $1",
      [verificationId]
    );
    await invalidateCache('kyc:status');

    await job.updateProgress(10);

    // ── Step 2: Read image ───────────────
    if (!fs.existsSync(documentPath)) {
      throw new Error(`Document file not found: ${documentPath}`);
    }

    const imageBuffer = fs.readFileSync(documentPath);
    await job.updateProgress(30);

    // ── Step 3: Run Gemini AI Extraction ───────────────────────
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured in the environment.");
    }
    
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const base64Image = imageBuffer.toString('base64');
    const mimeType = documentPath.toLowerCase().endsWith('.png') ? 'image/png' 
                   : documentPath.toLowerCase().endsWith('.webp') ? 'image/webp' 
                   : 'image/jpeg';
                   
    const prompt = `
      You are an expert OCR and data extraction system for Indian KYC documents.
      This is a ${documentType.toUpperCase()} card.
      Extract the following fields from this image and return ONLY a valid JSON object.
      Do not include markdown blocks, backticks, or any other text.
      
      If it is a PAN card, extract:
      {
        "panNumber": "ABCDE1234F",
        "name": "Full Name",
        "fatherName": "Father Name",
        "dateOfBirth": "DD/MM/YYYY"
      }
      
      If it is an Aadhaar card, extract:
      {
        "aadhaarNumber": "1234 5678 9012",
        "name": "Full Name",
        "gender": "MALE/FEMALE",
        "dateOfBirth": "DD/MM/YYYY",
        "address": "Full Address"
      }
      
      If it is a Passport, extract:
      {
        "passportNumber": "A1234567",
        "name": "Full Name",
        "dateOfBirth": "DD/MM/YYYY",
        "nationality": "Indian",
        "expiryDate": "DD/MM/YYYY"
      }
      
      If any field is unreadable or not present, set it to null.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            { inlineData: { data: base64Image, mimeType } }
          ]
        }
      ]
    });

    await job.updateProgress(70);

    let extractedData = {};
    let confidence = 100; // Gemini returns structured data directly, so we assume high confidence
    const rawText = response.text || '';
    
    try {
      // Clean up potential markdown formatting from Gemini response
      let jsonString = rawText.trim();
      if (jsonString.startsWith('```json')) {
        jsonString = jsonString.substring(7);
      }
      if (jsonString.startsWith('```')) {
        jsonString = jsonString.substring(3);
      }
      if (jsonString.endsWith('```')) {
        jsonString = jsonString.substring(0, jsonString.length - 3);
      }
      
      extractedData = JSON.parse(jsonString.trim());
      extractedData.rawText = rawText; // Keeping for audit
    } catch (e) {
      console.error("[OCR] Failed to parse Gemini response as JSON:", rawText);
      extractedData.rawText = rawText;
      confidence = 10; // Low confidence if it fails to extract JSON
    }

    console.log(`[OCR] Extracted data for ${verificationId}:`, JSON.stringify(extractedData));

    // ── Step 4: Store OCR results in database ───────────
    await pool.query(
      `UPDATE verifications
       SET ocr_data = $1, ocr_confidence = $2, updated_at = NOW()
       WHERE id = $3`,
      [JSON.stringify(extractedData), confidence, verificationId]
    );

    await job.updateProgress(80);

    // ── Step 5: Run fraud detection inline ──────────────
    const fraudResult = await runFraudDetection({
      verificationId,
      documentType,
      documentHash,
      extractedData,
      confidence,
      userId,
    });

    await job.updateProgress(100);

    console.log(`[OCR] Completed verification ${verificationId} → ${fraudResult.status}`);

    return {
      verificationId,
      confidence,
      extractedData,
      fraudResult,
    };
  },
  {
    connection,
    concurrency: 2,
    lockDuration: 60000,
    stalledInterval: 30000,
    maxStalledCount: 2,
  }
);

// ── Fraud Detection Engine (Rules-Based) ────────────────
async function runFraudDetection({ verificationId, documentType, documentHash, extractedData, confidence, userId }) {
  const flags = [];
  let totalWeight = 0;

  // ── Rule 1: Duplicate Document Hash ───────────────────
  const { rows: duplicates } = await pool.query(
    `SELECT id FROM verifications
     WHERE document_hash = $1 AND id != $2`,
    [documentHash, verificationId]
  );

  if (duplicates.length > 0) {
    flags.push({
      rule: 'DUPLICATE_HASH',
      description: 'This document has been submitted before',
      weight: 1.0,
      details: { existingVerificationIds: duplicates.map((d) => d.id) },
    });
    totalWeight += 1.0;
  }

  // ── Rule 2: Low OCR Confidence ────────────────────────
  if (confidence < 30) {
    flags.push({
      rule: 'LOW_OCR_CONFIDENCE',
      description: `OCR confidence is ${confidence}% (threshold: 30%)`,
      weight: 0.5,
      details: { confidence },
    });
    totalWeight += 0.5;
  }

  // ── Rule 3: Invalid Document Format ───────────────────
  if (documentType === 'pan') {
    if (!extractedData.panNumber) {
      flags.push({
        rule: 'INVALID_PAN_FORMAT',
        description: 'No valid PAN number found in document',
        weight: 0.3,
        details: { extractedText: extractedData.rawText?.substring(0, 200) },
      });
      totalWeight += 0.3;
    }
  } else if (documentType === 'aadhaar') {
    if (!extractedData.aadhaarNumber) {
      flags.push({
        rule: 'INVALID_AADHAAR_FORMAT',
        description: 'No valid Aadhaar number found in document',
        weight: 0.8,
        details: { extractedText: extractedData.rawText?.substring(0, 200) },
      });
      totalWeight += 0.8;
    }
  } else if (documentType === 'passport') {
    if (!extractedData.passportNumber) {
      flags.push({
        rule: 'INVALID_PASSPORT_FORMAT',
        description: 'No valid Passport number found in document',
        weight: 0.8,
        details: { extractedText: extractedData.rawText?.substring(0, 200) },
      });
      totalWeight += 0.8;
    }
  }

  // ── Rule 4: Name Mismatch ─────────────────────────────
  if (extractedData.name) {
    const { rows: userRows } = await pool.query(
      'SELECT full_name FROM users WHERE id = $1',
      [userId]
    );

    if (userRows.length > 0) {
      const registeredName = userRows[0].full_name.toLowerCase().trim();
      const extractedName = extractedData.name.toLowerCase().trim();

      // Simple similarity check — do the names share any word?
      const registeredWords = new Set(registeredName.split(/\s+/));
      const extractedWords = extractedName.split(/\s+/);
      const matchingWords = extractedWords.filter((w) => registeredWords.has(w));

      if (matchingWords.length === 0 && extractedName.length > 2) {
        flags.push({
          rule: 'NAME_MISMATCH',
          description: 'Extracted name does not match registered user name',
          weight: 0.6,
          details: { registeredName, extractedName },
        });
        totalWeight += 0.6;
      }
    }
  }

  // ── Rule 5: Empty JSON / Failed Extraction ──────────────
  if (!extractedData || Object.keys(extractedData).length <= 1) {
    flags.push({
      rule: 'INSUFFICIENT_DATA',
      description: 'Could not extract valid data from document',
      weight: 0.7,
      details: { extractedKeys: Object.keys(extractedData) },
    });
    totalWeight += 0.7;
  }

  // ── Calculate fraud score and determine status ────────
  // Normalize score to 0-1 range (cap at 1.0)
  const fraudScore = Math.min(totalWeight, 1.0);

  let newStatus;
  if (fraudScore >= 0.8) {
    newStatus = 'rejected';
  } else if (fraudScore >= 0.4) {
    newStatus = 'manual_review';
  } else {
    newStatus = 'approved';
  }

  // ── Update verification with fraud results ────────────
  await pool.query(
    `UPDATE verifications
     SET fraud_flags = $1, fraud_score = $2, status = $3, updated_at = NOW()
     WHERE id = $4`,
    [JSON.stringify(flags), fraudScore, newStatus, verificationId]
  );

  // ── Insert audit log ─────────────────────────────────
  await pool.query(
    `INSERT INTO audit_logs (verification_id, action, details)
     VALUES ($1, $2, $3)`,
    [
      verificationId,
      `FRAUD_CHECK_${newStatus.toUpperCase()}`,
      JSON.stringify({ fraudScore, flags, documentType }),
    ]
  );

  // Invalidate caches
  await invalidateCache('kyc:status');
  await invalidateCache('admin:queue');
  await invalidateCache('admin:stats');

  return { status: newStatus, fraudScore, flags };
}

// ── Worker Event Handlers ───────────────────────────────
ocrWorker.on('completed', (job, result) => {
  console.log(`[OCR] Job ${job.id} completed → ${result.fraudResult.status}`);
});

ocrWorker.on('failed', async (job, err) => {
  console.error(`[OCR] Job ${job?.id} failed:`, err.stack || err.message || err);

  // On final failure, mark verification as manual_review
  if (job && job.attemptsMade >= job.opts.attempts) {
    try {
      await pool.query(
        "UPDATE verifications SET status = 'manual_review', updated_at = NOW() WHERE id = $1",
        [job.data.verificationId]
      );
      await invalidateCache('kyc:status');
      await invalidateCache('admin:queue');
      await invalidateCache('admin:stats');

      console.log(`[OCR] Verification ${job.data.verificationId} moved to manual_review after all retries exhausted`);
    } catch (dbErr) {
      console.error('[OCR] Failed to update status after failure:', dbErr.message);
    }
  }
});

ocrWorker.on('stalled', (jobId) => {
  console.warn(`[OCR] Job ${jobId} stalled — will be reprocessed`);
});

module.exports = ocrWorker;
