#!/usr/bin/env bash

# setup and get running the backend which does the pinning

# assumes that docker on host machine
#  - requires installed https://github.com/ashald/docker-volume-loopback

# ./run-ipfs.sh

# start the container which will maintain the pins
# from the TrustyPins contract
# TODO: default to live chain
echo "running TrustyPin's backend container"
docker run \
  -it \
  --link=ipfs-node \
  --link=ganache \
  -e WEB3_PROVIDER_URL=ws://ganache:8545 \
  -e IPFS_NODE_URL=http://ipfs-node:5001 \
  trusty-pin-backend:latest

