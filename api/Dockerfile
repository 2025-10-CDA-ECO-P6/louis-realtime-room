# Dockerfile for Express API
FROM node:22-alpine
WORKDIR /app

COPY package.json ./
RUN npm install -g pnpm && pnpm install

COPY . .

RUN addgroup --system --gid 1001 apigroup
RUN adduser --system --uid 1001 api
RUN chown -R api:apigroup /app

USER api

EXPOSE 3001

ENV PORT=3001
ARG WEB_URL
ENV WEB_URL=$WEB_URL

CMD ["node", "index.js"]
