#!/usr/bin/env bash

echo 'Creating 10GiB volume for ipfs data'
docker volume create -d ashald/docker-volume-loopback -o fs=ext4 -o size=10GiB TrustyPin-ipfs-data-local

# start up the image for ipfs node ataching
# the loopback volume for it's storage
echo 'running ipfs node container'
docker run \
  --name=ipfs-node \
  -d \
  -v TrustyPin-ipfs-data-local:/data/ipfs \
  -p 4001:4001 \
  -p 127.0.0.1:8080:8080 \
  -p 127.0.0.1:5001:5001 \
  ipfs/go-ipfs:master-2020-05-02-6c1bf89
