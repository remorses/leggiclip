FROM --platform=linux/amd64 node:22-slim

WORKDIR /app

COPY docker.package.json ./package.json

RUN npm install -g remix-serve-but-not-shit@0.0.6 && npm install

COPY ./build /app/build

env PORT=8040

EXPOSE $PORT



CMD ["remix-serve-but-not-shit", "./build/server/index.js"]
