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

// Function to fetch people from Supabase
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
      updated_at,
      last_pipedrive_sync,
      organizations (
        id,
        name,
        pipedrive_org_id,
        updated_at,
        last_pipedrive_sync
      )
    `);
  
  if (error) {
    console.error('Error fetching people from Supabase:', error);
    return [];
  }
  
  console.log(`Found ${people.length} contacts in Supabase.`);
  return people;
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

// Function to handle organization synchronization
async function syncOrganization(pipedriveOrg, supabaseOrg) {
  // If we don't have a Supabase record, we need to create one
  if (!supabaseOrg) {
    console.log(`Creating new organization in Supabase: ${pipedriveOrg.name}`);
    
    try {
      const { data, error } = await supabase
        .from('organizations')
        .insert([{
          name: pipedriveOrg.name,
          pipedrive_org_id: pipedriveOrg.id,
          website_url: pipedriveOrg.url || null,
          last_pipedrive_sync: new Date().toISOString()
        }])
        .select();
      
      if (error) {
        console.error(`Error creating organization in Supabase:`, error);
        return null;
      }
      
      console.log(`Created organization in Supabase with ID: ${data[0].id}`);
      return data[0];
    } catch (error) {
      console.error(`Exception when creating organization in Supabase:`, error);
      return null;
    }
  }
  
  // Both Pipedrive and Supabase records exist, decide which one is more recent
  const pipedriveUpdated = new Date(pipedriveOrg.update_time || pipedriveOrg.add_time);
  const supabaseUpdated = new Date(supabaseOrg.updated_at);
  const lastPipedriveSync = supabaseOrg.last_pipedrive_sync ? new Date(supabaseOrg.last_pipedrive_sync) : null;
  
  console.log(`Organization "${pipedriveOrg.name}" - Pipedrive updated: ${pipedriveUpdated.toISOString()}, Supabase updated: ${supabaseUpdated.toISOString()}`);
  
  // If Pipedrive has been updated since the last sync or is newer than Supabase
  if (!lastPipedriveSync || pipedriveUpdated > lastPipedriveSync) {
    if (!lastPipedriveSync || pipedriveUpdated > supabaseUpdated) {
      console.log(`Pipedrive organization "${pipedriveOrg.name}" is more recent, updating Supabase`);
      
      const updateData = {
        name: pipedriveOrg.name,
        last_pipedrive_sync: new Date().toISOString()
      };
      
      // Only update website_url if it exists in Pipedrive
      if (pipedriveOrg.url) {
        updateData.website_url = pipedriveOrg.url;
      }
      
      const { error } = await supabase
        .from('organizations')
        .update(updateData)
        .eq('id', supabaseOrg.id);
      
      if (error) {
        console.error(`Error updating organization in Supabase:`, error);
      } else {
        console.log(`Updated organization "${pipedriveOrg.name}" in Supabase`);
      }
    } else {
      console.log(`Supabase organization "${supabaseOrg.name}" is more recent, will update Pipedrive`);
      
      try {
        const response = await makeApiRequest({
          method: 'PUT',
          url: `${pipedriveApiUrl}/organizations/${pipedriveOrg.id}`,
          params: { api_token: pipedriveApiToken },
          data: {
            name: supabaseOrg.name,
            url: supabaseOrg.website_url
          }
        });
        
        if (response.data.success) {
          console.log(`Updated organization "${supabaseOrg.name}" in Pipedrive`);
          
          // Update the last sync time
          const { error } = await supabase
            .from('organizations')
            .update({
              last_pipedrive_sync: new Date().toISOString()
            })
            .eq('id', supabaseOrg.id);
          
          if (error) {
            console.error(`Error updating last_pipedrive_sync for organization in Supabase:`, error);
          }
        } else {
          console.error(`Error updating organization in Pipedrive:`, response.data.error);
        }
      } catch (error) {
        console.error(`Exception when updating organization in Pipedrive:`, error.message);
      }
    }
  } else {
    console.log(`Organization "${pipedriveOrg.name}" is already in sync`);
  }
  
  return supabaseOrg;
}

// Function to handle person synchronization
async function syncPerson(pipedrivePerson, supabasePerson, fieldMapping, validContactTypes, pipedriveOrgMap, supabaseOrgMap, contactTypeIdMaps) {
  const { primaryContactTypeIdMap, secondaryContactTypeIdMap } = contactTypeIdMaps;
  
  // If we don't have a Supabase record, we need to create one
  if (!supabasePerson) {
    console.log(`Creating new person in Supabase: ${pipedrivePerson.name}`);
    
    try {
      // Extract emails
      const workEmail = pipedrivePerson.email?.find(e => e.label === 'work')?.value || null;
      const personalEmail = pipedrivePerson.email?.find(e => e.label === 'personal')?.value || null;
      
      // Extract phone
      const phone = pipedrivePerson.phone?.find(p => p.primary)?.value || 
                    (pipedrivePerson.phone && pipedrivePerson.phone.length > 0 ? pipedrivePerson.phone[0].value : null);
      
      // Find organization
      let organizationId = null;
      if (pipedrivePerson.org_id) {
        const supabaseOrg = supabaseOrgMap[pipedrivePerson.org_id.value];
        if (supabaseOrg) {
          organizationId = supabaseOrg.id;
        }
      }
      
      // Process primary contact type using the ID mapping
      let primaryContactType = null;
      if (fieldMapping.primaryContactType && pipedrivePerson[fieldMapping.primaryContactType]) {
        const primaryTypeId = pipedrivePerson[fieldMapping.primaryContactType];
        const mappedPrimaryType = primaryContactTypeIdMap[primaryTypeId];
        
        if (mappedPrimaryType && validContactTypes.includes(mappedPrimaryType)) {
          console.log(`Mapping primary contact type ${primaryTypeId} to ${mappedPrimaryType} for ${pipedrivePerson.name}`);
          primaryContactType = mappedPrimaryType;
        }
      }
      
      // Process secondary contact type using the ID mapping
      let secondaryContactType = null;
      if (fieldMapping.secondaryContactType && pipedrivePerson[fieldMapping.secondaryContactType]) {
        const secondaryTypeId = pipedrivePerson[fieldMapping.secondaryContactType];
        const mappedSecondaryType = secondaryContactTypeIdMap[secondaryTypeId];
        
        if (mappedSecondaryType && validContactTypes.includes(mappedSecondaryType)) {
          console.log(`Mapping secondary contact type ${secondaryTypeId} to ${mappedSecondaryType} for ${pipedrivePerson.name}`);
          secondaryContactType = mappedSecondaryType;
        }
      }
      
      // Extract other custom fields
      const title = fieldMapping.jobTitle && pipedrivePerson[fieldMapping.jobTitle] 
        ? pipedrivePerson[fieldMapping.jobTitle] 
        : null;
      
      const linkedinProfile = fieldMapping.linkedinProfile && pipedrivePerson[fieldMapping.linkedinProfile] 
        ? pipedrivePerson[fieldMapping.linkedinProfile] 
        : null;
      
      const headline = fieldMapping.headline && pipedrivePerson[fieldMapping.headline] 
        ? pipedrivePerson[fieldMapping.headline] 
        : null;
      
      const summary = fieldMapping.summary && pipedrivePerson[fieldMapping.summary] 
        ? pipedrivePerson[fieldMapping.summary] 
        : null;
      
      const numFollowers = fieldMapping.linkedinFollowers && pipedrivePerson[fieldMapping.linkedinFollowers] 
        ? parseInt(pipedrivePerson[fieldMapping.linkedinFollowers], 10) || null 
        : null;
      
      const locationName = fieldMapping.location && pipedrivePerson[fieldMapping.location] 
        ? pipedrivePerson[fieldMapping.location] 
        : null;
      
      // Prepare the new person data
      const newPerson = {
        full_name: pipedrivePerson.name,
        organization_id: organizationId,
        work_email: workEmail,
        personal_email: personalEmail,
        phone: phone,
        title: title,
        linkedin_profile: linkedinProfile,
        notes: pipedrivePerson.notes || null,
        primary_contact_type: primaryContactType,
        secondary_contact_type: secondaryContactType,
        pipedrive_id: pipedrivePerson.id,
        num_followers: numFollowers,
        headline: headline,
        summary: summary,
        location_name: locationName,
        last_pipedrive_sync: new Date().toISOString()
      };
      
      // Insert the new person into Supabase
      const { data, error } = await supabase
        .from('people')
        .insert([newPerson])
        .select();
      
      if (error) {
        console.error(`Error creating new person in Supabase: ${pipedrivePerson.name}`, error);
        return null;
      }
      
      console.log(`Successfully created new person in Supabase: ${pipedrivePerson.name} with ID: ${data[0].id}`);
      return data[0];
    } catch (error) {
      console.error(`Exception when creating person from Pipedrive: ${pipedrivePerson.name}`, error);
      return null;
    }
  }
  
  // Both Pipedrive and Supabase records exist, decide which one is more recent
  const pipedriveUpdated = new Date(pipedrivePerson.update_time || pipedrivePerson.add_time);
  const supabaseUpdated = new Date(supabasePerson.updated_at);
  const lastPipedriveSync = supabasePerson.last_pipedrive_sync ? new Date(supabasePerson.last_pipedrive_sync) : null;
  
  console.log(`Person "${pipedrivePerson.name}" - Pipedrive updated: ${pipedriveUpdated.toISOString()}, Supabase updated: ${supabaseUpdated.toISOString()}, Last sync: ${lastPipedriveSync ? lastPipedriveSync.toISOString() : 'never'}`);
  
  // If Pipedrive has been updated since the last sync and is newer than the Supabase record
  if (!lastPipedriveSync || pipedriveUpdated > lastPipedriveSync) {
    if (!lastPipedriveSync || pipedriveUpdated > supabaseUpdated) {
      console.log(`Pipedrive person "${pipedrivePerson.name}" is more recent, updating Supabase`);
      
      // Extract data from Pipedrive person to update in Supabase
      const updateData = {};
      
      // Update name if it has changed
      if (pipedrivePerson.name && pipedrivePerson.name !== supabasePerson.full_name) {
        updateData.full_name = pipedrivePerson.name;
      }
      
      // Update emails if they have changed
      if (pipedrivePerson.email && pipedrivePerson.email.length > 0) {
        const workEmail = pipedrivePerson.email.find(e => e.label === 'work')?.value;
        const personalEmail = pipedrivePerson.email.find(e => e.label === 'personal')?.value;
        
        if (workEmail && workEmail !== supabasePerson.work_email) {
          updateData.work_email = workEmail;
        }
        
        if (personalEmail && personalEmail !== supabasePerson.personal_email) {
          updateData.personal_email = personalEmail;
        }
      }
      
      // Update phone if it has changed
      if (pipedrivePerson.phone && pipedrivePerson.phone.length > 0) {
        const mainPhone = pipedrivePerson.phone.find(p => p.primary)?.value || pipedrivePerson.phone[0]?.value;
        
        if (mainPhone && mainPhone !== supabasePerson.phone) {
          updateData.phone = mainPhone;
        }
      }
      
      // Update organization if it has changed
      if (pipedrivePerson.org_id) {
        const pipedriveOrgId = pipedrivePerson.org_id.value;
        const supabaseOrg = supabaseOrgMap[pipedriveOrgId];
        
        if (supabaseOrg && supabaseOrg.id !== supabasePerson.organization_id) {
          updateData.organization_id = supabaseOrg.id;
        }
      } else if (supabasePerson.organization_id) {
        // If the organization has been removed in Pipedrive
        updateData.organization_id = null;
      }
      
      // Update notes if they have changed
      if (pipedrivePerson.notes && pipedrivePerson.notes !== supabasePerson.notes) {
        updateData.notes = pipedrivePerson.notes;
      }
      
      // Update LinkedIn profile from custom field
      if (fieldMapping.linkedinProfile && pipedrivePerson[fieldMapping.linkedinProfile] && 
          pipedrivePerson[fieldMapping.linkedinProfile] !== supabasePerson.linkedin_profile) {
        updateData.linkedin_profile = pipedrivePerson[fieldMapping.linkedinProfile];
      }
      
      // Update job title from custom field
      if (fieldMapping.jobTitle && pipedrivePerson[fieldMapping.jobTitle] && 
          pipedrivePerson[fieldMapping.jobTitle] !== supabasePerson.title) {
        updateData.title = pipedrivePerson[fieldMapping.jobTitle];
      }
      
      // Update primary contact type from custom field (using ID mapping)
      if (fieldMapping.primaryContactType && pipedrivePerson[fieldMapping.primaryContactType]) {
        const primaryTypeId = pipedrivePerson[fieldMapping.primaryContactType];
        const mappedPrimaryType = primaryContactTypeIdMap[primaryTypeId];
        
        if (mappedPrimaryType && validContactTypes.includes(mappedPrimaryType) &&
            mappedPrimaryType !== supabasePerson.primary_contact_type) {
          console.log(`Mapping primary contact type ${primaryTypeId} to ${mappedPrimaryType} for ${pipedrivePerson.name}`);
          updateData.primary_contact_type = mappedPrimaryType;
        }
      }
      
      // Update secondary contact type from custom field (using ID mapping)
      if (fieldMapping.secondaryContactType && pipedrivePerson[fieldMapping.secondaryContactType]) {
        const secondaryTypeId = pipedrivePerson[fieldMapping.secondaryContactType];
        const mappedSecondaryType = secondaryContactTypeIdMap[secondaryTypeId];
        
        if (mappedSecondaryType && validContactTypes.includes(mappedSecondaryType) &&
            mappedSecondaryType !== supabasePerson.secondary_contact_type) {
          console.log(`Mapping secondary contact type ${secondaryTypeId} to ${mappedSecondaryType} for ${pipedrivePerson.name}`);
          updateData.secondary_contact_type = mappedSecondaryType;
        }
      }
      
      // Update headline from custom field
      if (fieldMapping.headline && pipedrivePerson[fieldMapping.headline] && 
          pipedrivePerson[fieldMapping.headline] !== supabasePerson.headline) {
        updateData.headline = pipedrivePerson[fieldMapping.headline];
      }
      
      // Update summary from custom field
      if (fieldMapping.summary && pipedrivePerson[fieldMapping.summary] && 
          pipedrivePerson[fieldMapping.summary] !== supabasePerson.summary) {
        updateData.summary = pipedrivePerson[fieldMapping.summary];
      }
      
      // Update LinkedIn followers from custom field
      if (fieldMapping.linkedinFollowers && pipedrivePerson[fieldMapping.linkedinFollowers] &&
          pipedrivePerson[fieldMapping.linkedinFollowers] !== supabasePerson.num_followers) {
        updateData.num_followers = parseInt(pipedrivePerson[fieldMapping.linkedinFollowers], 10) || null;
      }
      
      // Update location from custom field
      if (fieldMapping.location && pipedrivePerson[fieldMapping.location] && 
          pipedrivePerson[fieldMapping.location] !== supabasePerson.location_name) {
        updateData.location_name = pipedrivePerson[fieldMapping.location];
      }
      
      // Always update the last sync timestamp
      updateData.last_pipedrive_sync = new Date().toISOString();
      
      // If there are changes, update the person in Supabase
      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabase
          .from('people')
          .update(updateData)
          .eq('id', supabasePerson.id);
        
        if (updateError) {
          console.error(`Error updating person ${supabasePerson.full_name}:`, updateError);
        } else {
          console.log(`Updated person ${supabasePerson.full_name} in Supabase with changes:`, updateData);
        }
      } else {
        console.log(`No changes to sync for person ${supabasePerson.full_name}`);
      }
    } else {
      console.log(`Supabase person "${supabasePerson.full_name}" is more recent, updating Pipedrive`);
      
      // Update the Pipedrive record with Supabase data
      await updatePipedriveFromSupabase(supabasePerson, pipedrivePerson.id, fieldMapping);
      
      // Update the last sync timestamp in Supabase
      const { error } = await supabase
        .from('people')
        .update({ last_pipedrive_sync: new Date().toISOString() })
        .eq('id', supabasePerson.id);
      
      if (error) {
        console.error(`Error updating last_pipedrive_sync for person in Supabase:`, error);
      }
    }
  } else {
    console.log(`Person "${pipedrivePerson.name}" is already in sync`);
  }
  
  return supabasePerson;
}

// Function to update a Pipedrive record from Supabase data
async function updatePipedriveFromSupabase(supabasePerson, pipedriveId, fieldMapping) {
  console.log(`Updating Pipedrive record for ${supabasePerson.full_name}`);
  
  // Prepare email array for Pipedrive
  const emails = [];
  if (supabasePerson.work_email) {
    emails.push({ label: 'work', value: supabasePerson.work_email, primary: true });
  }
  if (supabasePerson.personal_email) {
    emails.push({ label: 'personal', value: supabasePerson.personal_email, primary: !supabasePerson.work_email });
  }
  
  // Prepare phone array for Pipedrive
  const phones = [];
  if (supabasePerson.phone) {
    phones.push({ label: 'main', value: supabasePerson.phone, primary: true });
  }
  
  // Create person data object for Pipedrive
  const personData = {
    name: supabasePerson.full_name,
    email: emails,
    phone: phones,
    visible_to: 3, // 3 means visible to everyone
  };
  
  // Add organization if available
  if (supabasePerson.organizations?.pipedrive_org_id) {
    personData.org_id = supabasePerson.organizations.pipedrive_org_id;
  }
  
  // Add notes if available
  if (supabasePerson.notes) personData.notes = supabasePerson.notes;
  
  // Handle title as a custom field
  if (supabasePerson.title && fieldMapping.jobTitle) {
    personData[fieldMapping.jobTitle] = supabasePerson.title;
  }
  
  // Handle LinkedIn profile as a custom field
  if (supabasePerson.linkedin_profile && fieldMapping.linkedinProfile) {
    personData[fieldMapping.linkedinProfile] = supabasePerson.linkedin_profile;
  }
  
  // Handle Primary Contact Type as a custom field
  if (supabasePerson.primary_contact_type && fieldMapping.primaryContactType) {
    personData[fieldMapping.primaryContactType] = supabasePerson.primary_contact_type;
  }
  
  // Handle Secondary Contact Type as a custom field
  if (supabasePerson.secondary_contact_type && fieldMapping.secondaryContactType) {
    personData[fieldMapping.secondaryContactType] = supabasePerson.secondary_contact_type;
  }
  
  // Handle Headline as a custom field
  if (supabasePerson.headline && fieldMapping.headline) {
    personData[fieldMapping.headline] = supabasePerson.headline;
  }
  
  // Handle Summary as a custom field
  if (supabasePerson.summary && fieldMapping.summary) {
    personData[fieldMapping.summary] = supabasePerson.summary;
  }
  
  // Handle LinkedIn Followers as a custom field
  if (supabasePerson.num_followers && fieldMapping.linkedinFollowers) {
    personData[fieldMapping.linkedinFollowers] = supabasePerson.num_followers;
  }
  
  // Handle Location as a custom field
  if (supabasePerson.location_name && fieldMapping.location) {
    personData[fieldMapping.location] = supabasePerson.location_name;
  }
  
  try {
    const response = await makeApiRequest({
      method: 'PUT',
      url: `${pipedriveApiUrl}/persons/${pipedriveId}`,
      params: { api_token: pipedriveApiToken },
      data: personData
    });
    
    if (response.data.success) {
      console.log(`Successfully updated ${supabasePerson.full_name} in Pipedrive`);
      return response.data.data;
    } else {
      console.error(`Error updating ${supabasePerson.full_name} in Pipedrive:`, response.data.error);
      return null;
    }
  } catch (error) {
    console.error(`Exception when updating ${supabasePerson.full_name} in Pipedrive:`, error.message);
    if (error.response) {
      console.error('Error response data:', error.response.data);
    }
    return null;
  }
}

// Function to check for new contacts in Supabase that need to be created in Pipedrive
async function createNewPipedriveContacts(supabasePeople, pipedrivePersonMap, customFieldMap) {
  console.log('Checking for new contacts in Supabase to create in Pipedrive...');
  
  let createdCount = 0;
  
  for (const person of supabasePeople) {
    // Skip if the person already has a Pipedrive ID
    if (person.pipedrive_id && pipedrivePersonMap[person.pipedrive_id]) {
      continue;
    }
    
    console.log(`Creating new contact in Pipedrive: ${person.full_name}`);
    
    // Check if the person already exists in Pipedrive by email
    let existingPerson = null;
    
    // Try to find by work email first
    if (person.work_email) {
      try {
        const response = await makeApiRequest({
          method: 'GET',
          url: `${pipedriveApiUrl}/persons/search`,
          params: {
            api_token: pipedriveApiToken,
            term: person.work_email,
            fields: 'email',
            exact_match: true,
            limit: 1
          }
        });
        
        if (response.data.success && 
            response.data.data && 
            response.data.data.items && 
            response.data.data.items.length > 0) {
          existingPerson = response.data.data.items[0].item;
        }
      } catch (error) {
        console.error(`Error searching for person with email ${person.work_email}:`, error.message);
      }
    }
    
    // If not found by work email, try personal email
    if (!existingPerson && person.personal_email) {
      try {
        const response = await makeApiRequest({
          method: 'GET',
          url: `${pipedriveApiUrl}/persons/search`,
          params: {
            api_token: pipedriveApiToken,
            term: person.personal_email,
            fields: 'email',
            exact_match: true,
            limit: 1
          }
        });
        
        if (response.data.success && 
            response.data.data && 
            response.data.data.items && 
            response.data.data.items.length > 0) {
          existingPerson = response.data.data.items[0].item;
        }
      } catch (error) {
        console.error(`Error searching for person with email ${person.personal_email}:`, error.message);
      }
    }
    
    // If we found an existing person, update Supabase with the Pipedrive ID
    if (existingPerson) {
      console.log(`Found existing person in Pipedrive for ${person.full_name}. Updating Supabase with Pipedrive ID: ${existingPerson.id}`);
      
      // Update Supabase with the Pipedrive ID
      const { error } = await supabase
        .from('people')
        .update({ 
          pipedrive_id: existingPerson.id,
          last_pipedrive_sync: new Date().toISOString()
        })
        .eq('id', person.id);
      
      if (error) {
        console.error(`Error updating Pipedrive ID in Supabase for ${person.full_name}:`, error);
      } else {
        // Update the person in Pipedrive with Supabase data
        await updatePipedriveFromSupabase(person, existingPerson.id, customFieldMap);
      }
      
      continue;
    }
    
    // If no existing person was found, create a new one
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
    
    // Handle organization - try to use the pipedrive_org_id from the related organization
    if (person.organizations?.pipedrive_org_id) {
      personData.org_id = person.organizations.pipedrive_org_id;
    }
    
    // Add notes if available
    if (person.notes) personData.notes = person.notes;
    
    // Handle title as a custom field
    if (person.title && customFieldMap['job title']) {
      personData[customFieldMap['job title']] = person.title;
    }
    
    // Handle LinkedIn profile as a custom field
    if (person.linkedin_profile && customFieldMap['linkedin profile']) {
      personData[customFieldMap['linkedin profile']] = person.linkedin_profile;
    }
    
    // Handle Primary Contact Type as a custom field
    if (person.primary_contact_type && customFieldMap['primary contact type']) {
      personData[customFieldMap['primary contact type']] = person.primary_contact_type;
    }
    
    // Handle Secondary Contact Type as a custom field
    if (person.secondary_contact_type && customFieldMap['secondary contact type']) {
      personData[customFieldMap['secondary contact type']] = person.secondary_contact_type;
    }
    
    // Handle Headline as a custom field
    if (person.headline && customFieldMap['headline']) {
      personData[customFieldMap['headline']] = person.headline;
    }
    
    // Handle Summary as a custom field
    if (person.summary && customFieldMap['summary']) {
      personData[customFieldMap['summary']] = person.summary;
    }
    
    // Handle LinkedIn Followers as a custom field
    if (person.num_followers && customFieldMap['linkedin followers']) {
      personData[customFieldMap['linkedin followers']] = person.num_followers;
    }
    
    // Handle Location as a custom field
    if (person.location_name && customFieldMap['location']) {
      personData[customFieldMap['location']] = person.location_name;
    }
    
    try {
      const response = await makeApiRequest({
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
          .update({ 
            pipedrive_id: response.data.data.id,
            last_pipedrive_sync: new Date().toISOString()
          })
          .eq('id', person.id);
        
        if (error) {
          console.error(`Error updating Pipedrive ID in Supabase for ${person.full_name}:`, error);
        } else {
          createdCount++;
        }
      } else {
        console.error(`Error adding ${person.full_name} to Pipedrive:`, response.data.error);
      }
    } catch (error) {
      console.error(`Exception when adding ${person.full_name} to Pipedrive:`, error.message);
      if (error.response) {
        console.error('Error response data:', error.response.data);
      }
    }
  }
  
  console.log(`Created ${createdCount} new contacts in Pipedrive from Supabase`);
}

// Main function to run the bidirectional sync
async function runBidirectionalSync() {
  try {
    console.log('Starting bidirectional sync between Supabase and Pipedrive...');
    
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
    
    const contactTypeIdMaps = {
      primaryContactTypeIdMap,
      secondaryContactTypeIdMap
    };
    
    // Create field mapping for Pipedrive custom fields
    const fieldMapping = await createFieldMapping();
    
    // Get a custom field map for simpler lookups
    const personFields = await getPersonFieldsFromPipedrive();
    const customFieldMap = {};
    personFields.forEach(field => {
      customFieldMap[field.name.toLowerCase()] = field.key;
    });
    
    // Fetch all persons from Pipedrive
    const pipedrivePersons = await fetchAllPersonsFromPipedrive();
    
    // Fetch all organizations from Pipedrive
    const pipedriveOrganizations = await fetchAllOrganizationsFromPipedrive();
    
    // Fetch all people from Supabase
    const supabasePeople = await fetchPeopleFromSupabase();
    
    // Fetch all organizations from Supabase
    const { data: supabaseOrganizations, error: orgError } = await supabase
      .from('organizations')
      .select('*');
    
    if (orgError) {
      console.error('Error fetching organizations from Supabase:', orgError);
      return;
    }
    
    console.log(`Found ${supabaseOrganizations.length} organizations in Supabase.`);
    
    // Create lookup maps
    const pipedrivePersonMap = {};
    pipedrivePersons.forEach(person => {
      pipedrivePersonMap[person.id] = person;
    });
    
    const pipedriveOrgMap = {};
    pipedriveOrganizations.forEach(org => {
      pipedriveOrgMap[org.id] = org;
    });
    
    const supabasePersonMap = {};
    supabasePeople.forEach(person => {
      if (person.pipedrive_id) {
        supabasePersonMap[person.pipedrive_id] = person;
      }
    });
    
    const supabaseOrgMap = {};
    supabaseOrganizations.forEach(org => {
      if (org.pipedrive_org_id) {
        supabaseOrgMap[org.pipedrive_org_id] = org;
      }
    });
    
    // Start with syncing organizations
    console.log('Syncing organizations...');
    
    for (const pipedriveOrg of pipedriveOrganizations) {
      const supabaseOrg = supabaseOrgMap[pipedriveOrg.id];
      await syncOrganization(pipedriveOrg, supabaseOrg);
    }
    
    // Then sync persons
    console.log('Syncing persons...');
    
    for (const pipedrivePerson of pipedrivePersons) {
      const supabasePerson = supabasePersonMap[pipedrivePerson.id];
      await syncPerson(
        pipedrivePerson, 
        supabasePerson, 
        fieldMapping, 
        validContactTypes, 
        pipedriveOrgMap, 
        supabaseOrgMap, 
        contactTypeIdMaps
      );
    }
    
    // Check for new contacts in Supabase that need to be created in Pipedrive
    await createNewPipedriveContacts(supabasePeople, pipedrivePersonMap, customFieldMap);
    
    console.log('Bidirectional sync completed!');
  } catch (error) {
    console.error('Error during sync process:', error.message);
  }
}

// Run the bidirectional sync
runBidirectionalSync()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  }); 