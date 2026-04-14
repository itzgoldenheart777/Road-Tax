-- =============================================
-- VAHAN Road Tax Manager - Supabase Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_number TEXT NOT NULL UNIQUE,
  chassis_last5 TEXT NOT NULL,
  owner_name TEXT,
  vehicle_type TEXT DEFAULT 'Private',
  mobile_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tax payments table
CREATE TABLE IF NOT EXISTS tax_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  vehicle_number TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  period_label TEXT NOT NULL,  -- e.g. "Apr 2026"
  tax_type TEXT DEFAULT 'MONTHLY', -- MONTHLY, QUARTERLY, ANNUAL
  amount NUMERIC(10,2),
  receipt_filename TEXT,       -- "Road Tax - MH48CQ3166 - 01 Apr 26 to 30 Apr 26"
  receipt_url TEXT,            -- Supabase storage URL
  status TEXT DEFAULT 'PENDING', -- PENDING, PAID, FAILED
  payment_date TIMESTAMPTZ,
  transaction_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_payments ENABLE ROW LEVEL SECURITY;

-- For simplicity (single user / team), allow all operations
-- In production, tie to auth.uid()
CREATE POLICY "Allow all on vehicles" ON vehicles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on tax_payments" ON tax_payments FOR ALL USING (true) WITH CHECK (true);

-- Storage bucket for receipts
INSERT INTO storage.buckets (id, name, public) 
VALUES ('receipts', 'receipts', true)
ON CONFLICT DO NOTHING;

CREATE POLICY "Allow receipt uploads" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'receipts');

CREATE POLICY "Allow receipt reads" ON storage.objects
FOR SELECT USING (bucket_id = 'receipts');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tax_payments_vehicle ON tax_payments(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_tax_payments_period_end ON tax_payments(period_end);
CREATE INDEX IF NOT EXISTS idx_vehicles_number ON vehicles(vehicle_number);

-- Helper view: vehicles with latest payment and days until expiry
CREATE OR REPLACE VIEW vehicle_status AS
SELECT 
  v.*,
  tp.period_end AS last_tax_end,
  tp.period_label AS last_period,
  tp.status AS last_payment_status,
  tp.receipt_filename,
  tp.receipt_url,
  (tp.period_end - CURRENT_DATE) AS days_until_expiry
FROM vehicles v
LEFT JOIN LATERAL (
  SELECT * FROM tax_payments 
  WHERE vehicle_id = v.id AND status = 'PAID'
  ORDER BY period_end DESC 
  LIMIT 1
) tp ON true;
