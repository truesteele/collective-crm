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

    console.log('Fetching deals from Pipedrive...');
    const response = await axios.get(
      `https://api.pipedrive.com/v1/deals?api_token=${PIPEDRIVE_API_TOKEN}&status=open&limit=5`
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

    console.log(`Found ${deals.length} deals for debugging`);
    
    // Log all organization IDs for troubleshooting
    const orgInfo = deals.map(deal => {
      const info = {
        dealTitle: deal.title,
        dealId: deal.id,
        organization: deal.org_id,
        orgName: deal.org_id ? deal.org_id.name : 'No org',
        orgValue: deal.org_id ? deal.org_id.value : null,
        stage: {
          stage_id: deal.stage_id,
          stage_name: deal.stage_name
        }
      };
      
      return info;
    });
    
    fs.writeFileSync('deal-org-values.json', JSON.stringify(orgInfo, null, 2));
    console.log('Deal organization values written to deal-org-values.json');
    
    console.log('\nORGANIZATION ANALYSIS:');
    console.log('------------------------');
    
    orgInfo.forEach((info, index) => {
      console.log(`Deal ${index + 1}: ${info.dealTitle}`);
      console.log(`  Organization Name: ${info.orgName}`);
      console.log(`  Organization Value (Pipedrive ID): ${info.orgValue}`);
      console.log('  ---');
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

main(); 