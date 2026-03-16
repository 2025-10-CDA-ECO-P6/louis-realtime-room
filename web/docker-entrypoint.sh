#!/bin/sh
set -e

# Debug: Print the original API_INTERNAL_URL
echo "Original API_INTERNAL_URL: $API_INTERNAL_URL"

# If API_INTERNAL_URL does not start with http, prepend https://
if ! echo "$API_INTERNAL_URL" | grep -q "^http"; then
  API_INTERNAL_URL="https://$API_INTERNAL_URL"
fi

# Extract the hostname from the URL for SNI and Host header
API_HOST=$(echo "$API_INTERNAL_URL" | sed -E 's|https?://([^/:]+).*|\1|')
export API_HOST

# Detect DNS resolver: use Docker's internal DNS if available, else public DNS
if nslookup localhost 127.0.0.11 > /dev/null 2>&1; then
  DNS_RESOLVER="127.0.0.11"
else
  DNS_RESOLVER="8.8.8.8"
fi
export DNS_RESOLVER

# Debug: Print the final values
echo "Final API_INTERNAL_URL: $API_INTERNAL_URL"
echo "Final API_HOST: $API_HOST"
echo "DNS_RESOLVER: $DNS_RESOLVER"

# Substitute environment variables in the template
envsubst '$API_INTERNAL_URL $API_HOST $DNS_RESOLVER' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

# Debug: Show the generated config
echo "Generated nginx.conf:"
cat /etc/nginx/nginx.conf

# Start nginx
exec nginx -g "daemon off;"
