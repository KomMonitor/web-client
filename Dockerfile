# ---- Base build ----
FROM node:alpine as build


RUN apk add --no-cache \
  git

RUN mkdir -p /kommonitor-webclient 

# Copy source files for build
ADD . /kommonitor-webclient
WORKDIR /kommonitor-webclient

# Run the build
RUN npm run build

# actual image
FROM nginx:alpine

COPY --from=build kommonitor-webclient/nginx.conf /etc/nginx/nginx.conf

WORKDIR /usr/share/nginx/html

## Remove default nginx website
RUN rm -rf /usr/share/nginx/html/*
## From 'builder' stage copy over the artifacts in dist folder to default nginx public folder
COPY --from=build kommonitor-webclient/dist /usr/share/nginx/html
CMD ["nginx", "-g", "daemon off;"]
