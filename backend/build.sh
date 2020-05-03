#!/usr/bin/env bash

# build the app's container
echo "building backend container image"
docker build -t trusty-pin-backend:latest .
