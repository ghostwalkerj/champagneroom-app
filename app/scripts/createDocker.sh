#!/usr/bin/env bash
VERSION=patch
DOCKER_DEFAULT_PLATFORM=linux/amd64
BUILDKIT_PROGRESS=plain

cd ..
cp .env.stage .env
yarn version --$VERSION
docker system prune -f
yarn build
yarn package
docker-compose --env-file .env.stage -f docker-compose.stage.yml build
docker tag pcall registry.digitalocean.com/champagne/pcall
docker push registry.digitalocean.com/champagne/pcall
cp .env.dev .env
