const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables from the parent directory's .env file
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

// Explicitly look for service role key in env variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
// To bypass RLS, we need to use the service role key
const serviceRoleKey = process.env.SUPABASE_SERVICE_KEY;

if (!serviceRoleKey) {
  console.error('ERROR: SUPABASE_SERVICE_KEY not found in environment variables.');
  console.error('Please add it to your .env file. You can find it in the Supabase dashboard under Project Settings > API > service_role key.');
  process.exit(1);
}

// Create Supabase client with service role to bypass RLS
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Pipedrive setup - use PIPEDRIVE_API_TOKEN instead of PIPEDRIVE_API_KEY
const PIPEDRIVE_API_TOKEN = process.env.PIPEDRIVE_API_TOKEN;

console.log('Environment:');
console.log(`NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? 'Set' : 'Not set'}`);
console.log(`SUPABASE_SERVICE_KEY: ${serviceRoleKey ? 'Set' : 'Not set'}`);
console.log(`PIPEDRIVE_API_TOKEN: ${PIPEDRIVE_API_TOKEN ? 'Set' : 'Not set'}`);

// Map Pipedrive stages to our fundraising stages
// Update these with your actual Pipedrive stage IDs or names
const stageMapping = {
  // Format: 'PIPEDRIVE_STAGE_NAME_OR_ID': 'OUR_STAGE_NAME'
  'qualified': 'Qualified Prospect',
  'outreach': 'Outreach Sent',
  'contact': 'Contact Made',
  'meeting': 'Meeting Scheduled',
  'cultivation': 'Long-Term Cultivation',
  'holding': 'Holding for Grant Cycle',
  'loi': 'Grant In Progress (LOI)',
  'full': 'Grant In Progress (Full)',
  'online': 'Grant Submitted (Online)',
  'in person': 'Grant Submitted (In Person)',
  'declined': 'Declined'
};

// Utility to map Pipedrive stage to our stage
function mapStage(pipedriveStage) {
  // Default fallback stage
  let bestMatch = 'Qualified Prospect';
  let highestMatchScore = 0;
  
  // Try to find exact match first
  if (stageMapping[pipedriveStage.toLowerCase()]) {
    return stageMapping[pipedriveStage.toLowerCase()];
  }
  
  // If no exact match, find closest match
  for (const [pipeKey, ourStage] of Object.entries(stageMapping)) {
    if (pipedriveStage.toLowerCase().includes(pipeKey)) {
      // If it's a longer match than previous best, use this one
      if (pipeKey.length > highestMatchScore) {
        highestMatchScore = pipeKey.length;
        bestMatch = ourStage;
      }
    }
  }
  
  return bestMatch;
}

async function main() {
  try {
    console.log('Starting Pipedrive deal import...');
    
    // 1. First, list all pipelines to see what we have
    console.log('Fetching all pipelines...');
    const { data: allPipelines, error: pipelinesListError } = await supabase
      .from('fundraising_pipelines')
      .select('id, name');
    
    if (pipelinesListError) {
      console.error('Error fetching pipelines:', pipelinesListError);
      return;
    }
    
    console.log('Available pipelines:');
    allPipelines.forEach(pipeline => {
      console.log(`- ${pipeline.name} (${pipeline.id})`);
    });
    
    // Choose the first pipeline or create one if none exists
    if (allPipelines.length === 0) {
      console.log('No pipelines found. Creating a new one...');
      const { data: newPipeline, error: createError } = await supabase
        .from('fundraising_pipelines')
        .insert({ name: 'Institutional Fundraising' })
        .select();
      
      if (createError) {
        console.error('Error creating pipeline:', createError);
        return;
      }
      
      console.log(`Created pipeline: ${newPipeline[0].name} (${newPipeline[0].id})`);
      var pipelineId = newPipeline[0].id;
      
      // Create default stages for this pipeline
      const stages = [
        { pipeline_id: pipelineId, name: 'Qualified Prospect', order: 0 },
        { pipeline_id: pipelineId, name: 'Outreach Sent', order: 1 },
        { pipeline_id: pipelineId, name: 'Contact Made', order: 2 },
        { pipeline_id: pipelineId, name: 'Meeting Scheduled', order: 3 },
        { pipeline_id: pipelineId, name: 'Long-Term Cultivation', order: 4 },
        { pipeline_id: pipelineId, name: 'Holding for Grant Cycle', order: 5 },
        { pipeline_id: pipelineId, name: 'Grant In Progress (LOI)', order: 6 },
        { pipeline_id: pipelineId, name: 'Grant In Progress (Full)', order: 7 },
        { pipeline_id: pipelineId, name: 'Grant Submitted (Online)', order: 8 },
        { pipeline_id: pipelineId, name: 'Grant Submitted (In Person)', order: 9 },
        { pipeline_id: pipelineId, name: 'Declined', order: 10 }
      ];
      
      const { error: stagesError } = await supabase
        .from('pipeline_stages')
        .insert(stages);
      
      if (stagesError) {
        console.error('Error creating stages:', stagesError);
        return;
      }
      
      console.log('Created default stages for the pipeline.');
    } else {
      var pipelineId = allPipelines[0].id;
      console.log(`Using pipeline: ${allPipelines[0].name} (${pipelineId})`);
    }
    
    // 2. Get all pipeline stages for reference
    const { data: stagesData, error: stagesError } = await supabase
      .from('pipeline_stages')
      .select('id, name')
      .eq('pipeline_id', pipelineId);
    
    if (stagesError || !stagesData || stagesData.length === 0) {
      console.error('Error fetching pipeline stages:', stagesError);
      return;
    }
    
    // Create a map of stage names to IDs
    const stageMap = new Map(stagesData.map(stage => [stage.name, stage.id]));
    console.log(`Found ${stagesData.length} pipeline stages`);
    
    // 3. Check API key
    if (!PIPEDRIVE_API_TOKEN) {
      console.error('PIPEDRIVE_API_TOKEN not found in environment variables.');
      console.log('Please add it to your .env file: PIPEDRIVE_API_TOKEN=your_api_token_here');
      return;
    }
    
    // 4. Fetch deals from Pipedrive
    console.log('Fetching deals from Pipedrive...');
    const pipedriveDealsResponse = await axios.get(
      `https://api.pipedrive.com/v1/deals?api_token=${PIPEDRIVE_API_TOKEN}&status=open&limit=500`
    );
    
    if (!pipedriveDealsResponse.data || !pipedriveDealsResponse.data.success) {
      console.error('Failed to fetch deals from Pipedrive:', pipedriveDealsResponse.data);
      return;
    }
    
    const pipedriveDeals = pipedriveDealsResponse.data.data || [];
    console.log(`Found ${pipedriveDeals.length} open deals in Pipedrive`);
    
    if (pipedriveDeals.length === 0) {
      console.log('No deals to import. Done!');
      return;
    }
    
    // 5. Process each deal
    let successCount = 0;
    let errorCount = 0;
    
    for (const deal of pipedriveDeals) {
      try {
        // Skip deals that aren't related to fundraising if needed
        // if (deal.pipeline_id !== YOUR_PIPEDRIVE_PIPELINE_ID) continue;
        console.log(`Processing deal: ${deal.title}`);
        
        // Find matching organization in Supabase
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('id')
          .eq('pipedrive_org_id', deal.org_id)
          .single();
        
        if (orgError || !orgData) {
          console.warn(`No matching organization found for Pipedrive org ID: ${deal.org_id}, deal: ${deal.title}`);
          errorCount++;
          continue;
        }
        
        // Find matching person if available
        let contactPersonId = null;
        if (deal.person_id) {
          const { data: personData } = await supabase
            .from('people')
            .select('id')
            .eq('pipedrive_id', deal.person_id)
            .single();
          
          if (personData) {
            contactPersonId = personData.id;
          }
        }
        
        // Map Pipedrive stage to our stage (you might need to adjust this logic based on how your Pipedrive is set up)
        const stageName = mapStage(deal.stage_name || '');
        const stageId = stageMap.get(stageName);
        
        if (!stageId) {
          console.warn(`No matching stage found for "${stageName}"`);
          errorCount++;
          continue;
        }
        
        // Create the deal in our system
        const { data: newDeal, error: dealError } = await supabase
          .from('fundraising_deals')
          .insert({
            title: deal.title,
            organization_id: orgData.id,
            pipeline_id: pipelineId,
            stage_id: stageId,
            amount: deal.value || null,
            contact_person_id: contactPersonId,
            notes: deal.notes || null
          });
        
        if (dealError) {
          console.error(`Failed to create deal "${deal.title}":`, dealError);
          errorCount++;
        } else {
          console.log(`Created deal: ${deal.title}`);
          successCount++;
        }
      } catch (error) {
        console.error(`Error processing deal ${deal.title}:`, error);
        errorCount++;
      }
    }
    
    console.log(`Import completed! Successful: ${successCount}, Errors: ${errorCount}`);
    
  } catch (error) {
    console.error('Import failed:', error);
  }
}

// Run the script
main(); 