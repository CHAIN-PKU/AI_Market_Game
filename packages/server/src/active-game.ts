import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export async function writeActiveGame(repoRoot: string, gameId: string): Promise<string> {
  const dir = resolve(repoRoot, 'runtime');
  await mkdir(dir, { recursive: true });
  const path = resolve(dir, 'active-game.json');
  await writeFile(path, JSON.stringify({ gameId, updatedAt: new Date().toISOString() }, null, 2));
  return path;
}

export async function readActiveGame(repoRoot: string): Promise<string | undefined> {
  try {
    const raw = await readFile(resolve(repoRoot, 'runtime', 'active-game.json'), 'utf8');
    const json = JSON.parse(raw) as { gameId?: string };
    return json.gameId;
  } catch {
    return undefined;
  }
}
