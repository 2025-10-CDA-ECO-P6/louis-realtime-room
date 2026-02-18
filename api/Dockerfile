# Dockerfile for Express API
FROM node:22-alpine
WORKDIR /app
COPY package.json ./
RUN npm install -g pnpm && pnpm install
COPY . .

RUN addgroup --system --gid 1001 apigrpoup
RUN adduser --system --uid 1001 api

RUN chown -R api:apigrpoup /app

USER api

EXPOSE 3001
CMD ["pnpm", "start"]
