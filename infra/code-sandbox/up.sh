#!/usr/bin/env bash
set -euo pipefail
directory="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
root="$(cd -- "$directory/../.." && pwd)"
cd "$root"
node "$directory/setup.mjs"
docker build --target sandbox-build -f "$directory/upstream/api/Dockerfile" -t librechat-sandbox-runner:base "$directory/upstream"
docker build -f "$directory/Dockerfile.runner" -t librechat-sandbox-runner:local "$directory"
docker compose up -d --no-build api
docker compose -f "$directory/compose.yaml" --env-file "$directory/.env" up -d --build --wait --wait-timeout 180
echo 'Sandbox started. Select Data analysis in LibreChat at http://localhost:3081.'
