#!/usr/bin/env node
// Stop hook shared by Claude Code (.claude/settings.json) and Codex (.codex/hooks.json).
// Both send { stop_hook_active } on stdin and accept { decision: 'block', reason } on stdout,
// which hands the reason back to the agent so it fixes the failure before finishing.
// Runs `npm run verify` only when the working tree changed since the last green run.
// After a block it re-checks only if the agent changed something, and gives up after
// MAX_BLOCKS blocks in one session so a fix that never lands cannot loop forever.
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const MAX_BLOCKS = 3;
const root = fileURLToPath(new URL('..', import.meta.url));
const cacheDir = join(root, 'node_modules/.cache/verify-hook');
const greenFile = join(cacheDir, 'last-green');
const failFile = join(cacheDir, 'last-fail.json');
const readJson = (file) => {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    return {};
  }
};

let input = {};
try {
  input = JSON.parse(readFileSync(0, 'utf8') || '{}');
} catch {
  // No/invalid stdin (manual run) — treat as a first stop.
}
if (!existsSync(join(root, 'node_modules'))) process.exit(0);

const git = (...args) => execFileSync('git', args, { cwd: root, maxBuffer: 64 * 1024 * 1024 });
const status = git('status', '--porcelain', '-z', '--untracked-files=all').toString();
if (!status) process.exit(0);

// Fingerprint = HEAD + tracked diff + untracked file contents, so an unchanged tree is checked once.
const hash = createHash('sha256')
  .update(git('rev-parse', 'HEAD'))
  .update(status)
  .update(git('diff', 'HEAD'));
for (const entry of status.split('\0').filter((e) => e.startsWith('?? '))) {
  const file = join(root, entry.slice(3));
  if (existsSync(file)) hash.update(readFileSync(file));
}
const fingerprint = hash.digest('hex');
if (existsSync(greenFile) && readFileSync(greenFile, 'utf8') === fingerprint) process.exit(0);

const session = input.session_id ?? '';
const lastFail = readJson(failFile);
const blocks = lastFail.session === session ? lastFail.blocks : 0;
if (input.stop_hook_active && (lastFail.fingerprint === fingerprint || blocks >= MAX_BLOCKS)) {
  // Nothing changed since the last block, or it keeps failing: stop and let the agent report.
  process.exit(0);
}

const run = spawnSync('npm', ['run', '--silent', 'verify'], {
  cwd: root,
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
});
mkdirSync(cacheDir, { recursive: true });
if (run.status === 0) {
  writeFileSync(greenFile, fingerprint);
  process.exit(0);
}
writeFileSync(failFile, JSON.stringify({ session, fingerprint, blocks: blocks + 1 }));

const tail = `${run.stdout}\n${run.stderr}`.trim().split('\n').slice(-40).join('\n');
process.stdout.write(
  JSON.stringify({
    decision: 'block',
    reason: `npm run verify failed (typecheck · lint · test · check:harness). Fix the Hard Threshold violations below, then finish. If you cannot fix them, say so in your report:\n${tail}`,
  }),
);
