#!/usr/bin/env node
// Turns the template into a new app: identity strings only, no code generation.
//   npm run app:init -- --slug pocket-pulse --name "Pocket Pulse" [--ko "포켓 펄스"] [--ja "…"] [--zh "…"] [--api-url https://…]
// Sets slug / bundle id / scheme / display name (app.config.ts), localized home-screen names,
// the app name inside the ATT purpose strings, package name, and the production API_URL.
// Refuses to run twice (slug already changed) unless --force.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const root = fileURLToPath(new URL('..', import.meta.url));
const { values: a } = parseArgs({
  options: {
    slug: { type: 'string' },
    name: { type: 'string' },
    ko: { type: 'string' },
    ja: { type: 'string' },
    zh: { type: 'string' },
    'api-url': { type: 'string' },
    force: { type: 'boolean' },
  },
});

const fail = (msg) => {
  console.error(`app:init: ${msg}`);
  process.exit(1);
};
if (!a.slug || !a.name)
  fail(
    'usage: npm run app:init -- --slug <kebab-slug> --name "<Display Name>" [--ko ..] [--ja ..] [--zh ..] [--api-url ..]',
  );
if (!/^[a-z][a-z0-9-]*$/.test(a.slug))
  fail(`slug "${a.slug}" must be lowercase letters, digits and '-', starting with a letter`);
if (a.name.length > 30)
  fail('display name must be 30 characters or fewer (home screen / store limit)');
for (const v of [a.name, a.ko, a.ja, a.zh])
  if (v && /['"`\\\n]/.test(v)) fail(`names cannot contain quotes, backslashes or newlines: ${v}`);
if (a['api-url'] && !/^https:\/\//.test(a['api-url'])) fail('--api-url must be https://');

const edit = (file, fn) => {
  const path = join(root, file);
  const before = readFileSync(path, 'utf8');
  const after = fn(before);
  if (after !== before) writeFileSync(path, after);
  console.log(`${after === before ? 'unchanged' : 'updated  '} ${file}`);
};
const scheme = a.slug.replace(/-/g, '');

// Replacement callbacks, so `$&` / `$1` in a user value is inserted literally.
const config = readFileSync(join(root, 'app.config.ts'), 'utf8');
if (!config.includes("const SLUG = 'my-app';") && !a.force)
  fail('app.config.ts slug is no longer my-app — already initialized (use --force to re-run)');
// The current display name is what the ATT strings mention (MyApp on a fresh template).
const oldName = config.match(/name: '([^']*)',\s+slug: SLUG/)?.[1] ?? 'MyApp';

edit('app.config.ts', (s) =>
  s
    .replace(/const SLUG = '[^']*';/, () => `const SLUG = '${a.slug}';`)
    .replace(/name: '[^']*',(\s+slug: SLUG)/, (_, rest) => `name: '${a.name}',${rest}`)
    .replace(/scheme: '[^']*'/, () => `scheme: '${scheme}'`)
    .replace(/(\n\s+en: )'[^']*'/, (_, k) => `${k}'${a.name}'`)
    .replace(/(\n\s+ko: )'[^']*'/, (_, k) => `${k}'${a.ko ?? a.name}'`)
    .replace(/(\n\s+ja: )'[^']*'/, (_, k) => `${k}'${a.ja ?? a.name}'`)
    .replace(/(\n\s+'zh-Hans': )'[^']*'/, (_, k) => `${k}'${a.zh ?? a.name}'`)
    .replaceAll(oldName, () => a.name),
);
edit('plugins/withLocalizedAttDescription.js', (s) => s.replaceAll(oldName, () => a.name));
edit('package.json', (s) => s.replace(/"name": "[^"]*"/, () => `"name": "${a.slug}"`));
if (a['api-url']) {
  edit('eas.json', (s) => {
    const eas = JSON.parse(s);
    eas.build.production.env.API_URL = a['api-url'];
    return `${JSON.stringify(eas, null, 2)}\n`;
  });
}

console.log(`
Done: ${a.name} (${a.slug}) · bundle id com.seungmanchoi.${scheme} · scheme ${scheme}://
Next (see the init-app skill):
  1. npm install            # refreshes package-lock.json name
  2. Rewrite the ATT purpose strings for this app (app.config.ts + plugins/withLocalizedAttDescription.js)
  3. Firebase: put GoogleService-Info.plist / google-services.json for com.seungmanchoi.${scheme} in ./firebase/
  4. eas init               # writes extra.eas.projectId (skip for fastlane-only apps)
  5. npm run verify && npm run ios`);
