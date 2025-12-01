-- Create SIPs table for systematic investment plans
CREATE TABLE sips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  asset_name text NOT NULL,
  asset_index int NOT NULL,
  monthly_amount_usdc decimal NOT NULL CHECK (monthly_amount_usdc >= 1000),
  status text DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'paused', 'cancelled')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE sips ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (can be restricted later)
CREATE POLICY "Allow all on sips" ON sips FOR ALL USING (true);

-- Create index on user_id for faster queries
CREATE INDEX idx_sips_user_id ON sips(user_id);

-- Create index on status for filtering active SIPs
CREATE INDEX idx_sips_status ON sips(status);
