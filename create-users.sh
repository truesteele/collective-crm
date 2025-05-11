#!/bin/bash

# Supabase credentials
SUPABASE_URL="https://bbibzoifpslvqhccvqol.supabase.co"
SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJiaWJ6b2lmcHNsdnFoY2N2cW9sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczODQ1MjQ5OCwiZXhwIjoyMDU0MDI4NDk4fQ.v3YWgK3jnLKm5VjRE-B3LLdoMQ9Y-DwRR9Eq0wBV9SY"

# Function URL - adjust if necessary
FUNCTION_URL="${SUPABASE_URL}/functions/v1/create-admin-user"

# Create Justin's user
echo "Creating user: justin@outdoorithmcollective.org"
curl -i --request POST "$FUNCTION_URL" \
  --header "Authorization: Bearer $SERVICE_ROLE_KEY" \
  --header "Content-Type: application/json" \
  --data '{"email":"justin@outdoorithmcollective.org","password":"Password123!","first_name":"Justin","last_name":"Outdoorithm"}'

echo -e "\n\n"

# Create Sally's user
echo "Creating user: sally@outdoorithmcollective.org"
curl -i --request POST "$FUNCTION_URL" \
  --header "Authorization: Bearer $SERVICE_ROLE_KEY" \
  --header "Content-Type: application/json" \
  --data '{"email":"sally@outdoorithmcollective.org","password":"Password123!","first_name":"Sally","last_name":"Outdoorithm"}'

echo -e "\n\nUser creation complete!" 