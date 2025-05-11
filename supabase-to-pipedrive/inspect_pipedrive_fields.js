require('dotenv').config();
const axios = require('axios');

// Initialize Pipedrive API token
const pipedriveApiToken = process.env.PIPEDRIVE_API_TOKEN;
const pipedriveApiUrl = 'https://api.pipedrive.com/v1';

// Function to get all person fields from Pipedrive
async function getPersonFieldsFromPipedrive() {
  console.log('Fetching person fields from Pipedrive...');
  
  try {
    const response = await axios({
      method: 'GET',
      url: `${pipedriveApiUrl}/personFields`,
      params: { api_token: pipedriveApiToken }
    });
    
    if (response.data.success) {
      console.log(`Successfully fetched ${response.data.data.length} person fields from Pipedrive`);
      
      // Print out details of each field
      console.log('\nAvailable Person Fields:');
      console.log('-------------------------');
      response.data.data.forEach(field => {
        console.log(`Name: ${field.name}`);
        console.log(`Key: ${field.key}`);
        console.log(`Type: ${field.field_type}`);
        console.log(`Edit flag: ${field.edit_flag}`);
        console.log(`Add visible flag: ${field.add_visible_flag}`);
        console.log('-------------------------');
      });
      
      return response.data.data;
    } else {
      console.error('Error fetching person fields from Pipedrive:', response.data.error);
      return [];
    }
  } catch (error) {
    console.error('Exception when fetching person fields from Pipedrive:', error.message);
    if (error.response) {
      console.error('Error response data:', error.response.data);
    }
    return [];
  }
}

// Run the function
getPersonFieldsFromPipedrive()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  }); 