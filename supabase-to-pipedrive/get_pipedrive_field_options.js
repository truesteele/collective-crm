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

// Function to get specific field details including all options
async function getFieldDetails(fieldId) {
  console.log(`Fetching details for field ID: ${fieldId}`);
  
  try {
    const response = await axios({
      method: 'GET',
      url: `${pipedriveApiUrl}/personFields/${fieldId}`,
      params: { api_token: pipedriveApiToken }
    });
    
    if (response.data.success) {
      return response.data.data;
    } else {
      console.error(`Error fetching field details for ID ${fieldId}:`, response.data.error);
      return null;
    }
  } catch (error) {
    console.error(`Exception when fetching field details for ID ${fieldId}:`, error.message);
    if (error.response) {
      console.error('Error response data:', error.response.data);
    }
    return null;
  }
}

// Main function to find contact type fields and retrieve their options
async function getContactTypeFieldOptions() {
  try {
    // Get all person fields
    const personFields = await getPersonFieldsFromPipedrive();
    
    // Find the Primary Contact Type and Secondary Contact Type fields
    const primaryContactTypeField = personFields.find(field => 
      field.name.toLowerCase() === 'primary contact type');
    
    const secondaryContactTypeField = personFields.find(field => 
      field.name.toLowerCase() === 'secondary contact type');
    
    if (!primaryContactTypeField) {
      console.log('Primary Contact Type field not found');
      return;
    }
    
    if (!secondaryContactTypeField) {
      console.log('Secondary Contact Type field not found');
      return;
    }
    
    console.log(`\nPrimary Contact Type field found with ID: ${primaryContactTypeField.id}, Key: ${primaryContactTypeField.key}`);
    console.log(`Secondary Contact Type field found with ID: ${secondaryContactTypeField.id}, Key: ${secondaryContactTypeField.key}`);
    
    // Get detailed field information (including all options)
    const primaryFieldDetails = await getFieldDetails(primaryContactTypeField.id);
    const secondaryFieldDetails = await getFieldDetails(secondaryContactTypeField.id);
    
    if (!primaryFieldDetails || !secondaryFieldDetails) {
      console.log('Could not retrieve complete field details');
      return;
    }
    
    // Create mappings of option IDs to option labels
    console.log('\n=== PRIMARY CONTACT TYPE OPTIONS ===');
    const primaryOptions = primaryFieldDetails.options || [];
    const primaryMapping = {};
    
    if (primaryOptions.length === 0) {
      console.log('No options found for Primary Contact Type field');
    } else {
      primaryOptions.forEach(option => {
        console.log(`Option ID: ${option.id}, Label: "${option.label}"`);
        primaryMapping[option.id] = option.label;
      });
    }
    
    console.log('\n=== SECONDARY CONTACT TYPE OPTIONS ===');
    const secondaryOptions = secondaryFieldDetails.options || [];
    const secondaryMapping = {};
    
    if (secondaryOptions.length === 0) {
      console.log('No options found for Secondary Contact Type field');
    } else {
      secondaryOptions.forEach(option => {
        console.log(`Option ID: ${option.id}, Label: "${option.label}"`);
        secondaryMapping[option.id] = option.label;
      });
    }
    
    // Generate mapping code for use in the sync script
    console.log('\n=== GENERATED MAPPING CODE ===');
    console.log('Copy and paste this into your sync_from_pipedrive.js file:');
    console.log(`
// Map Pipedrive Contact Type IDs to their text values
const contactTypeIdMap = {
${Object.entries(primaryMapping).map(([id, label]) => `  "${id}": "${label}"`).join(',\n')}
};
    `);
  } catch (error) {
    console.error('Error retrieving contact type field options:', error.message);
  }
}

// Run the script
getContactTypeFieldOptions()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  }); 