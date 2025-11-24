# Multi-stage Dockerfile for Vite + React app
ARG NODE_VERSION=23.10.0-alpine
FROM node:$NODE_VERSION AS base
WORKDIR /app

FROM base AS deps
COPY package*.json .
RUN npm install

FROM base AS builder
COPY --from=deps /app/node_modules /app/node_modules
COPY . .
RUN npm run build

FROM base AS development
COPY --from=deps /app/node_modules /app/node_modules
COPY . .
CMD [ "npm", "run", "dev" ]

# Stage 2: Serve static files
FROM nginx:1.28-alpine AS production
RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder /app/dist/public /usr/share/nginx/html
COPY .docker/app.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
