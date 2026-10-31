import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { generateKeyPairSync, createPublicKey, randomBytes } from 'node:crypto';

const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, '../..');
const source = JSON.parse(fs.readFileSync(path.join(directory, 'source.json'), 'utf8'));
const upstream = path.join(directory, 'upstream');
const run = (args) => execFileSync('git', args, { cwd: directory, encoding: 'utf8' }).trim();
if (!fs.existsSync(upstream))
  run(['clone', '--depth', '1', '--branch', source.release, source.repository, upstream]);
if (run(['-C', upstream, 'rev-parse', 'HEAD']) !== source.commit)
  throw new Error('Sandbox source revision does not match source.json');
if (run(['-C', upstream, 'status', '--porcelain', '--untracked-files=no']))
  throw new Error('Sandbox upstream source has local changes');

const secrets = path.join(directory, 'secrets');
fs.mkdirSync(secrets, { recursive: true, mode: 0o700 });
const privatePath = path.join(secrets, 'codeapi-private.pem');
if (fs.existsSync(path.join(directory, '.env')) && !fs.existsSync(privatePath)) {
  throw new Error(
    'Existing sandbox secrets have no matching app signing key; restore the key before continuing',
  );
}
if (!fs.existsSync(privatePath)) {
  const { privateKey } = generateKeyPairSync('ed25519');
  fs.writeFileSync(privatePath, privateKey.export({ type: 'pkcs8', format: 'pem' }), {
    mode: 0o600,
  });
}
const privateKey = fs.readFileSync(privatePath, 'utf8');
const publicKey = createPublicKey(privateKey).export({ format: 'jwk' });
publicKey.kid = 'nf-codeapi-local';
publicKey.alg = 'EdDSA';
fs.writeFileSync(path.join(secrets, 'public-jwks.json'), JSON.stringify({ keys: [publicKey] }), {
  mode: 0o644,
});

const envPath = path.join(directory, '.env');
if (!fs.existsSync(envPath)) {
  const token = () => randomBytes(32).toString('hex');
  const manifest = generateKeyPairSync('ed25519');
  const values = {
    CODEAPI_JWT_JWKS_JSON: JSON.stringify({ keys: [publicKey] }),
    CODEAPI_INTERNAL_SERVICE_TOKEN: token(),
    CODEAPI_EGRESS_GRANT_SECRET: token(),
    CODEAPI_EXECUTION_MANIFEST_PRIVATE_KEY: Buffer.from(
      manifest.privateKey.export({ type: 'pkcs8', format: 'der' }),
    ).toString('base64'),
    SANDBOX_EXECUTION_MANIFEST_PUBLIC_KEY: Buffer.from(
      manifest.publicKey.export({ type: 'spki', format: 'der' }),
    ).toString('base64'),
    SANDBOX_REDIS_PASSWORD: token(),
    MINIO_ROOT_USER: 'nf-code-sandbox',
    MINIO_ROOT_PASSWORD: token(),
  };
  fs.writeFileSync(
    envPath,
    Object.entries(values)
      .map(([key, value]) => `${key}='${value}'`)
      .join('\n') + '\n',
    { mode: 0o600 },
  );
}

const appEnvPath = path.join(root, '.env');
let appEnv = fs.readFileSync(appEnvPath, 'utf8');
for (const name of ['CODEAPI_JWT_PRIVATE_KEY', 'CODEAPI_JWT_PRIVATE_JWK_JSON']) {
  if (new RegExp(`^${name}=.+$`, 'm').test(appEnv)) {
    throw new Error(
      `An existing ${name} takes precedence; keep that deployment configuration separate`,
    );
  }
}
const values = {
  LIBRECHAT_CODE_BASEURL: 'http://code-api:3112/v1',
  CODEAPI_AUTH_PROVIDER: 'librechat-jwt',
  CODEAPI_JWT_ENABLED: 'true',
  CODEAPI_JWT_PRIVATE_KEY_BASE64: Buffer.from(privateKey).toString('base64'),
  CODEAPI_JWT_ALGORITHM: 'EdDSA',
  CODEAPI_JWT_KID: 'nf-codeapi-local',
  CODEAPI_JWT_ISSUER: 'librechat',
  CODEAPI_JWT_AUDIENCE: 'codeapi',
  CODEAPI_JWT_SINGLE_TENANT_ID: 'near-foundation-pilot',
};
for (const [key, value] of Object.entries(values)) {
  const expression = new RegExp(`^${key}=.*$`, 'm');
  appEnv = expression.test(appEnv)
    ? appEnv.replace(expression, `${key}=${value}`)
    : `${appEnv.trimEnd()}\n${key}=${value}\n`;
}
fs.writeFileSync(appEnvPath, appEnv, { mode: 0o600 });
fs.chmodSync(appEnvPath, 0o600);
console.log(
  `Prepared ${source.release} (${source.commit}). Sandbox secrets are separate from the app .env.`,
);
