#!/bin/sh
set -e

# Debug: Print the original API_INTERNAL_URL
echo "Original API_INTERNAL_URL: $API_INTERNAL_URL"

# If API_INTERNAL_URL does not start with http, prepend https://
if ! echo "$API_INTERNAL_URL" | grep -q "^http"; then
  API_INTERNAL_URL="https://$API_INTERNAL_URL"
fi

# Debug: Print the final API_INTERNAL_URL
echo "Final API_INTERNAL_URL: $API_INTERNAL_URL"

# Substitute environment variables in the template
envsubst '$API_INTERNAL_URL' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

# Debug: Show the generated config
echo "Generated nginx.conf:"
cat /etc/nginx/nginx.conf

# Start nginx
exec nginx -g "daemon off;"
