/**
 * Load backend/.env into process.env (UTF-8, UTF-8 BOM, or UTF-16 LE).
 */
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

function backendRootDir() {
  return path.resolve(__dirname, '..', '..');
}

/** Paths checked in order (later merges do not remove earlier keys unless redefined). */
function envFileCandidates() {
  return [
    path.join(backendRootDir(), '.env'),
    path.join(process.cwd(), '.env'),
  ];
}

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const buf = fs.readFileSync(filePath);
  let text;
  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe) {
    text = buf.slice(2).toString('utf16le');
  } else if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
    text = buf.slice(3).toString('utf8');
  } else {
    text = buf.toString('utf8');
  }
  const parsed = dotenv.parse(text);
  Object.assign(process.env, parsed);
}

function loadBackendEnv() {
  const seen = new Set();
  for (const p of envFileCandidates()) {
    const key = path.resolve(p);
    if (seen.has(key)) continue;
    seen.add(key);
    parseEnvFile(p);
  }
  dotenv.config();

  return process.env.MONGODB_URI?.trim() || '';
}

function explainEnvLoadFailure() {
  const lines = ['Could not set MONGODB_URI. Checked:'];
  const printed = new Set();
  for (const p of envFileCandidates()) {
    const key = path.resolve(p);
    if (printed.has(key)) continue;
    printed.add(key);
    try {
      if (!fs.existsSync(p)) {
        lines.push(`  - ${p} (missing)`);
        continue;
      }
      const st = fs.statSync(p);
      lines.push(`  - ${p} (${st.size} bytes on disk)`);
    } catch (e) {
      lines.push(`  - ${p} (error: ${e.message})`);
    }
  }
  lines.push('');
  lines.push('If the editor shows variables but size is 0, save the file (Ctrl+S).');
  lines.push('Use UTF-8 encoding: status bar → "Save with Encoding" → UTF-8.');
  return lines.join('\n');
}

module.exports = {
  loadBackendEnv,
  envFileCandidates,
  explainEnvLoadFailure,
};
