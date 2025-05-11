const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from parent directory's .env file
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const PIPEDRIVE_API_TOKEN = process.env.PIPEDRIVE_API_TOKEN;

async function main() {
  try {
    if (!PIPEDRIVE_API_TOKEN) {
      console.error('PIPEDRIVE_API_TOKEN not found');
      return;
    }

    // First get pipeline stages from Pipedrive
    console.log('Fetching pipelines and stages from Pipedrive...');
    const pipelineResponse = await axios.get(
      `https://api.pipedrive.com/v1/pipelines?api_token=${PIPEDRIVE_API_TOKEN}`
    );

    if (!pipelineResponse.data || !pipelineResponse.data.success) {
      console.error('Failed to fetch pipelines');
      return;
    }

    const pipelines = pipelineResponse.data.data || [];
    
    if (pipelines.length === 0) {
      console.log('No pipelines found in Pipedrive');
      return;
    }

    console.log(`Found ${pipelines.length} pipelines in Pipedrive`);
    
    // Get stages for each pipeline
    for (const pipeline of pipelines) {
      console.log(`\nPipeline: ${pipeline.name} (ID: ${pipeline.id})`);
      
      const stagesResponse = await axios.get(
        `https://api.pipedrive.com/v1/stages?pipeline_id=${pipeline.id}&api_token=${PIPEDRIVE_API_TOKEN}`
      );
      
      if (!stagesResponse.data || !stagesResponse.data.success) {
        console.error(`Failed to fetch stages for pipeline ${pipeline.name}`);
        continue;
      }
      
      const stages = stagesResponse.data.data || [];
      console.log(`Found ${stages.length} stages in pipeline "${pipeline.name}"`);
      
      console.log('Stages:');
      stages.forEach(stage => {
        console.log(`  - "${stage.name}" (ID: ${stage.id}, Order: ${stage.order_nr})`);
      });
    }
    
    // Now fetch a sample of deals to see stage data
    console.log('\n\nFetching sample deals to check stage data...');
    const dealsResponse = await axios.get(
      `https://api.pipedrive.com/v1/deals?api_token=${PIPEDRIVE_API_TOKEN}&status=open&limit=5`
    );

    if (!dealsResponse.data || !dealsResponse.data.success) {
      console.error('Failed to fetch deals');
      return;
    }

    const deals = dealsResponse.data.data || [];
    
    if (deals.length === 0) {
      console.log('No deals found in Pipedrive');
      return;
    }

    console.log(`\nSample of ${deals.length} deals in Pipedrive:`);
    
    deals.forEach(deal => {
      console.log(`\nDeal: "${deal.title}"`);
      console.log(`  Pipeline ID: ${deal.pipeline_id}`);
      console.log(`  Stage ID: ${deal.stage_id}`);
      console.log(`  Stage Name: ${deal.stage_name}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main(); 