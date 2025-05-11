-- Check if pipeline exists first
DO $$
DECLARE
  pipeline_id UUID;
BEGIN
  -- Check if Institutional Fundraising pipeline already exists
  SELECT id INTO pipeline_id FROM fundraising_pipelines WHERE name = 'Institutional Fundraising';
  
  -- If it doesn't exist, create it
  IF pipeline_id IS NULL THEN
    INSERT INTO fundraising_pipelines (name) 
    VALUES ('Institutional Fundraising')
    RETURNING id INTO pipeline_id;
    
    -- Now create the stages for this pipeline
    INSERT INTO pipeline_stages (pipeline_id, name, "order")
    VALUES 
      (pipeline_id, 'Qualified Prospect', 0),
      (pipeline_id, 'Outreach Sent', 1),
      (pipeline_id, 'Contact Made', 2),
      (pipeline_id, 'Meeting Scheduled', 3),
      (pipeline_id, 'Long-Term Cultivation', 4),
      (pipeline_id, 'Holding for Grant Cycle', 5),
      (pipeline_id, 'Grant In Progress (LOI)', 6),
      (pipeline_id, 'Grant In Progress (Full)', 7),
      (pipeline_id, 'Grant Submitted (Online)', 8),
      (pipeline_id, 'Grant Submitted (In Person)', 9),
      (pipeline_id, 'Declined', 10);
      
    RAISE NOTICE 'Created Institutional Fundraising pipeline with ID %', pipeline_id;
  ELSE
    RAISE NOTICE 'Institutional Fundraising pipeline already exists with ID %', pipeline_id;
  END IF;
END $$; 