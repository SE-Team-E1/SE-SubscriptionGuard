#!/bin/sh
set -eu

# Resolve Compose files from the repository, regardless of the caller's directory.
cd "$(dirname "$0")/.."

docker compose -f compose.yml -f compose.dev.yml down
docker compose -f compose.yml -f compose.dev.yml up -d --build --wait
