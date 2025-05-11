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

// Function to make API requests with retry logic
async function makeApiRequest(config, maxRetries = 3, initialDelay = 2000) {
  let lastError;
  let delay = initialDelay;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await axios(config);
    } catch (error) {
      lastError = error;
      
      // If rate limit is hit, wait and retry
      if (error.response && error.response.status === 429) {
        console.log(`Rate limit hit, retrying in ${delay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      } else {
        // For other errors, don't retry
        break;
      }
    }
  }
  
  throw lastError;
}

// Function to fetch all persons from Pipedrive
async function fetchAllPersonsFromPipedrive() {
  console.log('Fetching all persons from Pipedrive...');
  
  const allPersons = [];
  let moreItems = true;
  let start = 0;
  const limit = 100;
  
  while (moreItems) {
    try {
      const response = await makeApiRequest({
        method: 'GET',
        url: `${pipedriveApiUrl}/persons`,
        params: {
          api_token: pipedriveApiToken,
          start,
          limit
        }
      });
      
      if (response.data.success) {
        const persons = response.data.data || [];
        allPersons.push(...persons);
        
        // Check if there are more items to fetch
        if (persons.length < limit) {
          moreItems = false;
        } else {
          start += limit;
        }
      } else {
        console.error('Error fetching persons from Pipedrive:', response.data.error);
        moreItems = false;
      }
    } catch (error) {
      console.error('Exception when fetching persons from Pipedrive:', error.message);
      if (error.response) {
        console.error('Error response data:', error.response.data);
      }
      moreItems = false;
    }
  }
  
  console.log(`Fetched ${allPersons.length} persons from Pipedrive.`);
  return allPersons;
}

// Function to fetch all organizations from Pipedrive
async function fetchAllOrganizationsFromPipedrive() {
  console.log('Fetching all organizations from Pipedrive...');
  
  const allOrganizations = [];
  let moreItems = true;
  let start = 0;
  const limit = 100;
  
  while (moreItems) {
    try {
      const response = await makeApiRequest({
        method: 'GET',
        url: `${pipedriveApiUrl}/organizations`,
        params: {
          api_token: pipedriveApiToken,
          start,
          limit
        }
      });
      
      if (response.data.success) {
        const organizations = response.data.data || [];
        allOrganizations.push(...organizations);
        
        // Check if there are more items to fetch
        if (organizations.length < limit) {
          moreItems = false;
        } else {
          start += limit;
        }
      } else {
        console.error('Error fetching organizations from Pipedrive:', response.data.error);
        moreItems = false;
      }
    } catch (error) {
      console.error('Exception when fetching organizations from Pipedrive:', error.message);
      if (error.response) {
        console.error('Error response data:', error.response.data);
      }
      moreItems = false;
    }
  }
  
  console.log(`Fetched ${allOrganizations.length} organizations from Pipedrive.`);
  return allOrganizations;
}

// Function to fetch the person's custom fields from Pipedrive
async function getPersonFieldsFromPipedrive() {
  console.log('Fetching person fields from Pipedrive...');
  
  try {
    const response = await makeApiRequest({
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

// Function to create a field mapping for Pipedrive custom fields
async function createFieldMapping() {
  const personFields = await getPersonFieldsFromPipedrive();
  const fieldMapping = {
    linkedinProfile: null,
    jobTitle: null,
    primaryContactType: null,
    secondaryContactType: null,
    headline: null,
    summary: null,
    linkedinFollowers: null,
    location: null
  };
  
  for (const field of personFields) {
    const fieldName = field.name.toLowerCase();
    if (fieldName === 'linkedin profile') {
      fieldMapping.linkedinProfile = field.key;
    } else if (fieldName === 'job title') {
      fieldMapping.jobTitle = field.key;
    } else if (fieldName === 'primary contact type') {
      fieldMapping.primaryContactType = field.key;
    } else if (fieldName === 'secondary contact type') {
      fieldMapping.secondaryContactType = field.key;
    } else if (fieldName === 'headline') {
      fieldMapping.headline = field.key;
    } else if (fieldName === 'summary') {
      fieldMapping.summary = field.key;
    } else if (fieldName === 'linkedin followers') {
      fieldMapping.linkedinFollowers = field.key;
    } else if (fieldName === 'location') {
      fieldMapping.location = field.key;
    }
  }
  
  console.log('Field mapping created:', fieldMapping);
  return fieldMapping;
}

// Function to sync from Pipedrive to Supabase
async function syncFromPipedrive() {
  try {
    console.log('Starting sync from Pipedrive to Supabase...');
    
    // Define valid contact types
    const validContactTypes = [
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
    
    // Map Pipedrive Primary Contact Type IDs to their text values
    // This mapping is generated directly from the Pipedrive API
    const primaryContactTypeIdMap = {
      "143": "Participant",
      "144": "Prospective Participant",
      "145": "Individual Donor",
      "146": "Prospective Individual Donor",
      "147": "Institutional Donor",
      "148": "Prospective Institutional Donor",
      "149": "Product Partner",
      "150": "Prospective Product Partner",
      "151": "Program Partner",
      "152": "Prospective Program Partner",
      "153": "Corporate Partner",
      "154": "Prospective Corporate Partner",
      "155": "Influencer",
      "156": "Media Contact",
      "157": "Volunteer",
      "158": "Advisor",
      "159": "Board",
      "160": "Staff",
      "161": "Vendor"
    };
    
    // Map Pipedrive Secondary Contact Type IDs to their text values
    // This mapping is generated directly from the Pipedrive API
    const secondaryContactTypeIdMap = {
      "162": "Participant",
      "163": "Prospective Participant",
      "164": "Individual Donor",
      "165": "Prospective Individual Donor",
      "166": "Institutional Donor",
      "167": "Prospective Institutional Donor",
      "168": "Product Partner",
      "169": "Prospective Product Partner",
      "170": "Program Partner",
      "171": "Prospective Program Partner",
      "172": "Corporate Partner",
      "173": "Prospective Corporate Partner",
      "174": "Influencer",
      "175": "Media Contact",
      "176": "Volunteer",
      "177": "Advisor",
      "178": "Board",
      "179": "Staff",
      "180": "Vendor"
    };
    
    // Create field mapping for Pipedrive custom fields
    const fieldMapping = await createFieldMapping();
    
    // Fetch all persons from Pipedrive
    const pipedrivePersons = await fetchAllPersonsFromPipedrive();
    
    // Fetch all organizations from Pipedrive
    const pipedriveOrganizations = await fetchAllOrganizationsFromPipedrive();
    
    // Sync organizations first (for proper references)
    await syncOrganizationsToSupabase(pipedriveOrganizations);
    
    // Sync persons
    await syncPersonsToSupabase(pipedrivePersons, fieldMapping, validContactTypes, primaryContactTypeIdMap, secondaryContactTypeIdMap);
    
    console.log('Sync from Pipedrive to Supabase completed!');
  } catch (error) {
    console.error('Error during sync process:', error.message);
  }
}

// Function to sync persons from Pipedrive to Supabase
async function syncPersonsToSupabase(pipedrivePersons, fieldMapping, validContactTypes, primaryContactTypeIdMap, secondaryContactTypeIdMap) {
  console.log('Starting to sync persons from Pipedrive to Supabase...');
  
  let updatedCount = 0;
  let createdCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  
  for (const person of pipedrivePersons) {
    try {
      // Find the person in Supabase using the pipedrive_id
      const { data, error } = await supabase
        .from('people')
        .select(`
          *,
          organizations (
            id,
            name,
            pipedrive_org_id
          )
        `)
        .eq('pipedrive_id', person.id)
        .limit(1);
      
      if (error) {
        console.error(`Error finding person with Pipedrive ID ${person.id}:`, error);
        errorCount++;
        continue;
      }
      
      // If person doesn't exist in Supabase, create a new record
      if (!data || data.length === 0) {
        // Create a new person record
        const success = await createPersonInSupabase(person, fieldMapping, validContactTypes, primaryContactTypeIdMap, secondaryContactTypeIdMap);
        if (success) {
          createdCount++;
        } else {
          errorCount++;
        }
        continue;
      }
      
      const supabasePerson = data[0];
      
      // Extract data from Pipedrive person
      const updateData = {};
      
      // Update name if changed
      if (person.name && person.name !== supabasePerson.full_name) {
        updateData.full_name = person.name;
      }
      
      // Update emails if changed
      if (person.email && person.email.length > 0) {
        const workEmail = person.email.find(e => e.label === 'work')?.value;
        const personalEmail = person.email.find(e => e.label === 'personal')?.value;
        
        if (workEmail && workEmail !== supabasePerson.work_email) {
          updateData.work_email = workEmail;
        }
        
        if (personalEmail && personalEmail !== supabasePerson.personal_email) {
          updateData.personal_email = personalEmail;
        }
      }
      
      // Update phone if changed
      if (person.phone && person.phone.length > 0) {
        const mainPhone = person.phone.find(p => p.primary)?.value || person.phone[0]?.value;
        
        if (mainPhone && mainPhone !== supabasePerson.phone) {
          updateData.phone = mainPhone;
        }
      }
      
      // Update organization if changed
      const pipedriveOrgId = person.org_id ? person.org_id.value : null;
      const currentPipedriveOrgId = supabasePerson.organizations?.pipedrive_org_id;
      
      // Check if organization has changed
      if (pipedriveOrgId !== currentPipedriveOrgId) {
        console.log(`Organization changed for ${supabasePerson.full_name}: Pipedrive org ID ${currentPipedriveOrgId} -> ${pipedriveOrgId}`);
        
        if (pipedriveOrgId) {
          // Find the organization in Supabase by Pipedrive ID
          const { data: orgData, error: orgError } = await supabase
            .from('organizations')
            .select('id, name')
            .eq('pipedrive_org_id', pipedriveOrgId)
            .limit(1);
          
          if (orgError) {
            console.error(`Error finding organization with Pipedrive ID ${pipedriveOrgId}:`, orgError);
          } else if (orgData && orgData.length > 0) {
            updateData.organization_id = orgData[0].id;
            console.log(`  Found matching Supabase organization: ${orgData[0].name} (ID: ${orgData[0].id})`);
          } else {
            console.log(`  No matching organization found in Supabase for Pipedrive org ID ${pipedriveOrgId}`);
          }
        } else if (supabasePerson.organization_id) {
          // If the person had an organization in Supabase but it was removed in Pipedrive
          updateData.organization_id = null;
          console.log(`Organization removed for ${supabasePerson.full_name}`);
        }
      }
      
      // Update notes if changed
      if (person.notes && person.notes !== supabasePerson.notes) {
        updateData.notes = person.notes;
      }
      
      // Update LinkedIn profile from custom field
      if (fieldMapping.linkedinProfile && person[fieldMapping.linkedinProfile] && 
          person[fieldMapping.linkedinProfile] !== supabasePerson.linkedin_profile) {
        updateData.linkedin_profile = person[fieldMapping.linkedinProfile];
      }
      
      // Update job title from custom field
      if (fieldMapping.jobTitle && person[fieldMapping.jobTitle] && 
          person[fieldMapping.jobTitle] !== supabasePerson.title) {
        updateData.title = person[fieldMapping.jobTitle];
      }
      
      // Update primary contact type from custom field (using ID mapping)
      if (fieldMapping.primaryContactType && person[fieldMapping.primaryContactType]) {
        const primaryTypeId = person[fieldMapping.primaryContactType];
        const mappedPrimaryType = primaryContactTypeIdMap[primaryTypeId];
        
        if (mappedPrimaryType && validContactTypes.includes(mappedPrimaryType) &&
            mappedPrimaryType !== supabasePerson.primary_contact_type) {
          console.log(`Mapping primary contact type ${primaryTypeId} to ${mappedPrimaryType} for ${person.name}`);
          updateData.primary_contact_type = mappedPrimaryType;
        }
      }
      
      // Update secondary contact type from custom field (using ID mapping)
      if (fieldMapping.secondaryContactType && person[fieldMapping.secondaryContactType]) {
        const secondaryTypeId = person[fieldMapping.secondaryContactType];
        const mappedSecondaryType = secondaryContactTypeIdMap[secondaryTypeId];
        
        if (mappedSecondaryType && validContactTypes.includes(mappedSecondaryType) &&
            mappedSecondaryType !== supabasePerson.secondary_contact_type) {
          console.log(`Mapping secondary contact type ${secondaryTypeId} to ${mappedSecondaryType} for ${person.name}`);
          updateData.secondary_contact_type = mappedSecondaryType;
        }
      }
      
      // Update headline from custom field
      if (fieldMapping.headline && person[fieldMapping.headline] && 
          person[fieldMapping.headline] !== supabasePerson.headline) {
        updateData.headline = person[fieldMapping.headline];
      }
      
      // Update summary from custom field
      if (fieldMapping.summary && person[fieldMapping.summary] && 
          person[fieldMapping.summary] !== supabasePerson.summary) {
        updateData.summary = person[fieldMapping.summary];
      }
      
      // Update LinkedIn followers from custom field
      if (fieldMapping.linkedinFollowers && person[fieldMapping.linkedinFollowers] &&
          person[fieldMapping.linkedinFollowers] !== supabasePerson.num_followers) {
        updateData.num_followers = parseInt(person[fieldMapping.linkedinFollowers], 10) || null;
      }
      
      // Update location from custom field
      if (fieldMapping.location && person[fieldMapping.location] && 
          person[fieldMapping.location] !== supabasePerson.location_name) {
        updateData.location_name = person[fieldMapping.location];
      }
      
      // If there are changes, update the person in Supabase
      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabase
          .from('people')
          .update(updateData)
          .eq('id', supabasePerson.id);
        
        if (updateError) {
          console.error(`Error updating person ${supabasePerson.full_name}:`, updateError);
          errorCount++;
        } else {
          console.log(`Updated person ${supabasePerson.full_name} in Supabase with changes:`, updateData);
          updatedCount++;
        }
      } else {
        skippedCount++;
      }
    } catch (error) {
      console.error(`Exception when syncing person with Pipedrive ID ${person.id}:`, error.message);
      errorCount++;
    }
  }
  
  console.log(`Person sync completed!`);
  console.log(`Created: ${createdCount}, Updated: ${updatedCount}, Skipped (no changes or not found): ${skippedCount}, Errors: ${errorCount}`);
}

// Create a new person in Supabase from Pipedrive data
async function createPersonInSupabase(pipedriveUser, fieldMapping, validContactTypes, primaryContactTypeIdMap, secondaryContactTypeIdMap) {
  console.log(`Creating new person in Supabase from Pipedrive: ${pipedriveUser.name}`);
  
  try {
    // Extract emails
    const workEmail = pipedriveUser.email?.find(e => e.label === 'work')?.value || null;
    const personalEmail = pipedriveUser.email?.find(e => e.label === 'personal')?.value || null;
    
    // Extract phone
    const phone = pipedriveUser.phone?.find(p => p.primary)?.value || 
                  (pipedriveUser.phone && pipedriveUser.phone.length > 0 ? pipedriveUser.phone[0].value : null);
    
    // Prepare organization link if applicable
    let organizationId = null;
    if (pipedriveUser.org_id) {
      // Try to find the organization in Supabase by Pipedrive ID
      const { data, error } = await supabase
        .from('organizations')
        .select('id')
        .eq('pipedrive_org_id', pipedriveUser.org_id.value)
        .limit(1);
      
      if (!error && data && data.length > 0) {
        organizationId = data[0].id;
      }
    }
    
    // Process primary contact type using the ID mapping
    let primaryContactType = null;
    if (fieldMapping.primaryContactType && pipedriveUser[fieldMapping.primaryContactType]) {
      const primaryTypeId = pipedriveUser[fieldMapping.primaryContactType];
      const mappedPrimaryType = primaryContactTypeIdMap[primaryTypeId];
      
      if (mappedPrimaryType && validContactTypes.includes(mappedPrimaryType)) {
        console.log(`Mapping primary contact type ${primaryTypeId} to ${mappedPrimaryType} for ${pipedriveUser.name}`);
        primaryContactType = mappedPrimaryType;
      }
    }
    
    // Process secondary contact type using the ID mapping
    let secondaryContactType = null;
    if (fieldMapping.secondaryContactType && pipedriveUser[fieldMapping.secondaryContactType]) {
      const secondaryTypeId = pipedriveUser[fieldMapping.secondaryContactType];
      const mappedSecondaryType = secondaryContactTypeIdMap[secondaryTypeId];
      
      if (mappedSecondaryType && validContactTypes.includes(mappedSecondaryType)) {
        console.log(`Mapping secondary contact type ${secondaryTypeId} to ${mappedSecondaryType} for ${pipedriveUser.name}`);
        secondaryContactType = mappedSecondaryType;
      }
    }
    
    // Extract other custom fields
    const title = fieldMapping.jobTitle && pipedriveUser[fieldMapping.jobTitle] 
      ? pipedriveUser[fieldMapping.jobTitle] 
      : null;
    
    const linkedinProfile = fieldMapping.linkedinProfile && pipedriveUser[fieldMapping.linkedinProfile] 
      ? pipedriveUser[fieldMapping.linkedinProfile] 
      : null;
    
    const headline = fieldMapping.headline && pipedriveUser[fieldMapping.headline] 
      ? pipedriveUser[fieldMapping.headline] 
      : null;
    
    const summary = fieldMapping.summary && pipedriveUser[fieldMapping.summary] 
      ? pipedriveUser[fieldMapping.summary] 
      : null;
    
    const numFollowers = fieldMapping.linkedinFollowers && pipedriveUser[fieldMapping.linkedinFollowers] 
      ? parseInt(pipedriveUser[fieldMapping.linkedinFollowers], 10) || null 
      : null;
    
    const locationName = fieldMapping.location && pipedriveUser[fieldMapping.location] 
      ? pipedriveUser[fieldMapping.location] 
      : null;
    
    // Prepare the new person data
    const newPerson = {
      full_name: pipedriveUser.name,
      organization_id: organizationId,
      work_email: workEmail,
      personal_email: personalEmail,
      phone: phone,
      title: title,
      linkedin_profile: linkedinProfile,
      notes: pipedriveUser.notes || null,
      primary_contact_type: primaryContactType,
      secondary_contact_type: secondaryContactType,
      pipedrive_id: pipedriveUser.id,
      num_followers: numFollowers,
      headline: headline,
      summary: summary,
      location_name: locationName
    };
    
    // Insert the new person into Supabase
    const { data, error } = await supabase
      .from('people')
      .insert([newPerson])
      .select();
    
    if (error) {
      console.error(`Error creating new person in Supabase: ${pipedriveUser.name}`, error);
      return false;
    }
    
    console.log(`Successfully created new person in Supabase: ${pipedriveUser.name} with ID: ${data[0].id}`);
    return true;
  } catch (error) {
    console.error(`Exception when creating person from Pipedrive: ${pipedriveUser.name}`, error);
    return false;
  }
}

// Function to sync organizations from Pipedrive to Supabase
async function syncOrganizationsToSupabase(pipedriveOrganizations) {
  console.log('Starting to sync organizations from Pipedrive to Supabase...');
  
  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  
  for (const organization of pipedriveOrganizations) {
    try {
      // Find the organization in Supabase using the pipedrive_org_id
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('pipedrive_org_id', organization.id)
        .limit(1);
      
      if (error) {
        console.error(`Error finding organization with Pipedrive ID ${organization.id}:`, error);
        errorCount++;
        continue;
      }
      
      // If organization doesn't exist in Supabase, skip
      if (!data || data.length === 0) {
        skippedCount++;
        continue;
      }
      
      const supabaseOrg = data[0];
      
      // Extract data from Pipedrive organization
      const updateData = {};
      
      // Update name if changed
      if (organization.name && organization.name !== supabaseOrg.name) {
        updateData.name = organization.name;
      }
      
      // Update website if changed
      if (organization.url && organization.url !== supabaseOrg.website) {
        updateData.website = organization.url;
      }
      
      // Note: We're removing updates to address, city, and state fields as they don't exist in Supabase schema
      
      // If there are changes, update the organization in Supabase
      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabase
          .from('organizations')
          .update(updateData)
          .eq('id', supabaseOrg.id);
        
        if (updateError) {
          console.error(`Error updating organization ${supabaseOrg.name}:`, updateError);
          errorCount++;
        } else {
          console.log(`Updated organization ${supabaseOrg.name} in Supabase with changes:`, updateData);
          updatedCount++;
        }
      } else {
        skippedCount++;
      }
    } catch (error) {
      console.error(`Exception when syncing organization with Pipedrive ID ${organization.id}:`, error.message);
      errorCount++;
    }
  }
  
  console.log(`Organization sync completed!`);
  console.log(`Updated: ${updatedCount}, Skipped (no changes or not found): ${skippedCount}, Errors: ${errorCount}`);
}

// Run the sync process
syncFromPipedrive()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  }); 