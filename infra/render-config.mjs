import fs from 'node:fs';
import yaml from 'js-yaml';

const source = process.env.CONFIG_PATH || '/app/librechat.yaml';
const target = '/tmp/librechat-runtime.yaml';
const config = yaml.load(fs.readFileSync(source, 'utf8'));
const connectors = yaml.load(
  fs.readFileSync(new URL('./railway/mcp.yaml', import.meta.url), 'utf8'),
);

for (const [provider, servers] of Object.entries(connectors)) {
  const prefix = `MCP_${provider.toUpperCase()}`;
  if (
    process.env[`${prefix}_CLIENT_ID`]?.trim() &&
    process.env[`${prefix}_CLIENT_SECRET`]?.trim()
  ) {
    Object.assign((config.mcpServers ??= {}), servers);
  }
}

if (config.mcpServers?.['google-sheets']) {
  const agents = ((config.endpoints ??= {}).agents ??= {});
  const policy = (agents.toolApproval ??= {});
  policy.enabled = true;
  policy.mode ??= 'bypass';
  policy.ask = [...(policy.ask ?? []), '*_mcp_google-sheets'];
}

if (process.env.CODE_EXECUTION_ENABLED === 'false') {
  if (config.modelSpecs?.list) {
    config.modelSpecs.list = config.modelSpecs.list.map((spec) =>
      spec.executeCode
        ? {
            ...spec,
            name: 'nearai-chat',
            label: 'NEAR AI Chat',
            description: 'Chat with NEAR AI.',
            executeCode: false,
          }
        : spec,
    );
  }
  if (config.endpoints?.agents?.capabilities) {
    config.endpoints.agents.capabilities = config.endpoints.agents.capabilities.filter(
      (capability) => capability !== 'execute_code',
    );
  }
}
fs.writeFileSync(target, yaml.dump(config));
