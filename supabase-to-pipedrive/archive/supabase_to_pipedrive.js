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

// Function to create a custom field in Pipedrive if it doesn't exist
async function createCustomFieldIfNotExists(fieldName, fieldType) {
  console.log(`Checking if custom field '${fieldName}' exists in Pipedrive...`);
  
  // Get all person fields
  const personFields = await getPersonFieldsFromPipedrive();
  
  // Check if field already exists
  const existingField = personFields.find(field => field.name.toLowerCase() === fieldName.toLowerCase());
  if (existingField) {
    console.log(`Custom field '${fieldName}' already exists with key: ${existingField.key}`);
    return existingField;
  }
  
  // Field doesn't exist, create it
  console.log(`Creating custom field '${fieldName}'...`);
  
  try {
    const response = await axios({
      method: 'POST',
      url: `${pipedriveApiUrl}/personFields`,
      params: { api_token: pipedriveApiToken },
      data: {
        name: fieldName,
        field_type: fieldType
      }
    });
    
    if (response.data.success) {
      console.log(`Successfully created custom field '${fieldName}' with key: ${response.data.data.key}`);
      return response.data.data;
    } else {
      console.error(`Error creating custom field '${fieldName}':`, response.data.error);
      return null;
    }
  } catch (error) {
    console.error(`Exception when creating custom field '${fieldName}':`, error.message);
    if (error.response) {
      console.error('Error response data:', error.response.data);
    }
    return null;
  }
}

// Function to initialize any custom fields we need
async function initializeCustomFields() {
  console.log('Initializing custom fields...');
  
  // Define the custom fields we might need
  const requiredCustomFields = [
    // Add LinkedIn as a custom field
    { name: 'LinkedIn Profile', type: 'text' },
    // Add job title as a custom field
    { name: 'Job Title', type: 'text' },
    // Add Primary Contact Type as a custom field
    { name: 'Primary Contact Type', type: 'enum' },
    // Add Secondary Contact Type as a custom field
    { name: 'Secondary Contact Type', type: 'enum' },
    // Add Headline as a custom field
    { name: 'Headline', type: 'varchar' },
    // Add Summary as a custom field
    { name: 'Summary', type: 'text' },
    // Add LinkedIn Followers as a custom field
    { name: 'LinkedIn Followers', type: 'double' },
    // Add Location as a custom field
    { name: 'Location', type: 'varchar' }
  ];
  
  // Create all the required fields
  const fieldPromises = requiredCustomFields.map(field => 
    createCustomFieldIfNotExists(field.name, field.type)
  );
  
  // Wait for all fields to be created
  const fields = await Promise.all(fieldPromises);
  
  // Create a map of field names to field keys
  const fieldMap = {};
  fields.forEach(field => {
    if (field) {
      fieldMap[field.name.toLowerCase()] = field.key;
    }
  });
  
  return fieldMap;
}

// Function to find or create an organization in Pipedrive
async function findOrCreateOrganization(organizationName) {
  if (!organizationName) return null;
  
  console.log(`Looking for organization: ${organizationName}`);
  
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
      return org.id;
    }
    
    // If not found, create a new organization
    console.log(`Creating new organization: ${organizationName}`);
    
    const createResponse = await axios({
      method: 'POST',
      url: `${pipedriveApiUrl}/organizations`,
      params: { api_token: pipedriveApiToken },
      data: {
        name: organizationName,
        visible_to: 3 // 3 means visible to everyone
      }
    });
    
    if (createResponse.data.success) {
      const newOrgId = createResponse.data.data.id;
      console.log(`Created new organization: ${organizationName} with ID: ${newOrgId}`);
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

// Function to fetch all people from Supabase
async function fetchPeopleFromSupabase() {
  console.log('Fetching contacts from Supabase...');
  
  const { data: people, error } = await supabase
    .from('people')
    .select(`
      id,
      full_name,
      organization_id,
      work_email,
      personal_email,
      phone,
      linkedin_profile,
      notes,
      title,
      primary_contact_type,
      secondary_contact_type,
      num_followers,
      headline,
      summary,
      location_name,
      pipedrive_id,
      organizations (
        id,
        name,
        pipedrive_org_id
      )
    `);
  
  if (error) {
    console.error('Error fetching people from Supabase:', error);
    return [];
  }
  
  console.log(`Found ${people.length} contacts in Supabase.`);
  return people;
}

// Function to search for a person by email in Pipedrive
async function searchPersonByEmail(email) {
  if (!email) return null;
  
  console.log(`Searching for person with email: ${email}`);
  
  try {
    const response = await axios({
      method: 'GET',
      url: `${pipedriveApiUrl}/persons/search`,
      params: {
        api_token: pipedriveApiToken,
        term: email,
        fields: 'email',
        exact_match: true,
        limit: 1
      }
    });
    
    if (response.data.success && 
        response.data.data && 
        response.data.data.items && 
        response.data.data.items.length > 0) {
      const person = response.data.data.items[0].item;
      console.log(`Found existing person with email ${email}, ID: ${person.id}`);
      return person;
    }
    
    return null;
  } catch (error) {
    console.error(`Error searching for person with email ${email}:`, error.message);
    if (error.response) {
      console.error('Error response data:', error.response.data);
    }
    return null;
  }
}

// Function to add or update a person in Pipedrive
async function addOrUpdatePersonInPipedrive(person, customFieldMap) {
  // Check if the person already exists in Pipedrive
  if (person.pipedrive_id) {
    return updatePersonInPipedrive(person, customFieldMap);
  } else {
    return addPersonToPipedrive(person, customFieldMap);
  }
}

// Function to add a new person to Pipedrive
async function addPersonToPipedrive(person, customFieldMap) {
  console.log(`Checking for existing contact before adding: ${person.full_name}`);
  
  // Check if the person already exists in Pipedrive by email
  let existingPerson = null;
  
  // Try work email first
  if (person.work_email) {
    existingPerson = await searchPersonByEmail(person.work_email);
  }
  
  // If not found by work email, try personal email
  if (!existingPerson && person.personal_email) {
    existingPerson = await searchPersonByEmail(person.personal_email);
  }
  
  // If we found an existing person, update Supabase with the Pipedrive ID and update the person
  if (existingPerson) {
    console.log(`Found existing person in Pipedrive for ${person.full_name}. Updating Supabase with Pipedrive ID: ${existingPerson.id}`);
    
    // Update Supabase with the Pipedrive ID
    const { error } = await supabase
      .from('people')
      .update({ pipedrive_id: existingPerson.id })
      .eq('id', person.id);
    
    if (error) {
      console.error(`Error updating Pipedrive ID in Supabase for ${person.full_name}:`, error);
    }
    
    // Update the person object with the Pipedrive ID
    const updatedPerson = { ...person, pipedrive_id: existingPerson.id };
    
    // Call the update function
    return updatePersonInPipedrive(updatedPerson, customFieldMap);
  }
  
  // If no existing person was found, proceed with creating a new one
  console.log(`Adding new contact to Pipedrive: ${person.full_name}`);
  
  // Prepare email array for Pipedrive
  const emails = [];
  if (person.work_email) {
    emails.push({ label: 'work', value: person.work_email, primary: true });
  }
  if (person.personal_email) {
    emails.push({ label: 'personal', value: person.personal_email, primary: !person.work_email });
  }
  
  // Prepare phone array for Pipedrive
  const phones = [];
  if (person.phone) {
    phones.push({ label: 'main', value: person.phone, primary: true });
  }
  
  // Create person data object for Pipedrive
  const personData = {
    name: person.full_name,
    email: emails,
    phone: phones,
    visible_to: 3, // 3 means visible to everyone
    add_time: new Date().toISOString()
  };
  
  // Handle organization - try to use the pipedrive_org_id first, but if not available
  // try to find or create the organization
  if (person.organizations?.pipedrive_org_id) {
    personData.org_id = person.organizations.pipedrive_org_id;
  } else if (person.organization_name) {
    const orgId = await findOrCreateOrganization(person.organization_name);
    if (orgId) {
      personData.org_id = orgId;
      
      // Also update the record in Supabase if we have an organization_id
      if (person.organization_id) {
        try {
          await supabase
            .from('organizations')
            .update({ pipedrive_org_id: orgId })
            .eq('id', person.organization_id);
          
          console.log(`Updated organization ${person.organization_name} with Pipedrive ID ${orgId} in Supabase`);
        } catch (error) {
          console.error(`Error updating organization in Supabase:`, error);
        }
      }
    }
  }
  
  // Add notes if available
  if (person.notes) personData.notes = person.notes;
  
  // Handle title as a custom field
  if (person.title && customFieldMap && customFieldMap['job title']) {
    personData[customFieldMap['job title']] = person.title;
  }
  
  // Handle LinkedIn profile as a custom field
  if (person.linkedin_profile && customFieldMap && customFieldMap['linkedin profile']) {
    personData[customFieldMap['linkedin profile']] = person.linkedin_profile;
  }
  
  // Handle Primary Contact Type as a custom field
  if (person.primary_contact_type && customFieldMap && customFieldMap['primary contact type']) {
    personData[customFieldMap['primary contact type']] = person.primary_contact_type;
  }
  
  // Handle Secondary Contact Type as a custom field
  if (person.secondary_contact_type && customFieldMap && customFieldMap['secondary contact type']) {
    personData[customFieldMap['secondary contact type']] = person.secondary_contact_type;
  }
  
  // Handle Headline as a custom field
  if (person.headline && customFieldMap && customFieldMap['headline']) {
    personData[customFieldMap['headline']] = person.headline;
  }
  
  // Handle Summary as a custom field
  if (person.summary && customFieldMap && customFieldMap['summary']) {
    personData[customFieldMap['summary']] = person.summary;
  }
  
  // Handle LinkedIn Followers as a custom field
  if (person.num_followers && customFieldMap && customFieldMap['linkedin followers']) {
    personData[customFieldMap['linkedin followers']] = person.num_followers;
  }
  
  // Handle Location as a custom field
  if (person.location_name && customFieldMap && customFieldMap['location']) {
    personData[customFieldMap['location']] = person.location_name;
  }
  
  try {
    const response = await axios({
      method: 'POST',
      url: `${pipedriveApiUrl}/persons`,
      params: { api_token: pipedriveApiToken },
      data: personData
    });
    
    if (response.data.success) {
      console.log(`Successfully added ${person.full_name} to Pipedrive with ID: ${response.data.data.id}`);
      
      // Update the Supabase record with the new Pipedrive ID
      const { error } = await supabase
        .from('people')
        .update({ pipedrive_id: response.data.data.id })
        .eq('id', person.id);
      
      if (error) {
        console.error(`Error updating Pipedrive ID in Supabase for ${person.full_name}:`, error);
      }
      
      return response.data.data;
    } else {
      console.error(`Error adding ${person.full_name} to Pipedrive:`, response.data.error);
      return null;
    }
  } catch (error) {
    console.error(`Exception when adding ${person.full_name} to Pipedrive:`, error.message);
    if (error.response) {
      console.error('Error response data:', error.response.data);
    }
    return null;
  }
}

// Function to update an existing person in Pipedrive
async function updatePersonInPipedrive(person, customFieldMap) {
  console.log(`Updating existing contact in Pipedrive: ${person.full_name} (ID: ${person.pipedrive_id})`);
  
  // Prepare email array for Pipedrive
  const emails = [];
  if (person.work_email) {
    emails.push({ label: 'work', value: person.work_email, primary: true });
  }
  if (person.personal_email) {
    emails.push({ label: 'personal', value: person.personal_email, primary: !person.work_email });
  }
  
  // Prepare phone array for Pipedrive
  const phones = [];
  if (person.phone) {
    phones.push({ label: 'main', value: person.phone, primary: true });
  }
  
  // Create person data object for Pipedrive
  const personData = {
    name: person.full_name,
    email: emails,
    phone: phones,
    visible_to: 3, // 3 means visible to everyone
  };
  
  // Handle organization - try to use the pipedrive_org_id first, but if not available
  // try to find or create the organization
  if (person.organizations?.pipedrive_org_id) {
    personData.org_id = person.organizations.pipedrive_org_id;
  } else if (person.organization_name) {
    const orgId = await findOrCreateOrganization(person.organization_name);
    if (orgId) {
      personData.org_id = orgId;
      
      // Also update the record in Supabase if we have an organization_id
      if (person.organization_id) {
        try {
          await supabase
            .from('organizations')
            .update({ pipedrive_org_id: orgId })
            .eq('id', person.organization_id);
          
          console.log(`Updated organization ${person.organization_name} with Pipedrive ID ${orgId} in Supabase`);
        } catch (error) {
          console.error(`Error updating organization in Supabase:`, error);
        }
      }
    }
  }
  
  // Add notes if available
  if (person.notes) personData.notes = person.notes;
  
  // Handle title as a custom field
  if (person.title && customFieldMap && customFieldMap['job title']) {
    personData[customFieldMap['job title']] = person.title;
  }
  
  // Handle LinkedIn profile as a custom field
  if (person.linkedin_profile && customFieldMap && customFieldMap['linkedin profile']) {
    personData[customFieldMap['linkedin profile']] = person.linkedin_profile;
  }
  
  // Handle Primary Contact Type as a custom field
  if (person.primary_contact_type && customFieldMap && customFieldMap['primary contact type']) {
    personData[customFieldMap['primary contact type']] = person.primary_contact_type;
  }
  
  // Handle Secondary Contact Type as a custom field
  if (person.secondary_contact_type && customFieldMap && customFieldMap['secondary contact type']) {
    personData[customFieldMap['secondary contact type']] = person.secondary_contact_type;
  }
  
  // Handle Headline as a custom field
  if (person.headline && customFieldMap && customFieldMap['headline']) {
    personData[customFieldMap['headline']] = person.headline;
  }
  
  // Handle Summary as a custom field
  if (person.summary && customFieldMap && customFieldMap['summary']) {
    personData[customFieldMap['summary']] = person.summary;
  }
  
  // Handle LinkedIn Followers as a custom field
  if (person.num_followers && customFieldMap && customFieldMap['linkedin followers']) {
    personData[customFieldMap['linkedin followers']] = person.num_followers;
  }
  
  // Handle Location as a custom field
  if (person.location_name && customFieldMap && customFieldMap['location']) {
    personData[customFieldMap['location']] = person.location_name;
  }
  
  try {
    const response = await axios({
      method: 'PUT',
      url: `${pipedriveApiUrl}/persons/${person.pipedrive_id}`,
      params: { api_token: pipedriveApiToken },
      data: personData
    });
    
    if (response.data.success) {
      console.log(`Successfully updated ${person.full_name} in Pipedrive`);
      return response.data.data;
    } else {
      console.error(`Error updating ${person.full_name} in Pipedrive:`, response.data.error);
      return null;
    }
  } catch (error) {
    console.error(`Exception when updating ${person.full_name} in Pipedrive:`, error.message);
    if (error.response) {
      console.error('Error response data:', error.response.data);
    }
    
    // If we get a 404, it means the person doesn't exist in Pipedrive anymore
    if (error.response && error.response.status === 404) {
      console.log(`Person with ID ${person.pipedrive_id} not found in Pipedrive. Adding as new contact.`);
      
      // Remove the pipedrive_id so we'll add them as a new contact
      const personWithoutPipedriveId = { ...person, pipedrive_id: null };
      return addPersonToPipedrive(personWithoutPipedriveId, customFieldMap);
    }
    
    return null;
  }
}

// Main function to run the export
async function exportPeopleToPipedrive() {
  try {
    // Initialize any custom fields we need
    const customFieldMap = await initializeCustomFields();
    
    // Fetch all people from Supabase
    const people = await fetchPeopleFromSupabase();
    
    // If no people found, exit
    if (!people || people.length === 0) {
      console.log('No contacts found in Supabase to export.');
      return;
    }
    
    // Enhance the people data with additional information
    const enhancedPeople = people.map(person => {
      // Create a new object with all the original properties
      const enhancedPerson = { ...person };
      
      // Add organization name if available
      if (person.organizations) {
        enhancedPerson.organization_name = person.organizations.name;
      }
      
      return enhancedPerson;
    });
    
    console.log(`Starting export of ${enhancedPeople.length} contacts to Pipedrive...`);
    
    // Track success and failures
    let successCount = 0;
    let failureCount = 0;
    
    // Process each person
    for (const person of enhancedPeople) {
      const result = await addOrUpdatePersonInPipedrive(person, customFieldMap);
      
      if (result) {
        successCount++;
      } else {
        failureCount++;
      }
    }
    
    console.log(`Export completed!`);
    console.log(`Successfully exported/updated: ${successCount} contacts`);
    console.log(`Failed to export/update: ${failureCount} contacts`);
    
  } catch (error) {
    console.error('Error in export process:', error);
  }
}

// Run the export
exportPeopleToPipedrive()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  }); 