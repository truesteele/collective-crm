const axios = require('axios');
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

if (!PIPEDRIVE_API_TOKEN) {
  console.error('PIPEDRIVE_API_TOKEN not found in environment variables.');
  process.exit(1);
}

// Direct mapping from Pipedrive stage IDs to our stage names
const pipedriveStageIdToName = {
  // Pipedrive: Funder Pipeline stages
  '1': 'Qualified Prospect',
  '13': 'Outreach Sent',
  '2': 'Contact Made',
  '6': 'Meeting Scheduled',
  '9': 'Long-Term Cultivation',
  '8': 'Holding for Grant Cycle',
  '10': 'Grant In Progress (LOI)',   // Grant In Progress (Open) → LOI
  '11': 'Grant In Progress (Full)',  // Grant In Progress (Invite) → Full
  '3': 'Grant Submitted (Online)',   // Grant Submitted (Open) → Online
  '12': 'Grant Submitted (In Person)', // Grant Submitted (Invite) → In Person
  '20': 'Declined',
  
  // Fallbacks from the original name-based mapping
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
function mapStage(pipedriveStageId, pipedriveStageNameFallback) {
  // First try to map by stage ID (most reliable)
  if (pipedriveStageIdToName[pipedriveStageId]) {
    return pipedriveStageIdToName[pipedriveStageId];
  }
  
  // Fallback: try to map by stage name if ID mapping failed
  if (pipedriveStageNameFallback) {
    const stageName = pipedriveStageNameFallback.toLowerCase();
    
    // Try direct mapping first
    if (pipedriveStageIdToName[stageName]) {
      return pipedriveStageIdToName[stageName];
    }
    
    // Try partial match as last resort
    let bestMatch = 'Qualified Prospect'; // Default fallback
    let highestMatchScore = 0;
    
    for (const [pipeKey, ourStage] of Object.entries(pipedriveStageIdToName)) {
      if (isNaN(pipeKey) && stageName.includes(pipeKey)) {
        // Only consider non-numeric keys for partial matching
        if (pipeKey.length > highestMatchScore) {
          highestMatchScore = pipeKey.length;
          bestMatch = ourStage;
        }
      }
    }
    
    return bestMatch;
  }
  
  // Ultimate fallback
  return 'Qualified Prospect';
}

// Create or get the default pipeline
async function getOrCreatePipeline() {
  console.log('Getting or creating fundraising pipeline...');
  
  const { data: allPipelines, error: pipelineError } = await supabase
    .from('fundraising_pipelines')
    .select('id, name');
  
  if (pipelineError) {
    console.error('Error fetching pipelines:', pipelineError);
    throw new Error('Failed to fetch pipelines');
  }
  
  if (allPipelines.length > 0) {
    const pipeline = allPipelines[0];
    console.log(`Using existing pipeline: ${pipeline.name} (${pipeline.id})`);
    return pipeline.id;
  }
  
  // Create a new pipeline if none exists
  console.log('No pipelines found. Creating a new one...');
  const { data: newPipeline, error: createError } = await supabase
    .from('fundraising_pipelines')
    .insert({ name: 'Institutional Fundraising' })
    .select();
  
  if (createError || !newPipeline) {
    console.error('Error creating pipeline:', createError);
    throw new Error('Failed to create pipeline');
  }
  
  console.log(`Created pipeline: ${newPipeline[0].name} (${newPipeline[0].id})`);
  
  // Create default stages for this pipeline
  const stages = [
    { pipeline_id: newPipeline[0].id, name: 'Qualified Prospect', order: 0 },
    { pipeline_id: newPipeline[0].id, name: 'Outreach Sent', order: 1 },
    { pipeline_id: newPipeline[0].id, name: 'Contact Made', order: 2 },
    { pipeline_id: newPipeline[0].id, name: 'Meeting Scheduled', order: 3 },
    { pipeline_id: newPipeline[0].id, name: 'Long-Term Cultivation', order: 4 },
    { pipeline_id: newPipeline[0].id, name: 'Holding for Grant Cycle', order: 5 },
    { pipeline_id: newPipeline[0].id, name: 'Grant In Progress (LOI)', order: 6 },
    { pipeline_id: newPipeline[0].id, name: 'Grant In Progress (Full)', order: 7 },
    { pipeline_id: newPipeline[0].id, name: 'Grant Submitted (Online)', order: 8 },
    { pipeline_id: newPipeline[0].id, name: 'Grant Submitted (In Person)', order: 9 },
    { pipeline_id: newPipeline[0].id, name: 'Declined', order: 10 }
  ];
  
  const { error: stagesError } = await supabase
    .from('pipeline_stages')
    .insert(stages);
  
  if (stagesError) {
    console.error('Error creating stages:', stagesError);
    throw new Error('Failed to create pipeline stages');
  }
  
  console.log('Created default stages for the pipeline.');
  return newPipeline[0].id;
}

// Get pipeline stages
async function getPipelineStages(pipelineId) {
  console.log('Fetching pipeline stages...');
  
  const { data: stagesData, error: stagesError } = await supabase
    .from('pipeline_stages')
    .select('id, name')
    .eq('pipeline_id', pipelineId);
  
  if (stagesError || !stagesData || stagesData.length === 0) {
    console.error('Error fetching pipeline stages:', stagesError);
    throw new Error('Failed to fetch pipeline stages');
  }
  
  // Create a map of stage names to IDs
  const stageMap = new Map(stagesData.map(stage => [stage.name, stage.id]));
  console.log(`Found ${stagesData.length} pipeline stages`);
  
  return stageMap;
}

// Sync deals from Pipedrive to Supabase
async function syncDeals() {
  try {
    console.log('\n=== SYNCING DEALS FROM PIPEDRIVE ===');
    
    // 1. Get pipeline and stages
    const pipelineId = await getOrCreatePipeline();
    const stageMap = await getPipelineStages(pipelineId);
    
    // 2. Fetch deals from Pipedrive
    console.log('Fetching deals from Pipedrive...');
    const response = await axios.get(
      `https://api.pipedrive.com/v1/deals?api_token=${PIPEDRIVE_API_TOKEN}&status=open&limit=500`
    );

    if (!response.data || !response.data.success) {
      console.error('Failed to fetch deals from Pipedrive');
      return;
    }

    const pipedriveDeals = response.data.data || [];
    
    if (pipedriveDeals.length === 0) {
      console.log('No deals found in Pipedrive');
      return;
    }

    console.log(`Found ${pipedriveDeals.length} deals in Pipedrive`);
    
    // 3. Get existing deals from Supabase
    console.log('Fetching existing deals from Supabase...');
    const { data: existingDeals, error: dealsError } = await supabase
      .from('fundraising_deals')
      .select('id, title, organization_id, organizations(pipedrive_org_id)');
    
    if (dealsError) {
      console.error('Error fetching existing deals:', dealsError);
      return;
    }
    
    console.log(`Found ${existingDeals?.length || 0} existing deals in Supabase`);
    
    // 4. Create a mapping from organization ID + title to existing deal
    const orgIdToDealMap = new Map();
    if (existingDeals) {
      existingDeals.forEach(deal => {
        if (deal.organizations?.pipedrive_org_id) {
          // Use the title as another key to handle multiple deals per org
          const key = `${deal.organizations.pipedrive_org_id}_${deal.title}`;
          orgIdToDealMap.set(key, deal);
        }
      });
    }
    
    // 5. Process each Pipedrive deal - update existing or create new ones
    let createCount = 0;
    let updateCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    let stageStats = {};
    
    for (const pipedriveDeal of pipedriveDeals) {
      try {
        console.log(`\nProcessing Pipedrive deal: ${pipedriveDeal.title}`);
        
        // Extract organization ID from Pipedrive deal
        if (!pipedriveDeal.org_id || typeof pipedriveDeal.org_id !== 'object' || !('value' in pipedriveDeal.org_id)) {
          console.warn(`No organization for Pipedrive deal: ${pipedriveDeal.title}`);
          skippedCount++;
          continue;
        }
        
        const pipedriveOrgId = pipedriveDeal.org_id.value.toString();
        const orgName = pipedriveDeal.org_id.name;
        const dealTitle = pipedriveDeal.title;
        
        // Look up organization in Supabase by Pipedrive ID
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('id, name, pipedrive_org_id')
          .eq('pipedrive_org_id', pipedriveOrgId)
          .single();
        
        if (orgError || !orgData) {
          console.warn(`No matching organization found for "${orgName}" (Pipedrive ID: ${pipedriveOrgId})`);
          skippedCount++;
          continue;
        }
        
        console.log(`Found matching organization: ${orgData.name} (ID: ${orgData.id})`);
        
        // Extract person ID if available
        let contactPersonId = null;
        if (pipedriveDeal.person_id && typeof pipedriveDeal.person_id === 'object' && 'value' in pipedriveDeal.person_id) {
          const personId = pipedriveDeal.person_id.value;
          
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
        
        // Map the Pipedrive stage to Supabase stage
        const pipedriveStageId = pipedriveDeal.stage_id.toString();
        const stageName = mapStage(pipedriveStageId, pipedriveDeal.stage_name);
        const stageId = stageMap.get(stageName);
        
        if (!stageId) {
          console.warn(`No matching stage found for "${stageName}"`);
          errorCount++;
          continue;
        }
        
        console.log(`Mapped Pipedrive stage ID ${pipedriveStageId} to "${stageName}"`);
        
        // Track stage mapping stats
        if (!stageStats[stageName]) {
          stageStats[stageName] = 0;
        }
        stageStats[stageName]++;
        
        // Check if deal already exists
        const key = `${pipedriveOrgId}_${dealTitle}`;
        const existingDeal = orgIdToDealMap.get(key);
        
        if (existingDeal) {
          // Update existing deal
          const { error: updateError } = await supabase
            .from('fundraising_deals')
            .update({
              stage_id: stageId, 
              amount: pipedriveDeal.value || null,
              notes: pipedriveDeal.notes || null,
              contact_person_id: contactPersonId
            })
            .eq('id', existingDeal.id);
            
          if (updateError) {
            console.error(`Failed to update deal "${dealTitle}":`, updateError);
            errorCount++;
          } else {
            console.log(`Updated deal: ${dealTitle} to stage "${stageName}"`);
            updateCount++;
          }
        } else {
          // Create new deal
          const { error: createError } = await supabase
            .from('fundraising_deals')
            .insert({
              title: dealTitle,
              organization_id: orgData.id,
              pipeline_id: pipelineId,
              stage_id: stageId,
              amount: pipedriveDeal.value || null,
              contact_person_id: contactPersonId,
              notes: pipedriveDeal.notes || null
            });
            
          if (createError) {
            console.error(`Failed to create deal "${dealTitle}":`, createError);
            errorCount++;
          } else {
            console.log(`Created new deal: ${dealTitle}`);
            createCount++;
          }
        }
      } catch (error) {
        console.error(`Error processing deal ${pipedriveDeal?.title || 'unknown'}:`, error);
        errorCount++;
      }
    }
    
    console.log(`\nDeals sync completed!`);
    console.log(`Created: ${createCount}, Updated: ${updateCount}, Errors: ${errorCount}, Skipped: ${skippedCount}`);
    console.log('\nStage distribution:');
    Object.entries(stageStats).forEach(([stage, count]) => {
      console.log(`- ${stage}: ${count} deals`);
    });
    
  } catch (error) {
    console.error('Error syncing deals:', error);
  }
}

// Main function to run everything
async function main() {
  try {
    console.log('Starting Pipedrive sync process...');
    
    // First sync deals
    await syncDeals();
    
    // Success!
    console.log('\nSync completed successfully!');
    
  } catch (error) {
    console.error('Sync process failed:', error);
  }
}

// Run the script
main(); 