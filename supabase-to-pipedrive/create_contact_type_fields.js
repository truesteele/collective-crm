require('dotenv').config();
const axios = require('axios');

// Pipedrive API token from .env file
const PIPEDRIVE_API_TOKEN = process.env.PIPEDRIVE_API_TOKEN;

// Base URL for Pipedrive API
const PIPEDRIVE_API_URL = 'https://api.pipedrive.com/v1';

// Contact types from Supabase CRM
const contactTypes = [
  "Participant",
  "Prospective Participant",
  "Individual Donor",
  "Prospective Individual Donor",
  "Institutional Donor",
  "Prospective Institutional Donor",
  "Product Partner",
  "Prospective Product Partner",
  "Program Partner",
  "Prospective Program Partner",
  "Corporate Partner",
  "Prospective Corporate Partner",
  "Influencer",
  "Media Contact",
  "Volunteer",
  "Advisor",
  "Board",
  "Staff",
  "Vendor"
];

// Create options array in the format Pipedrive expects
const createOptionsArray = () => {
  return contactTypes.map(type => ({ label: type }));
};

// Function to create a custom field in Pipedrive
async function createCustomField(name) {
  try {
    console.log(`Creating custom field: ${name}...`);
    
    const response = await axios({
      method: 'POST',
      url: `${PIPEDRIVE_API_URL}/personFields`,
      params: { api_token: PIPEDRIVE_API_TOKEN },
      data: {
        name: name,
        field_type: 'enum', // Single option field
        options: createOptionsArray()
      }
    });
    
    if (response.data.success) {
      console.log(`✅ Successfully created custom field: ${name}`);
      console.log(`   Field ID: ${response.data.data.id}`);
      console.log(`   Field Key: ${response.data.data.key}`);
      return response.data.data;
    } else {
      console.error(`❌ Error creating custom field ${name}:`, response.data.error);
      return null;
    }
  } catch (error) {
    console.error(`❌ Exception when creating custom field ${name}:`, error.message);
    if (error.response) {
      console.error('Error response data:', error.response.data);
    }
    return null;
  }
}

// Main function to create both custom fields
async function createContactTypeFields() {
  console.log('Creating contact type custom fields in Pipedrive...');
  
  // Create Primary Contact Type field
  const primaryField = await createCustomField('Primary Contact Type');
  
  // Create Secondary Contact Type field
  const secondaryField = await createCustomField('Secondary Contact Type');
  
  if (primaryField && secondaryField) {
    console.log('\n✅ Successfully created both contact type fields!');
    console.log('\nNext steps:');
    console.log('1. Update the sync_from_pipedrive.js script to handle these fields when importing contacts');
    console.log('2. Update the supabase_to_pipedrive.js script to export these fields to Pipedrive');
  } else {
    console.log('\n❌ Failed to create one or both contact type fields.');
  }
}

// Run the script
createContactTypeFields().catch(error => {
  console.error('An error occurred:', error);
}); 