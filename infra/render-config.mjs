import fs from 'node:fs';
import yaml from 'js-yaml';

const source = process.env.CONFIG_PATH || '/app/librechat.yaml';
const target = '/tmp/librechat-runtime.yaml';
const config = yaml.load(fs.readFileSync(source, 'utf8'));
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
