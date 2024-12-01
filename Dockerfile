FROM --platform=linux/amd64 node:22-slim

WORKDIR /app

COPY docker.package.json ./package.json

RUN npm install -g @react-router/serve && npm install

RUN ls -l

COPY ./build /app/build

env PORT=8040

EXPOSE $PORT



CMD ["react-router-serve", "./build/server/index.js"]
