FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install pnpm globally
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --no-frozen-lockfile

# Copy source files
COPY . .

# Build argument for API URL
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Build the application
RUN pnpm run build

FROM nginx:1.25-alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY --from=builder /app/nginx.conf.template /etc/nginx/nginx.conf.template

RUN addgroup --system --gid 1001 webgroup 
RUN adduser --system --uid 1001 web
RUN chown -R web:webgroup /usr/share/nginx/html

ENV API_INTERNAL_URL=http://api:3001

EXPOSE 80

# Create entrypoint script to substitute env vars and start nginx
RUN echo '#!/bin/sh' > /docker-entrypoint-custom.sh && \
    echo 'envsubst "\$API_INTERNAL_URL" < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf' >> /docker-entrypoint-custom.sh && \
    echo 'exec nginx -g "daemon off;"' >> /docker-entrypoint-custom.sh && \
    chmod +x /docker-entrypoint-custom.sh

CMD ["/docker-entrypoint-custom.sh"]