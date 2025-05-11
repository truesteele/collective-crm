const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables from the parent directory's .env file
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

// Pipedrive API token
const PIPEDRIVE_API_TOKEN = process.env.PIPEDRIVE_API_TOKEN;

async function main() {
  try {
    console.log('Fetching deals from Pipedrive for debugging...');
    
    if (!PIPEDRIVE_API_TOKEN) {
      console.error('PIPEDRIVE_API_TOKEN not found in environment variables.');
      return;
    }
    
    const pipedriveDealsResponse = await axios.get(
      `https://api.pipedrive.com/v1/deals?api_token=${PIPEDRIVE_API_TOKEN}&status=open&limit=10`
    );
    
    if (!pipedriveDealsResponse.data || !pipedriveDealsResponse.data.success) {
      console.error('Failed to fetch deals from Pipedrive:', pipedriveDealsResponse.data);
      return;
    }
    
    const pipedriveDeals = pipedriveDealsResponse.data.data || [];
    console.log(`Found ${pipedriveDeals.length} deals for debugging`);
    
    if (pipedriveDeals.length === 0) {
      console.log('No deals to debug');
      return;
    }
    
    // Write the full deal objects to a file
    fs.writeFileSync('pipedrive-deals-debug.json', JSON.stringify(pipedriveDeals, null, 2));
    console.log('First 10 deals written to pipedrive-deals-debug.json');
    
    // Specifically extract org_id structure
    const orgData = pipedriveDeals.map(deal => ({
      title: deal.title,
      org_id: deal.org_id
    }));
    
    console.log('\nFirst 3 organizations:');
    orgData.slice(0, 3).forEach(item => {
      console.log(`Deal: ${item.title}`);
      console.log(`  org_id: ${JSON.stringify(item.org_id)}`);
      
      if (item.org_id) {
        console.log('  Properties:');
        Object.keys(item.org_id).forEach(key => {
          console.log(`    ${key}: ${JSON.stringify(item.org_id[key])} (${typeof item.org_id[key]})`);
        });
      } else {
        console.log('  No organization linked');
      }
      console.log('---');
    });
    
  } catch (error) {
    console.error('Debug failed:', error);
  }
}

// Run the script
main(); 