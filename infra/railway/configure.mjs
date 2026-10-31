import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import dotenv from 'dotenv';

const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, '../..');
const deployment = JSON.parse(fs.readFileSync(path.join(directory, 'deployment.json'), 'utf8'));
const local = dotenv.parse(fs.readFileSync(path.join(root, '.env')));
const policy = dotenv.parse(fs.readFileSync(path.join(root, 'infra/google-login.env')));
const runtime = dotenv.parse(fs.readFileSync(path.join(root, 'infra/runtime.env')));
const rag = dotenv.parse(fs.readFileSync(path.join(root, 'infra/rag.env')));
const secretDirectory = path.join(directory, 'secrets');
const secretPath = path.join(secretDirectory, 'runtime.json');
fs.mkdirSync(secretDirectory, { recursive: true, mode: 0o700 });
if (!fs.existsSync(secretPath)) {
  const hex = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');
  fs.writeFileSync(
    secretPath,
    JSON.stringify({
      CREDS_KEY: hex(),
      CREDS_IV: hex(16),
      JWT_SECRET: hex(),
      JWT_REFRESH_SECRET: hex(),
      mongoPassword: hex(),
      redisPassword: hex(),
      postgresPassword: hex(),
    }),
    { mode: 0o600, flag: 'wx' },
  );
}
const secrets = JSON.parse(fs.readFileSync(secretPath, 'utf8'));
if (!local.NEARAI_API_KEY) throw new Error('The shared NEAR AI key is missing.');
const ref = (service, variable) => '${{' + service + '.' + variable + '}}';
const variables = {
  MongoDB: {
    MONGO_INITDB_ROOT_USERNAME: 'nfapp',
    MONGO_INITDB_ROOT_PASSWORD: secrets.mongoPassword,
  },
  Redis: { REDIS_PASSWORD: secrets.redisPassword },
  VectorDB: {
    POSTGRES_DB: 'librechat',
    POSTGRES_USER: 'librechat',
    POSTGRES_PASSWORD: secrets.postgresPassword,
    PGDATA: '/var/lib/postgresql/data/pgdata',
  },
  RAG: {
    ...rag,
    DB_HOST: ref('VectorDB', 'RAILWAY_PRIVATE_DOMAIN'),
    DB_PORT: '5432',
    POSTGRES_DB: 'librechat',
    POSTGRES_USER: 'librechat',
    POSTGRES_PASSWORD: ref('VectorDB', 'POSTGRES_PASSWORD'),
    RAG_OPENAI_API_KEY: ref('LibreChat', 'NEARAI_API_KEY'),
    JWT_SECRET: ref('LibreChat', 'JWT_SECRET'),
    RAG_HOST: '0.0.0.0',
    RAG_PORT: '8000',
  },
  LibreChat: {
    ...runtime,
    ...policy,
    HOST: '0.0.0.0',
    PORT: '3080',
    NODE_ENV: 'production',
    CONFIG_PATH: '/app/librechat.yaml',
    PERSISTENT_DATA_DIR: '/app/data',
    CODE_EXECUTION_ENABLED: 'false',
    DOMAIN_CLIENT: deployment.origin,
    DOMAIN_SERVER: deployment.origin,
    TRUST_PROXY: '1',
    CREDS_KEY: secrets.CREDS_KEY,
    CREDS_IV: secrets.CREDS_IV,
    JWT_SECRET: secrets.JWT_SECRET,
    JWT_REFRESH_SECRET: secrets.JWT_REFRESH_SECRET,
    NEARAI_API_KEY: local.NEARAI_API_KEY,
    IMAGE_GEN_OAI_API_KEY: '${{NEARAI_API_KEY}}',
    GOOGLE_CLIENT_ID: secrets.GOOGLE_CLIENT_ID ?? local.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: secrets.GOOGLE_CLIENT_SECRET ?? local.GOOGLE_CLIENT_SECRET,
    MONGO_URI:
      'mongodb://nfapp:' +
      ref('MongoDB', 'MONGO_INITDB_ROOT_PASSWORD') +
      '@' +
      ref('MongoDB', 'RAILWAY_PRIVATE_DOMAIN') +
      ':27017/LibreChat?authSource=admin',
    REDIS_URI:
      'redis://:' +
      ref('Redis', 'REDIS_PASSWORD') +
      '@' +
      ref('Redis', 'RAILWAY_PRIVATE_DOMAIN') +
      ':6379',
    RAG_API_URL: 'http://' + ref('RAG', 'RAILWAY_PRIVATE_DOMAIN') + ':8000',
    LIBRECHAT_TEMP_CREDENTIALS_PATH: '/app/data/.env.temp',
  },
};
const services = Object.fromEntries(
  Object.entries(variables).map(([name, values]) => [
    deployment.services[name],
    {
      variables: Object.fromEntries(Object.entries(values).map(([key, value]) => [key, { value }])),
    },
  ]),
);
if (!process.argv.includes('--apply')) {
  console.log(
    JSON.stringify(
      {
        projectId: deployment.projectId,
        variableNames: Object.fromEntries(
          Object.entries(variables).map(([name, values]) => [name, Object.keys(values)]),
        ),
      },
      null,
      2,
    ),
  );
  process.exit(0);
}
const result = spawnSync(
  'railway',
  [
    'environment',
    'edit',
    '--project',
    deployment.projectId,
    '--environment',
    deployment.environmentId,
    '--json',
    '--message',
    'Configure isolated LibreChat dependencies and shared company login policy',
  ],
  {
    input: JSON.stringify({ services }),
    encoding: 'utf8',
    env: {
      ...process.env,
      RAILWAY_CALLER: 'skill:use-railway@1.7.0',
      RAILWAY_AGENT_SESSION: 'librechat-deploy-20261031',
    },
  },
);
if (result.status !== 0) {
  console.error('Railway configuration failed; inspect the isolated environment before retrying.');
  process.exit(result.status ?? 1);
}
console.log(
  'Applied shared settings and fresh cloud credentials to the isolated project; secret values suppressed.',
);
