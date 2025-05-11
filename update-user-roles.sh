#!/bin/bash

# Supabase credentials
SUPABASE_URL="https://bbibzoifpslvqhccvqol.supabase.co"
SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJiaWJ6b2lmcHNsdnFoY2N2cW9sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczODQ1MjQ5OCwiZXhwIjoyMDU0MDI4NDk4fQ.v3YWgK3jnLKm5VjRE-B3LLdoMQ9Y-DwRR9Eq0wBV9SY"

# Update Justin's user role
echo "Updating role for justin@outdoorithmcollective.org"

# First get the user's ID
USER_ID_JSON=$(curl -s --request GET "$SUPABASE_URL/rest/v1/users?email=eq.justin@outdoorithmcollective.org" \
  --header "apikey: $SERVICE_ROLE_KEY" \
  --header "Authorization: Bearer $SERVICE_ROLE_KEY")

JUSTIN_ID=$(echo $USER_ID_JSON | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ -n "$JUSTIN_ID" ]; then
  echo "Found user ID for Justin: $JUSTIN_ID"
  
  # Update the role
  curl -s --request PATCH "$SUPABASE_URL/rest/v1/user_profiles?id=eq.$JUSTIN_ID" \
    --header "apikey: $SERVICE_ROLE_KEY" \
    --header "Authorization: Bearer $SERVICE_ROLE_KEY" \
    --header "Content-Type: application/json" \
    --header "Prefer: return=minimal" \
    --data '{"role":"admin","first_name":"Justin","last_name":"Outdoorithm"}'
  
  echo "Role updated for Justin"
else
  echo "Could not find user ID for Justin"
fi

echo -e "\n\n"

# Update Sally's user role
echo "Updating role for sally@outdoorithmcollective.org"

# First get the user's ID
USER_ID_JSON=$(curl -s --request GET "$SUPABASE_URL/rest/v1/users?email=eq.sally@outdoorithmcollective.org" \
  --header "apikey: $SERVICE_ROLE_KEY" \
  --header "Authorization: Bearer $SERVICE_ROLE_KEY")

SALLY_ID=$(echo $USER_ID_JSON | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ -n "$SALLY_ID" ]; then
  echo "Found user ID for Sally: $SALLY_ID"
  
  # Update the role
  curl -s --request PATCH "$SUPABASE_URL/rest/v1/user_profiles?id=eq.$SALLY_ID" \
    --header "apikey: $SERVICE_ROLE_KEY" \
    --header "Authorization: Bearer $SERVICE_ROLE_KEY" \
    --header "Content-Type: application/json" \
    --header "Prefer: return=minimal" \
    --data '{"role":"admin","first_name":"Sally","last_name":"Outdoorithm"}'
  
  echo "Role updated for Sally"
else
  echo "Could not find user ID for Sally"
fi

echo -e "\n\nUser role updates complete!" 