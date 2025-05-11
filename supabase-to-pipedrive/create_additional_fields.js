require('dotenv').config();
const axios = require('axios');

// Pipedrive API token from .env file
const PIPEDRIVE_API_TOKEN = process.env.PIPEDRIVE_API_TOKEN;

// Base URL for Pipedrive API
const PIPEDRIVE_API_URL = 'https://api.pipedrive.com/v1';

// Additional fields to add to Pipedrive
const additionalFields = [
  { name: 'Headline', type: 'varchar', description: 'LinkedIn headline or short professional description' },
  { name: 'Summary', type: 'text', description: 'Longer professional bio or description' },
  { name: 'LinkedIn Followers', type: 'double', description: 'Number of LinkedIn followers' },
  { name: 'Location', type: 'varchar', description: 'Person\'s location' }
];

// Function to create a custom field in Pipedrive
async function createCustomField(name, fieldType, description) {
  try {
    console.log(`Creating custom field: ${name}...`);
    
    const response = await axios({
      method: 'POST',
      url: `${PIPEDRIVE_API_URL}/personFields`,
      params: { api_token: PIPEDRIVE_API_TOKEN },
      data: {
        name: name,
        field_type: fieldType
      }
    });
    
    if (response.data.success) {
      console.log(`✅ Successfully created custom field: ${name}`);
      console.log(`   Field ID: ${response.data.data.id}`);
      console.log(`   Field Key: ${response.data.data.key}`);
      console.log(`   Purpose: ${description}`);
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

// Main function to create all additional fields
async function createAdditionalFields() {
  console.log('Creating additional custom fields in Pipedrive...');
  
  const results = [];
  
  for (const field of additionalFields) {
    const result = await createCustomField(field.name, field.type, field.description);
    if (result) {
      results.push({
        name: field.name,
        key: result.key,
        id: result.id
      });
    }
  }
  
  if (results.length === additionalFields.length) {
    console.log('\n✅ Successfully created all additional custom fields!');
    console.log('\nField mappings to use in scripts:');
    
    const mappings = {};
    results.forEach(field => {
      // Convert field name to lowercase and normalize spaces to underscores for key names
      const keyName = field.name.toLowerCase().replace(/\s+/g, '_');
      mappings[keyName] = field.key;
    });
    
    console.log(JSON.stringify(mappings, null, 2));
    
    console.log('\nNext step:');
    console.log('Update the supabase_to_pipedrive.js script to include these new fields');
  } else {
    console.log(`\n⚠️ Created ${results.length} of ${additionalFields.length} fields.`);
  }
}

// Run the script
createAdditionalFields().catch(error => {
  console.error('An error occurred:', error);
}); 