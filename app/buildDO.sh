#!/usr/bin/env bash

docker-compose -f docker-compose.dev.yml build        
docker tag pcall registry.digitalocean.com/champagne/pcall   
docker push registry.digitalocean.com/champagne/pcall   