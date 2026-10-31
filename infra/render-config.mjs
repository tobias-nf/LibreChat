import fs from 'node:fs';
import yaml from 'js-yaml';

const source = process.env.CONFIG_PATH || '/app/librechat.yaml';
const target = '/tmp/librechat-runtime.yaml';
const config = yaml.load(fs.readFileSync(source, 'utf8'));
if (process.env.CODE_EXECUTION_ENABLED === 'false') {
  if (config.modelSpecs?.list) {
    config.modelSpecs.list = config.modelSpecs.list.filter((spec) => !spec.executeCode);
    if (!config.modelSpecs.list.length) delete config.modelSpecs;
  }
  if (config.endpoints?.agents?.capabilities) {
    config.endpoints.agents.capabilities = config.endpoints.agents.capabilities.filter(
      (capability) => capability !== 'execute_code',
    );
  }
}
fs.writeFileSync(target, yaml.dump(config));
