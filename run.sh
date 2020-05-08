#!/usr/bin/env bash

# setup and get running the backend which does the pinning

# assumes that docker on host machine
#  - requires installed https://github.com/ashald/docker-volume-loopback

# create our loopback storage volume for ipfs node data
echo 'Creating 10GiB volume for ipfs data'
# docker volume create -d ashald/docker-volume-loopback -o fs=ext4 -o size=10GiB TrustyPin-ipfs-data

# start up the image for ipfs node ataching
# the loopback volume for it's storage
echo 'running ipfs node container'
#docker run \
#  --name=ipfs-node \
#  -d \
#  -v TrustyPin-ipfs-data:/data/ipfs \
#  -p 4001:4001 \
#  -p 127.0.0.1:8080:8080 \
#  -p 127.0.0.1:5001:5001 \
#  ipfs/go-ipfs:master-2020-05-02-6c1bf89

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

