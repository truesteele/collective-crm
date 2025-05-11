-- Create fundraising_pipelines table
CREATE TABLE IF NOT EXISTS fundraising_pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create pipeline_stages table
CREATE TABLE IF NOT EXISTS pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID NOT NULL REFERENCES fundraising_pipelines(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create fundraising_deals table
CREATE TABLE IF NOT EXISTS fundraising_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  pipeline_id UUID NOT NULL REFERENCES fundraising_pipelines(id) ON DELETE CASCADE,
  stage_id UUID NOT NULL REFERENCES pipeline_stages(id) ON DELETE CASCADE,
  amount NUMERIC DEFAULT NULL,
  contact_person_id UUID DEFAULT NULL REFERENCES people(id) ON DELETE SET NULL,
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Set up RLS policies for fundraising_pipelines table
ALTER TABLE fundraising_pipelines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all operations for authenticated users" ON fundraising_pipelines
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Set up RLS policies for pipeline_stages table
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all operations for authenticated users" ON pipeline_stages
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Set up RLS policies for fundraising_deals table
ALTER TABLE fundraising_deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all operations for authenticated users" ON fundraising_deals
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS pipeline_stages_pipeline_id_idx ON pipeline_stages(pipeline_id);
CREATE INDEX IF NOT EXISTS pipeline_stages_order_idx ON pipeline_stages("order");
CREATE INDEX IF NOT EXISTS fundraising_deals_pipeline_id_idx ON fundraising_deals(pipeline_id);
CREATE INDEX IF NOT EXISTS fundraising_deals_stage_id_idx ON fundraising_deals(stage_id);
CREATE INDEX IF NOT EXISTS fundraising_deals_organization_id_idx ON fundraising_deals(organization_id);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to auto-update the updated_at column
CREATE TRIGGER update_fundraising_pipelines_updated_at
BEFORE UPDATE ON fundraising_pipelines
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pipeline_stages_updated_at
BEFORE UPDATE ON pipeline_stages
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fundraising_deals_updated_at
BEFORE UPDATE ON fundraising_deals
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column(); 