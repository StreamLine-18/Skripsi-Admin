# --- BUILD STAGE ---
FROM node:20-alpine AS builder
WORKDIR /app

# Set build-time environment variables
ARG VITE_API_BASE_URL=https://api.strmlns.app/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY package*.json ./
RUN npm ci

COPY . .

# Build Vite, output goes to dist/public
RUN npm run build


# --- PRODUCTION STAGE ---
FROM nginx:1.25-alpine

# Remove default nginx files
RUN rm -rf /usr/share/nginx/html/*

# Copy Vite build output (dist/public → nginx root)
COPY --from=builder /app/dist/public /usr/share/nginx/html

# Add our nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
