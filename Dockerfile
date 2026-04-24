# ---- Base build ----
FROM node:22-alpine as build


RUN apk add --no-cache \
  git \
  python3 \
  g++ \
  make

RUN mkdir -p /kommonitor-webclient 

# Copy source files for build
ADD . /kommonitor-webclient
WORKDIR /kommonitor-webclient

# Run the build
RUN npm install --force
RUN npm run build

# actual image
FROM nginx:stable-alpine

COPY --from=build kommonitor-webclient/nginx.conf /etc/nginx/nginx.conf

WORKDIR /usr/share/nginx/html

## Remove default nginx website
RUN rm -rf /usr/share/nginx/html/*
## From 'builder' stage copy over the artifacts in dist folder to default nginx public folder
COPY --from=build kommonitor-webclient/dist/kommonitor-client /usr/share/nginx/html
CMD ["nginx", "-g", "daemon off;"]
