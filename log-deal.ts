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

    // Write the deal data to a file
    fs.writeFileSync('pipedrive-deals.json', JSON.stringify(deals, null, 2));
    console.log('Deal data written to pipedrive-deals.json');
    
    // Log first deal's organization structure
    if (deals[0].org_id) {
      console.log('First deal organization:');
      console.log(JSON.stringify(deals[0].org_id, null, 2));
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

main(); 