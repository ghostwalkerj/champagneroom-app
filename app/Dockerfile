# Our Node base image
FROM node:20.12.12

# Set the Node environment to development to ensure all packages are installed
ENV NODE_ENV development

ENV NODE_OPTIONS --max-old-space-size=4096

ARG MONGO_DB_FIELD_SECRET

# installing with bun and running with pnpm
RUN npm i -g bun
RUN npm i -g pnpm

# Change our current working directory
WORKDIR /usr/src/app

# Copy over `package.json` and lock files to optimize the build process
COPY ["package.json", "bun.lockb", "./"]

# Copy over rest of the project files
COPY . .

# bun build
RUN set -ex; \
  bun install; \
  bun pm cache rm; \
  bun run package;\
  bun run build

# COPY .env.stage .env

# Expose port 3000 for the SvelteKit app and 24678 for Vite's HMR
EXPOSE 3000

# Run `yarn start`
CMD ["pnpm", "start"]
