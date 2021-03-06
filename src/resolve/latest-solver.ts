import { satisfies } from 'semver';
import { Dependency } from '../manifest/dependency';
import { Workspace } from '../professional/workspace';
import { Registration } from '../sources/registration';
import unique from '../utils/unique';
import { DependencyGraph } from './dependency-graph';
import Resolver, { Resolution } from './resolver';

export default async function solve(
  workspace: Workspace,
  resolver: Resolver
): Promise<DependencyGraph> {
  const dependencies = workspace.root.dependencies.concat(workspace.root.devDependencies);
  await resolveDependencies(dependencies, resolver);

  const graph = [];
  const errors = [];
  for (const [name, resolution] of resolver) {
    const matching = getMatching(resolution);

    if (!matching) {
      errors.push(resolution);
    } else {
      graph.push(matching);
    }
  }

  if (errors.length) {
    // TODO
    throw new Error('Unable to resolve dependency graph for given manifest');
  }

  return graph;
}

export async function resolveDependencies(
  dependencies: Dependency[],
  resolver: Resolver
): Promise<void> {
  const resolved = await Promise.all(dependencies.map(dependency => resolver.get(dependency)));

  for (const resolution of resolved) {
    const { registered } = resolution;
    const latest = getMatching(resolution) || registered[registered.length - 1];

    await resolveDependencies(latest.dependencies, resolver);
  }
}

export function getMatching(resolution: Resolution): Registration | undefined {
  const range = unique(resolution.range).join(' ');
  const registered = resolution.registered.slice().reverse();

  return !range
    ? registered[0]
    : registered.find(registration => satisfies(registration.version, range));
}
