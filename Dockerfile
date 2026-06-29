# ---- Build stage ----
# Node 24 to match .nvmrc / CI (quality-gate runs on Node 24)
FROM node:24-alpine AS build

# Toolchain for native node-gyp dependencies
RUN apk add --no-cache \
  git \
  python3 \
  g++ \
  make

WORKDIR /kommonitor-webclient

# Install dependencies first so this layer is cached unless the lockfile changes.
# Use `npm ci --force` to mirror the CI install (reproducible, lockfile-driven).
COPY package.json package-lock.json ./
RUN npm ci --force

# Copy the rest of the source and run the production build
COPY . .
RUN npm run build

# ---- Runtime stage ----
FROM nginx:stable-alpine

COPY --from=build /kommonitor-webclient/nginx.conf /etc/nginx/nginx.conf

WORKDIR /usr/share/nginx/html

## Remove default nginx website
RUN rm -rf /usr/share/nginx/html/*
## Copy the built artifacts (Angular `application` builder emits straight into dist/kommonitor-client)
COPY --from=build /kommonitor-webclient/dist/kommonitor-client /usr/share/nginx/html

CMD ["nginx", "-g", "daemon off;"]
