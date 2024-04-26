# Our Node base image
FROM node:lts

# Set the Node environment to development to ensure all packages are installed
ENV NODE_ENV development

ENV NODE_OPTIONS --max-old-space-size=4096

ARG MONGO_DB_FIELD_SECRET

# installing with yarn
# RUN npm i -g yarn

# Change our current working directory
WORKDIR /usr/src/app

# Copy over `package.json` and lock files to optimize the build process
COPY ["package.json", "yarn.lock", "./"]

# Copy over rest of the project files
COPY . .

# bun build
RUN set -ex; \
  yarn install; \
  yarn package;\
  yarn build

# COPY .env.stage .env

# Expose port 3000 for the SvelteKit app and 24678 for Vite's HMR
EXPOSE 3000

# Run `yarn start`
CMD ["yarn", "start"]
