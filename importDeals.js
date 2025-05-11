const axios = require('axios');
const fs = require('fs');
const dotenv = require('dotenv');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables from parent directory's .env file
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

// Setup Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_KEY;

if (!serviceRoleKey) {
  console.error('ERROR: SUPABASE_SERVICE_KEY not found in environment variables.');
  process.exit(1);
}

// Create Supabase client with service role to bypass RLS
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Pipedrive API token
const PIPEDRIVE_API_TOKEN = process.env.PIPEDRIVE_API_TOKEN;

// Stage mapping for Pipedrive stages to our stages
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
    if (pipedriveStage && pipedriveStage.toLowerCase().includes(pipeKey)) {
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
    
    if (!PIPEDRIVE_API_TOKEN) {
      console.error('PIPEDRIVE_API_TOKEN not found');
      return;
    }

    // 1. Get pipeline and stages info from Supabase
    console.log('Fetching pipeline from Supabase...');
    const { data: allPipelines, error: pipelineError } = await supabase
      .from('fundraising_pipelines')
      .select('id, name');
    
    if (pipelineError) {
      console.error('Error fetching pipelines:', pipelineError);
      return;
    }
    
    if (allPipelines.length === 0) {
      console.error('No pipelines found in Supabase.');
      return;
    }
    
    const pipelineId = allPipelines[0].id;
    console.log(`Using pipeline: ${allPipelines[0].name} (${pipelineId})`);
    
    // 2. Get pipeline stages
    const { data: stagesData, error: stagesError } = await supabase
      .from('pipeline_stages')
      .select('id, name')
      .eq('pipeline_id', pipelineId);
    
    if (stagesError || !stagesData || stagesData.length === 0) {
      console.error('Error fetching pipeline stages:', stagesError);
      return;
    }
    
    // Create a map of stage names to stage IDs
    const stageMap = new Map(stagesData.map(stage => [stage.name, stage.id]));
    console.log(`Found ${stagesData.length} pipeline stages`);

    // 3. Fetch deals from Pipedrive
    console.log('Fetching deals from Pipedrive...');
    const response = await axios.get(
      `https://api.pipedrive.com/v1/deals?api_token=${PIPEDRIVE_API_TOKEN}&status=open&limit=500`
    );

    if (!response.data || !response.data.success) {
      console.error('Failed to fetch deals');
      return;
    }

    const deals = response.data.data || [];
    
    if (deals.length === 0) {
      console.log('No deals found in Pipedrive');
      return;
    }

    console.log(`Found ${deals.length} deals in Pipedrive`);
    
    // 4. Process each deal
    let successCount = 0;
    let errorCount = 0;
    
    for (const deal of deals) {
      try {
        console.log(`\nProcessing deal: ${deal.title}`);
        
        // Extract organization ID (numeric value) from the org_id object
        if (!deal.org_id || typeof deal.org_id !== 'object' || !('value' in deal.org_id)) {
          console.warn(`Cannot extract organization ID for deal: ${deal.title}`);
          errorCount++;
          continue;
        }
        
        const pipedriveOrgId = deal.org_id.value;
        console.log(`Organization: ${deal.org_id.name}, Pipedrive ID: ${pipedriveOrgId}`);
        
        // Look up organization in Supabase by Pipedrive ID
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('id, name, pipedrive_org_id')
          .eq('pipedrive_org_id', pipedriveOrgId)
          .single();
        
        if (orgError || !orgData) {
          console.warn(`No matching organization found for "${deal.org_id.name}" (Pipedrive ID: ${pipedriveOrgId})`);
          errorCount++;
          continue;
        }
        
        console.log(`Found matching organization: ${orgData.name} (ID: ${orgData.id}, Pipedrive ID: ${orgData.pipedrive_org_id})`);
        
        // Extract person ID if available
        let contactPersonId = null;
        if (deal.person_id && typeof deal.person_id === 'object' && 'value' in deal.person_id) {
          const personId = deal.person_id.value;
          
          const { data: personData } = await supabase
            .from('people')
            .select('id, full_name')
            .eq('pipedrive_id', personId)
            .single();
          
          if (personData) {
            contactPersonId = personData.id;
            console.log(`Found matching person: ${personData.full_name} (ID: ${personData.id})`);
          }
        }
        
        // Map the stage name
        const stageName = mapStage(deal.stage_name || '');
        const stageId = stageMap.get(stageName);
        
        if (!stageId) {
          console.warn(`No matching stage found for "${stageName}"`);
          errorCount++;
          continue;
        }
        
        console.log(`Using stage: ${stageName} (ID: ${stageId})`);
        
        // Create the deal in Supabase
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
    
    console.log(`\nImport completed! Successful: ${successCount}, Errors: ${errorCount}`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

main(); 