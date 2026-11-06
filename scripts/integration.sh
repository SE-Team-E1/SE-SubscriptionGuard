#!/bin/sh
set -eu

cd "$(dirname "$0")/.."

# Stop either mode without deleting database or dependency volumes.
docker compose -f compose.yml -f compose.dev.yml down
docker compose -f compose.yml up -d --build --wait
