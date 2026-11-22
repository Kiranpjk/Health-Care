#!/usr/bin/env sh
# End-to-end smoke test against a running API (used by CI after `docker compose up`).
# Usage: scripts/smoke.sh [base_url]
set -eu
BASE="${1:-http://localhost:5000}"
EMAIL="smoke-$(date +%s)@example.com"

req() { # method path [json]
  curl -sS -f -X "$1" "$BASE$2" -H "Content-Type: application/json" \
    ${TOKEN:+-H "Authorization: Bearer $TOKEN"} ${3:+-d "$3"}
}
json() { node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s)[process.argv[1]]))' "$1"; }

echo "health:   $(req GET /health)"
req POST /api/auth/register "{\"name\":\"Smoke\",\"email\":\"$EMAIL\",\"password\":\"secret123\"}" >/dev/null
TOKEN=$(req POST /api/auth/login "{\"email\":\"$EMAIL\",\"password\":\"secret123\"}" | json token)
PATIENT=$(req POST /api/patients '{"name":"John Doe","age":42,"gender":"male"}' | json id)
DOCTOR=$(req POST /api/doctors '{"name":"Dr Smoke","specialization":"Cardiology"}' | json id)
echo "update:   $(req PUT /api/patients/$PATIENT '{"age":43}')"
MAPPING=$(req POST /api/mappings "{\"patient_id\":$PATIENT,\"doctor_id\":$DOCTOR}" | json id)
echo "doctors:  $(req GET /api/mappings/$PATIENT)"
req DELETE /api/mappings/$MAPPING >/dev/null
req DELETE /api/patients/$PATIENT >/dev/null
req DELETE /api/doctors/$DOCTOR >/dev/null
echo "smoke test passed"
