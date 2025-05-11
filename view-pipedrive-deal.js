const axios = require('axios');
const fs = require('fs');
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

    console.log('Fetching a single deal from Pipedrive...');
    const response = await axios.get(
      `https://api.pipedrive.com/v1/deals?api_token=${PIPEDRIVE_API_TOKEN}&status=open&limit=1`
    );

    if (!response.data || !response.data.success) {
      console.error('Failed to fetch deals');
      return;
    }

    const deals = response.data.data || [];
    
    if (deals.length === 0) {
      console.log('No deals found');
      return;
    }

    const deal = deals[0];
    
    // Write the full deal object to a file for reference
    fs.writeFileSync('deal-full.json', JSON.stringify(deal, null, 2));
    console.log('Complete deal structure written to deal-full.json');
    
    // Log important parts to console
    console.log('\nDEAL STRUCTURE ANALYSIS:');
    console.log('------------------------');
    console.log(`Title: ${deal.title}`);
    console.log(`ID: ${deal.id}`);
    
    // Organization info
    console.log('\nORGANIZATION INFO:');
    if (deal.org_id) {
      console.log(`Type: ${typeof deal.org_id}`);
      console.log(`Full value: ${JSON.stringify(deal.org_id)}`);
      console.log('\nOrganization object properties:');
      
      if (typeof deal.org_id === 'object') {
        Object.keys(deal.org_id).forEach(key => {
          console.log(`  ${key}: ${JSON.stringify(deal.org_id[key])} (${typeof deal.org_id[key]})`);
        });
      }
    } else {
      console.log('No organization associated with this deal');
    }
    
    // Person info
    console.log('\nPERSON INFO:');
    if (deal.person_id) {
      console.log(`Type: ${typeof deal.person_id}`);
      console.log(`Full value: ${JSON.stringify(deal.person_id)}`);
    } else {
      console.log('No person associated with this deal');
    }
    
    // Stage info
    console.log('\nSTAGE INFO:');
    console.log(`stage_id: ${deal.stage_id} (${typeof deal.stage_id})`);
    console.log(`stage_name: ${deal.stage_name}`);
    
    console.log('\nThis analysis should help identify how to properly extract the organization ID.');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

main(); 