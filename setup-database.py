import requests
import json

SUPABASE_URL = "https://zwtpllgtzbotkdjyeiqi.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3dHBsbGd0emJvdGtkanllaXFpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzYyMTE2NiwiZXhwIjoyMDg5MTk3MTY2fQ.eRiqJQEdppoUwsZML6SZnScuiGiTRM1dku3aJUFJbDE"

# Read the SQL schema
with open('supabase-schema.sql', 'r') as f:
    sql = f.read()

# Execute the SQL
headers = {
    "apikey": SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
    "Content-Type": "application/json"
}

# Split into individual statements and execute
url = f"{SUPABASE_URL}/rest/v1/rpc/exec_sql"

# Use the SQL endpoint
sql_url = f"{SUPABASE_URL}/pg/query"

response = requests.post(
    sql_url,
    headers={
        "apikey": SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "x-supabase-authorization": f"Bearer {SERVICE_ROLE_KEY}"
    },
    json={"query": sql}
)

print(f"Status: {response.status_code}")
print(f"Response: {response.text}")