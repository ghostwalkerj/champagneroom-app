#!/usr/bin/env bash
SERVER_IP=170.64.248.36
echo "Deploying to DigitalOcean..."
ssh  "root@${SERVER_IP}" \
  "docker pull registry.digitalocean.com/champagne/pcall \
  && docker stop live-container \
  && docker rm live-container \
  && docker run --init -d --name live-container -p 3000:3000 registry.digitalocean.com/champagne/pcall \
  && docker system prune -af" # remove unused images to free up space

echo "Successfully deployed, hooray!"