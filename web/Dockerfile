# pCall install
FROM node:alpine
WORKDIR /app

ENV VITE_ROOM_PATH=r
ENV VITE_TALENT_PATH=t
ENV VITE_AGENT_PATH=a
ENV VITE_MOBILE_PATH=m
ENV VITE_API_PATH=/api/v1
ENV VITE_AUTH_PATH=/api/v1/auth
ENV VITE_IMAGE_UPLOAD_PATH=/api/v1/upload
ENV VITE_CALL_TIMEOUT=30000
ENV VITE_INFURA_ID=69863419b8cb4448a5fbad58c6186181
ENV VITE_DEFAULT_PROFILE_IMAGE=/assets/default.png
ENV VITE_RXDB_PASSWORD=ilikebigbutts
ENV VITE_INFURA_IPFS_PROJECT_ID=2Cv5nC4sohQxIGH2XrK432vVdT0
ENV VITE_INFURA_IPFS_PROJECT_SECRET=950a33da3a38b113ef7fa15c3b8af8c9
ENV VITE_INFURA_IPFS_API_URL=ipfs.infura.io
ENV VITE_INFURA_IPFS_API_PORT=5001
ENV VITE_INFURA_IPFS_DEDICATED_GATEWAY=https://pcall.infura-ipfs.io
ENV VITE_DOCKERIZED=true

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

RUN yarn build
RUN chown -R node:node /app
RUN rm -rf .build

USER node
EXPOSE 3000/tcp
CMD yarn run start
