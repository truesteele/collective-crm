const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkOrgs() {
  try {
    console.log('Checking organizations in Supabase...');
    const { data, error } = await supabase
      .from('organizations')
      .select('id, name, pipedrive_org_id')
      .limit(10);
    
    if (error) {
      console.error('Error fetching organizations:', error);
      return;
    }
    
    console.log(`Found ${data.length} organizations`);
    console.log('First 10 organizations:');
    data.forEach(org => {
      console.log(`${org.name} (ID: ${org.id}, Pipedrive ID: ${org.pipedrive_org_id})`);
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

checkOrgs(); 