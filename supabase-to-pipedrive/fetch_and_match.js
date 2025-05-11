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

// Helper function to add delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Function to make API request with retries
async function makeApiRequest(config, maxRetries = 3, initialDelay = 2000) {
  let retries = 0;
  let delayTime = initialDelay;
  
  while (retries <= maxRetries) {
    try {
      const response = await axios(config);
      return response;
    } catch (error) {
      if (error.response && error.response.status === 429 && retries < maxRetries) {
        // Rate limit hit, wait and retry
        console.log(`Rate limit hit. Waiting ${delayTime}ms before retry...`);
        await delay(delayTime);
        retries++;
        delayTime *= 2; // Exponential backoff
      } else {
        throw error;
      }
    }
  }
}

// Function to fetch all organizations from Supabase
async function fetchOrganizationsFromSupabase() {
  console.log('Fetching organizations from Supabase...');
  
  const { data: organizations, error } = await supabase
    .from('organizations')
    .select('id, name, normalized_domain, pipedrive_org_id, website_url');
  
  if (error) {
    console.error('Error fetching organizations from Supabase:', error);
    return [];
  }
  
  console.log(`Found ${organizations.length} organizations in Supabase.`);
  return organizations;
}

// Function to fetch all people from Supabase
async function fetchPeopleFromSupabase() {
  console.log('Fetching people from Supabase...');
  
  const { data: people, error } = await supabase
    .from('people')
    .select(`
      id,
      full_name,
      work_email,
      personal_email,
      pipedrive_id,
      organization_id
    `);
  
  if (error) {
    console.error('Error fetching people from Supabase:', error);
    return [];
  }
  
  console.log(`Found ${people.length} people in Supabase.`);
  return people;
}

// Function to fetch all organizations from Pipedrive
async function fetchAllOrganizationsFromPipedrive() {
  console.log('Fetching all organizations from Pipedrive...');
  
  let allOrganizations = [];
  let start = 0;
  const limit = 100;
  let moreItems = true;
  
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
      
      const { data, additional_data } = response.data;
      
      if (data && data.length > 0) {
        allOrganizations = allOrganizations.concat(data);
        console.log(`Fetched ${data.length} organizations (total: ${allOrganizations.length})`);
        
        // Check if there are more items
        moreItems = additional_data && additional_data.pagination && 
                    additional_data.pagination.more_items_in_collection;
        
        // Update start for next page
        if (moreItems) {
          start += limit;
          // Add a delay to avoid rate limits
          await delay(1000);
        }
      } else {
        moreItems = false;
      }
    } catch (error) {
      console.error('Error fetching organizations from Pipedrive:', error.message);
      moreItems = false;
    }
  }
  
  console.log(`Total organizations fetched from Pipedrive: ${allOrganizations.length}`);
  return allOrganizations;
}

// Function to fetch all persons from Pipedrive
async function fetchAllPersonsFromPipedrive() {
  console.log('Fetching all persons from Pipedrive...');
  
  let allPersons = [];
  let start = 0;
  const limit = 100;
  let moreItems = true;
  
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
      
      const { data, additional_data } = response.data;
      
      if (data && data.length > 0) {
        allPersons = allPersons.concat(data);
        console.log(`Fetched ${data.length} persons (total: ${allPersons.length})`);
        
        // Check if there are more items
        moreItems = additional_data && additional_data.pagination && 
                    additional_data.pagination.more_items_in_collection;
        
        // Update start for next page
        if (moreItems) {
          start += limit;
          // Add a delay to avoid rate limits
          await delay(1000);
        }
      } else {
        moreItems = false;
      }
    } catch (error) {
      console.error('Error fetching persons from Pipedrive:', error.message);
      moreItems = false;
    }
  }
  
  console.log(`Total persons fetched from Pipedrive: ${allPersons.length}`);
  return allPersons;
}

// Function to normalize domain
function normalizeDomain(domain) {
  if (!domain) return '';
  return domain.toLowerCase().replace(/^www\./, '');
}

// Function to extract domain from URL
function extractDomain(url) {
  if (!url) return '';
  
  try {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    const urlObj = new URL(url);
    return normalizeDomain(urlObj.hostname);
  } catch (error) {
    return '';
  }
}

// Function to match and update Supabase organizations with Pipedrive IDs
async function matchAndUpdateOrganizations(supabaseOrgs, pipedriveOrgs) {
  console.log('Matching organizations between Supabase and Pipedrive...');
  
  let updatedCount = 0;
  let notFoundCount = 0;
  let alreadySyncedCount = 0;
  
  // Create a map of normalized domains to Pipedrive organizations
  const pipedriveDomainMap = new Map();
  const pipedriveNameMap = new Map();
  
  pipedriveOrgs.forEach(org => {
    // Add to domain map if there's a domain
    if (org.cc_email) {
      const domain = extractDomain(org.cc_email.split('@')[1]);
      if (domain) {
        pipedriveDomainMap.set(domain, org);
      }
    }
    
    // Also add to name map (lowercased for case-insensitive matching)
    if (org.name) {
      pipedriveNameMap.set(org.name.toLowerCase(), org);
    }
  });
  
  // Match each Supabase organization
  for (const org of supabaseOrgs) {
    // Skip if already has a Pipedrive ID
    if (org.pipedrive_org_id) {
      alreadySyncedCount++;
      continue;
    }
    
    // Try matching by domain first
    let pipedriveOrg = null;
    if (org.normalized_domain) {
      pipedriveOrg = pipedriveDomainMap.get(normalizeDomain(org.normalized_domain));
    }
    
    // If no match by domain, try matching by name
    if (!pipedriveOrg && org.name) {
      pipedriveOrg = pipedriveNameMap.get(org.name.toLowerCase());
    }
    
    // If we found a match, update the Supabase record
    if (pipedriveOrg) {
      console.log(`Found match for ${org.name}: ${pipedriveOrg.name} (ID: ${pipedriveOrg.id})`);
      
      // Update Supabase
      const { error } = await supabase
        .from('organizations')
        .update({ pipedrive_org_id: pipedriveOrg.id })
        .eq('id', org.id);
      
      if (error) {
        console.error(`Error updating Pipedrive ID for organization ${org.name}:`, error);
      } else {
        console.log(`Updated organization ${org.name} with Pipedrive ID: ${pipedriveOrg.id}`);
        updatedCount++;
      }
    } else {
      console.log(`No match found for organization: ${org.name}`);
      notFoundCount++;
    }
  }
  
  console.log(`Organization matching complete.`);
  console.log(`Already synced: ${alreadySyncedCount}`);
  console.log(`Updated: ${updatedCount}`);
  console.log(`Not found: ${notFoundCount}`);
}

// Function to match and update Supabase people with Pipedrive IDs
async function matchAndUpdatePeople(supabasePeople, pipedrivePersons) {
  console.log('Matching people between Supabase and Pipedrive...');
  
  let updatedCount = 0;
  let notFoundCount = 0;
  let alreadySyncedCount = 0;
  
  // Create a map of emails to Pipedrive persons
  const pipedriveEmailMap = new Map();
  const pipedriveNameMap = new Map();
  
  pipedrivePersons.forEach(person => {
    // Add each email to the map
    if (person.email && person.email.length > 0) {
      person.email.forEach(emailObj => {
        if (emailObj.value) {
          pipedriveEmailMap.set(emailObj.value.toLowerCase(), person);
        }
      });
    }
    
    // Also add to name map (lowercased for case-insensitive matching)
    if (person.name) {
      pipedriveNameMap.set(person.name.toLowerCase(), person);
    }
  });
  
  // Match each Supabase person
  for (const person of supabasePeople) {
    // Skip if already has a Pipedrive ID
    if (person.pipedrive_id) {
      alreadySyncedCount++;
      continue;
    }
    
    // Try matching by email first
    let pipedrivePerson = null;
    if (person.work_email) {
      pipedrivePerson = pipedriveEmailMap.get(person.work_email.toLowerCase());
    }
    
    // Try personal email if work email didn't match
    if (!pipedrivePerson && person.personal_email) {
      pipedrivePerson = pipedriveEmailMap.get(person.personal_email.toLowerCase());
    }
    
    // If no match by email, try matching by name
    if (!pipedrivePerson && person.full_name) {
      pipedrivePerson = pipedriveNameMap.get(person.full_name.toLowerCase());
    }
    
    // If we found a match, update the Supabase record
    if (pipedrivePerson) {
      console.log(`Found match for ${person.full_name}: ${pipedrivePerson.name} (ID: ${pipedrivePerson.id})`);
      
      // Update Supabase
      const { error } = await supabase
        .from('people')
        .update({ pipedrive_id: pipedrivePerson.id })
        .eq('id', person.id);
      
      if (error) {
        console.error(`Error updating Pipedrive ID for person ${person.full_name}:`, error);
      } else {
        console.log(`Updated person ${person.full_name} with Pipedrive ID: ${pipedrivePerson.id}`);
        updatedCount++;
      }
    } else {
      console.log(`No match found for person: ${person.full_name}`);
      notFoundCount++;
    }
  }
  
  console.log(`Person matching complete.`);
  console.log(`Already synced: ${alreadySyncedCount}`);
  console.log(`Updated: ${updatedCount}`);
  console.log(`Not found: ${notFoundCount}`);
}

// Main function
async function syncPipedriveIds() {
  try {
    // 1. Fetch all data from both systems
    const [supabaseOrgs, supabasePeople, pipedriveOrgs, pipedrivePersons] = await Promise.all([
      fetchOrganizationsFromSupabase(),
      fetchPeopleFromSupabase(),
      fetchAllOrganizationsFromPipedrive(),
      fetchAllPersonsFromPipedrive()
    ]);
    
    // 2. Match and update organizations
    await matchAndUpdateOrganizations(supabaseOrgs, pipedriveOrgs);
    
    // 3. Match and update people
    await matchAndUpdatePeople(supabasePeople, pipedrivePersons);
    
    console.log('Sync complete!');
    
  } catch (error) {
    console.error('Error in sync process:', error);
  }
}

// Run the sync
syncPipedriveIds()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  }); 