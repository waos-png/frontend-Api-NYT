import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, '..', 'public');
const configPath = resolve(publicDir, 'app-config.js');
const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:8080/books';

mkdirSync(publicDir, { recursive: true });

writeFileSync(
  configPath,
  `window.__APP_CONFIG__ = ${JSON.stringify({ apiBaseUrl }, null, 2)};\n`,
  'utf8'
);

console.log(`Generated app-config.js with API base URL: ${apiBaseUrl}`);
