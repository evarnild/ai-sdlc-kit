#!/usr/bin/env node
// Creates a new project with the core AI-native SDLC kit.
//
//   node scaffold.mjs <name> [--description "..."] [--stack "..."] [--owner "..."]
//                     [--parent <dir>] [--no-codex] [--no-commit] [--dry-run]
//
// Copies ./template into <parent>/<name> (parent defaults to the current
// directory), fills the {{…}} placeholders, renames __NAME__ files, runs
// `git init -b main`, runs the kit's tests (npm run verify), and makes one
// scaffold commit. Refuses to touch a directory that already exists.
import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, existsSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const TEMPLATE = join(HERE, 'template');
const USAGE =
  'usage: node scaffold.mjs <name> [--description "..."] [--stack "..."] [--owner "..."] [--parent <dir>] [--no-codex] [--no-commit] [--dry-run]';

function parseArgs(argv) {
  const opts = { name: null, description: null, stack: null, owner: null, parent: process.cwd(), codex: true, commit: true, dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const value = () => {
      const v = argv[++i];
      if (v === undefined || v.startsWith('--')) fail(`${a} needs a value`);
      return v;
    };
    if (a === '--description') opts.description = value();
    else if (a === '--stack') opts.stack = value();
    else if (a === '--owner') opts.owner = value();
    else if (a === '--parent') opts.parent = value();
    else if (a === '--no-codex') opts.codex = false;
    else if (a === '--no-commit') opts.commit = false;
    else if (a === '--dry-run') opts.dryRun = true;
    else if (a === '--help' || a === '-h') {
      console.log(USAGE);
      process.exit(0);
    } else if (a.startsWith('--')) fail(`unknown option ${a}`);
    else if (opts.name === null) opts.name = a;
    else fail(`unexpected argument ${a}`);
  }
  if (!opts.name) fail(USAGE);
  if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(opts.name)) fail(`name "${opts.name}" must be kebab-case (e.g. support-agent)`);
  return opts;
}

function fail(msg) {
  console.error(`scaffold: ${msg}`);
  process.exit(1);
}

function walk(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

/** The owner named in the grid and the skills' metadata: --owner, else git's user.name. */
function gitUserName() {
  try {
    return execFileSync('git', ['config', 'user.name'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}

const opts = parseArgs(process.argv.slice(2));
const target = resolve(opts.parent, opts.name);
if (existsSync(target)) fail(`${target} already exists; pick another name or remove it yourself`);
if (!existsSync(opts.parent)) fail(`parent directory ${opts.parent} does not exist`);

const today = new Date();
const date = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, '0'), String(today.getDate()).padStart(2, '0')].join('-');
const tokens = {
  '{{NAME}}': opts.name,
  '{{NAME_SNAKE}}': opts.name.replace(/-/g, '_'),
  '{{OWNER}}': opts.owner ?? (gitUserName() || 'the owner'),
  '{{DATE}}': date,
  '{{PATH}}': target,
  '{{DESCRIPTION}}': opts.description ?? 'a new project; its purpose is written down by §1.',
  '{{STACK_NOTE}}': opts.stack ? `intended stack ${opts.stack}, confirmed by §1` : 'undecided',
  '{{STACK_S1}}': opts.stack ? `confirm the ${opts.stack} stack` : 'choose the stack',
};

if (opts.dryRun) {
  console.log(`would create ${target}`);
  for (const [k, v] of Object.entries(tokens)) console.log(`  ${k} = ${v}`);
  process.exit(0);
}

cpSync(TEMPLATE, target, { recursive: true });
try {
  if (!opts.codex) {
    rmSync(join(target, '.codex'), { recursive: true, force: true });
    rmSync(join(target, 'AGENTS.md'), { force: true });
  }
  for (const file of walk(target)) {
    let text = readFileSync(file, 'utf8');
    for (const [k, v] of Object.entries(tokens)) text = text.split(k).join(v);
    writeFileSync(file, text);
    if (file.includes('__NAME__')) renameSync(file, file.split('__NAME__').join(opts.name));
  }
  const left = walk(target).filter((f) => /\{\{[A-Z_]+\}\}/.test(readFileSync(f, 'utf8')));
  if (left.length) throw new Error(`unfilled placeholders in ${left.join(', ')}`);
} catch (e) {
  rmSync(target, { recursive: true, force: true });
  fail(`${e.message} (nothing left behind)`);
}

// stderr ignored: with core.autocrlf=true, git add warns once per file about line endings.
const git = (...a) => execFileSync('git', a, { cwd: target, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
git('init', '-q', '-b', 'main');

// One command string, no argument array: npm is a .cmd shim on Windows and needs a shell.
const verify = spawnSync('npm run -s verify', { cwd: target, encoding: 'utf8', shell: true });
const summary = (verify.stdout + verify.stderr).split('\n').filter((l) => /^ℹ (tests|pass|fail)/.test(l)).join(' · ');
if (verify.status !== 0) {
  console.error(verify.stdout + verify.stderr);
  fail(`npm run verify failed in ${target}; the repo is left in place, uncommitted, for you to inspect`);
}

let commit = '(not committed: --no-commit)';
if (opts.commit) {
  git('add', '-A');
  try {
    git(
      'commit', '-q', '-m',
      'Scaffold: core AI-native SDLC kit\n\n' +
        'intents/ with templates and types, REVIEW-POLICY.md, sdlc.md, the /intent,\n' +
        '/review and /grid skills, implementer and reviewer agents, check:intent and\n' +
        'sdlc:scan. Stack-agnostic until §1; the kit needs only Node.',
    );
    commit = git('log', '--oneline', '-1');
  } catch {
    commit = '(commit failed: set git user.name and user.email, then commit the staged files)';
  }
}

console.log(`created ${target}`);
console.log(`verify: ${summary || 'green'}`);
console.log(`commit: ${commit}`);
console.log(`codex agents: ${opts.codex ? 'yes' : 'no'}`);
console.log('next: open Claude Code in that folder and run /intent --feature for §1');
