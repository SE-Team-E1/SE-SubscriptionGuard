#!/bin/sh
set -eu

cd "$(dirname "$0")/.."

# Both modes share a Compose project. Keep all local data.
docker compose -f compose.yml -f compose.dev.yml down
