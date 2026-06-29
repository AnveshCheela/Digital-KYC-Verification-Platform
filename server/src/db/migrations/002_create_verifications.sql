CREATE TABLE IF NOT EXISTS verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_type VARCHAR(20) NOT NULL CHECK (document_type IN ('pan', 'aadhaar')),
  document_path VARCHAR(500) NOT NULL,
  document_hash VARCHAR(64) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'approved', 'rejected', 'manual_review')),
  ocr_data JSONB,
  ocr_confidence FLOAT,
  fraud_flags JSONB DEFAULT '[]'::jsonb,
  fraud_score FLOAT DEFAULT 0,
  reviewed_by UUID REFERENCES users(id),
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verifications_user_id ON verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_verifications_status ON verifications(status);
CREATE INDEX IF NOT EXISTS idx_verifications_document_hash ON verifications(document_hash);
CREATE INDEX IF NOT EXISTS idx_verifications_created_at ON verifications(created_at DESC);
