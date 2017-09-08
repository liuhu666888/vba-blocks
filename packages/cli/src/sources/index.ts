import { Config } from '../config';
import { Dependency } from '../manifest';
import { isRegistryDependency, isGitDependency } from '../manifest/dependency';
import { Registration } from './registration';
import * as registry from './registry-source';
import * as path from './path-source';
import * as git from './git-source';

export { Registration, registry, path, git };
export { getRegistrationId, getRegistrationSource } from './registration';

export default class SourceManager {
  config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  async update() {
    await registry.update(this.config);
  }

  async resolve(dependency: Dependency): Promise<Registration[]> {
    if (isRegistryDependency(dependency)) {
      return registry.resolve(this.config, dependency);
    } else if (isGitDependency(dependency)) {
      return git.resolve(this.config, dependency);
    } else {
      return path.resolve(this.config, dependency);
    }
  }

  async fetch(registration: Registration): Promise<string> {
    const [type] = registration.source.split('+', 1);

    if (type === 'registry') {
      return registry.fetch(this.config, registration);
    } else if (type === 'git') {
      return git.fetch(this.config, registration);
    } else {
      return path.fetch(this.config, registration);
    }
  }
}