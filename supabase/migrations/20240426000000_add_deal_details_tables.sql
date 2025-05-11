-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table for storing deal notes (allowing multiple notes per deal)
CREATE TABLE IF NOT EXISTS deal_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID NOT NULL REFERENCES fundraising_deals(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Table for storing stage change history
CREATE TABLE IF NOT EXISTS deal_stage_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID NOT NULL REFERENCES fundraising_deals(id) ON DELETE CASCADE,
  from_stage_id UUID REFERENCES pipeline_stages(id) ON DELETE SET NULL,
  to_stage_id UUID NOT NULL REFERENCES pipeline_stages(id) ON DELETE CASCADE,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  changed_by UUID REFERENCES auth.users(id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS deal_notes_deal_id_idx ON deal_notes(deal_id);
CREATE INDEX IF NOT EXISTS deal_stage_history_deal_id_idx ON deal_stage_history(deal_id);

-- Migrate existing notes to the new notes table
INSERT INTO deal_notes (deal_id, content, created_at, updated_at)
SELECT 
  id as deal_id, 
  notes as content, 
  NOW() as created_at, 
  NOW() as updated_at
FROM fundraising_deals
WHERE notes IS NOT NULL AND notes != '';

-- Setup RLS policies
ALTER TABLE deal_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_stage_history ENABLE ROW LEVEL SECURITY;

-- Create policies for deal_notes
CREATE POLICY "Anyone can view deal notes"
  ON deal_notes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert deal notes"
  ON deal_notes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own deal notes"
  ON deal_notes FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Create policies for deal_stage_history
CREATE POLICY "Anyone can view deal stage history"
  ON deal_stage_history FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert deal stage history"
  ON deal_stage_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add trigger to automatically record stage changes
CREATE OR REPLACE FUNCTION record_deal_stage_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.stage_id IS DISTINCT FROM NEW.stage_id THEN
    INSERT INTO deal_stage_history (
      deal_id, 
      from_stage_id, 
      to_stage_id, 
      changed_by
    ) VALUES (
      NEW.id, 
      OLD.stage_id, 
      NEW.stage_id, 
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER deal_stage_change
AFTER UPDATE ON fundraising_deals
FOR EACH ROW
EXECUTE FUNCTION record_deal_stage_change(); 