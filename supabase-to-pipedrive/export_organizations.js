require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize Pipedrive API token
const pipedriveApiToken = process.env.PIPEDRIVE_API_TOKEN;
const pipedriveApiUrl = 'https://api.pipedrive.com/v1';

// Function to fetch all organizations from Supabase
async function fetchOrganizationsFromSupabase() {
  console.log('Fetching organizations from Supabase...');
  
  const { data: organizations, error } = await supabase
    .from('organizations')
    .select('*');
  
  if (error) {
    console.error('Error fetching organizations from Supabase:', error);
    return [];
  }
  
  console.log(`Found ${organizations.length} organizations in Supabase.`);
  return organizations;
}

// Function to find or create an organization in Pipedrive
async function findOrCreateOrganization(organization) {
  if (!organization.name) {
    console.log(`Organization with ID ${organization.id} has no name, skipping.`);
    return null;
  }
  
  const organizationName = organization.name;
  console.log(`Processing organization: ${organizationName}`);
  
  // If we already have a Pipedrive ID for this organization, skip creation
  if (organization.pipedrive_org_id) {
    console.log(`Organization ${organizationName} already has Pipedrive ID: ${organization.pipedrive_org_id}`);
    return organization.pipedrive_org_id;
  }
  
  try {
    // First, try to find the organization by name
    const searchResponse = await axios({
      method: 'GET',
      url: `${pipedriveApiUrl}/organizations/search`,
      params: { 
        api_token: pipedriveApiToken,
        term: organizationName,
        exact_match: true,
        limit: 1
      }
    });
    
    // Check if we found an organization
    if (searchResponse.data.success && 
        searchResponse.data.data && 
        searchResponse.data.data.items && 
        searchResponse.data.data.items.length > 0) {
      const org = searchResponse.data.data.items[0].item;
      console.log(`Found existing organization: ${organizationName} with ID: ${org.id}`);
      
      // Update the Supabase record with the Pipedrive ID
      const { error } = await supabase
        .from('organizations')
        .update({ pipedrive_org_id: org.id })
        .eq('id', organization.id);
      
      if (error) {
        console.error(`Error updating Pipedrive ID in Supabase for ${organizationName}:`, error);
      } else {
        console.log(`Updated organization ${organizationName} with Pipedrive ID ${org.id} in Supabase`);
      }
      
      return org.id;
    }
    
    // If not found, create a new organization
    console.log(`Creating new organization: ${organizationName}`);
    
    // Prepare organization data
    const orgData = {
      name: organizationName,
      visible_to: 3 // 3 means visible to everyone
    };
    
    // Add website if available
    if (organization.website) {
      orgData.url = organization.website;
    }

    // Add address if available
    if (organization.address) {
      orgData.address = organization.address;
    }

    // Add city if available
    if (organization.city) {
      orgData.address_city = organization.city;
    }

    // Add state if available
    if (organization.state) {
      orgData.address_state = organization.state;
    }
    
    const createResponse = await axios({
      method: 'POST',
      url: `${pipedriveApiUrl}/organizations`,
      params: { api_token: pipedriveApiToken },
      data: orgData
    });
    
    if (createResponse.data.success) {
      const newOrgId = createResponse.data.data.id;
      console.log(`Created new organization: ${organizationName} with ID: ${newOrgId}`);
      
      // Update the Supabase record with the Pipedrive ID
      const { error } = await supabase
        .from('organizations')
        .update({ pipedrive_org_id: newOrgId })
        .eq('id', organization.id);
      
      if (error) {
        console.error(`Error updating Pipedrive ID in Supabase for ${organizationName}:`, error);
      } else {
        console.log(`Updated organization ${organizationName} with Pipedrive ID ${newOrgId} in Supabase`);
      }
      
      return newOrgId;
    } else {
      console.error(`Error creating organization ${organizationName}:`, createResponse.data.error);
      return null;
    }
  } catch (error) {
    console.error(`Exception when finding/creating organization ${organizationName}:`, error.message);
    if (error.response) {
      console.error('Error response data:', error.response.data);
    }
    return null;
  }
}

// Main function to export organizations to Pipedrive
async function exportOrganizationsToPipedrive() {
  try {
    // Fetch all organizations from Supabase
    const organizations = await fetchOrganizationsFromSupabase();
    
    // If no organizations found, exit
    if (!organizations || organizations.length === 0) {
      console.log('No organizations found in Supabase to export.');
      return;
    }
    
    console.log(`Starting export of ${organizations.length} organizations to Pipedrive...`);
    
    // Track success and failures
    let successCount = 0;
    let failureCount = 0;
    
    // Process each organization
    for (const organization of organizations) {
      const orgId = await findOrCreateOrganization(organization);
      
      if (orgId) {
        successCount++;
      } else {
        failureCount++;
      }
    }
    
    console.log(`Export completed!`);
    console.log(`Successfully exported/updated: ${successCount} organizations`);
    console.log(`Failed to export/update: ${failureCount} organizations`);
    
  } catch (error) {
    console.error('Error in export process:', error);
  }
}

// Run the export
exportOrganizationsToPipedrive()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  }); 