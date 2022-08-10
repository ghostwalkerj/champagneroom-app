# couchDB install
FROM couchdb:alpine

# pCall install
FROM node:alpine
ENV NODE_ENV=production
WORKDIR /app
COPY package*.json ./
RUN apk add --no-cache \
  build-base \
  curl \
  git \
  linux-headers \
  nodejs \
  npm \
  py3-pip \
  python3 \
  python3-dev
RUN  ln -sf python3 /usr/bin/python
RUN yarn --frozen-lockfile
COPY . .
EXPOSE 3000
RUN chown -R node /app
RUN rm -rf .build
USER node
CMD yarn run start
