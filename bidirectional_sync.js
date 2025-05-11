async function syncOrganization(pipedriveOrg, supabaseOrg) {
  // If we don't have a Supabase record, we need to create one
  if (!supabaseOrg) {
    console.log(`Creating new organization in Supabase: ${pipedriveOrg.name}`);
    
    try {
      // Only include the essential fields that we get from Pipedrive
      // All other fields will maintain their default values
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
      
      // Only update fields that are sourced from Pipedrive
      // This preserves all other Supabase-specific fields
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
        console.log(`Updated organization "${pipedriveOrg.name}" in Supabase with fields: ${Object.keys(updateData).join(', ')}`);
      }
    } else {
      console.log(`Supabase organization "${supabaseOrg.name}" is more recent, will update Pipedrive`);
      
      try {
        // For Pipedrive updates, we only send the fields that Pipedrive knows about
        const pipedriveData = {
          name: supabaseOrg.name
        };
        
        // Only include URL if it exists in Supabase
        if (supabaseOrg.website_url) {
          pipedriveData.url = supabaseOrg.website_url;
        }
        
        const response = await makeApiRequest({
          method: 'PUT',
          url: `${pipedriveApiUrl}/organizations/${pipedriveOrg.id}`,
          params: { api_token: pipedriveApiToken },
          data: pipedriveData
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