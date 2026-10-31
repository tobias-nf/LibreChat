#!/bin/sh
set -eu

if [ "${CODE_EXECUTION_ENABLED:-}" = false ]; then
  if [ "$(id -u)" = 0 ]; then
    su-exec node node /app/infra/render-config.mjs
  else
    node /app/infra/render-config.mjs
  fi
  export CONFIG_PATH=/tmp/librechat-runtime.yaml
fi

# Railway supplies one persistent volume per service. Keep local bind mounts usable.
if [ "${PERSISTENT_DATA_DIR:-}" = /app/data ]; then
  for name in uploads logs skill; do
    mkdir -p "/app/data/$name"
    if [ ! -L "/app/$name" ]; then
      cp -a "/app/$name/." "/app/data/$name/"
      rm -rf "/app/$name"
      ln -s "/app/data/$name" "/app/$name"
    fi
  done
  mkdir -p /app/data/images
  if [ ! -L /app/client/public/images ]; then
    cp -a /app/client/public/images/. /app/data/images/
    rm -rf /app/client/public/images
    ln -s /app/data/images /app/client/public/images
  fi
  chown -R node:node /app/data
fi

if [ "$(id -u)" = 0 ]; then
  exec su-exec node "$@"
fi
exec "$@"
