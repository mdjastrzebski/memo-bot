import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

type WordSetConfig = {
  id: string;
  name: string;
  url: string;
  languageCode: string;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const wordSetConfigPath = path.join(repoRoot, 'public/word-sets/config.json');

async function main() {
  const configs = await loadWordSetConfigs();
  const seenPaths = new Set<string>();

  for (const config of configs) {
    const filePath = getWordSetPath(config.url);
    if (seenPaths.has(filePath)) {
      continue;
    }

    seenPaths.add(filePath);
    await sortWordSetFile(filePath, config.languageCode);
    console.log(`Sorted ${path.relative(repoRoot, filePath)} (${config.languageCode})`);
  }
}

async function loadWordSetConfigs(): Promise<WordSetConfig[]> {
  const raw = await readFile(wordSetConfigPath, 'utf8');
  const parsed: unknown = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error('public/word-sets/config.json must contain an array');
  }

  return parsed.map(parseWordSetConfig);
}

function parseWordSetConfig(entry: unknown): WordSetConfig {
  if (typeof entry !== 'object' || entry === null) {
    throw new Error('Invalid word set config entry');
  }

  const config = entry as Record<string, unknown>;
  if (
    typeof config.id !== 'string' ||
    typeof config.name !== 'string' ||
    typeof config.url !== 'string' ||
    typeof config.languageCode !== 'string'
  ) {
    throw new Error('Invalid word set config entry');
  }

  return {
    id: config.id,
    name: config.name,
    url: config.url,
    languageCode: config.languageCode,
  };
}

function getWordSetPath(urlPath: string): string {
  if (!urlPath.startsWith('/word-sets/')) {
    throw new Error(`Unsupported word set URL: ${urlPath}`);
  }

  return path.join(repoRoot, 'public', urlPath);
}

async function sortWordSetFile(filePath: string, languageCode: string) {
  const content = await readFile(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  const { headerLines, wordLines } = splitWordSetLines(lines);

  const collator = new Intl.Collator(languageCode, {
    sensitivity: 'base',
    numeric: true,
  });

  const sortedWordLines = [...wordLines].sort(collator.compare);
  const nextContent = [...headerLines, ...sortedWordLines].join('\n').concat('\n');

  if (nextContent !== content) {
    await writeFile(filePath, nextContent, 'utf8');
  }
}

function splitWordSetLines(lines: string[]) {
  const headerLines: string[] = [];
  const wordLines: string[] = [];
  let foundWord = false;

  for (const line of lines) {
    if (!foundWord && (line.trim() === '' || line.trimStart().startsWith('#'))) {
      headerLines.push(line);
      continue;
    }

    if (line.trim() === '') {
      continue;
    }

    foundWord = true;
    wordLines.push(line);
  }

  return { headerLines, wordLines };
}

void main();
