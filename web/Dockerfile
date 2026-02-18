FROM node:20-alpine AS builder

WORKDIR /app

COPY . .

RUN npm install -g pnpm && pnpm install

RUN pnpm run build

RUN addgroup --system --gid 1001 webgroup 
RUN adduser --system --uid 1001 web
RUN chown -R web:webgroup /app

USER web

