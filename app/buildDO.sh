#!/usr/bin/env bash
DOCKER_DEFAULT_PLATFORM=linux/amd64
BUILDKIT_PROGRESS=plain
docker-compose -f docker-compose.stage.yml build        
docker tag pcall registry.digitalocean.com/champagne/pcall   
docker push registry.digitalocean.com/champagne/pcall   