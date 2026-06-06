const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const args = process.argv.slice(2);

let index = 0;
if (args[index] === 'run') {
  index++;
}

let filePath = null;
let testName = null;

for (; index < args.length; index++) {
  const arg = args[index];
  if (arg === '-t' || arg === '--testNamePattern') {
    testName = args[index + 1];
    index++;
    continue;
  }
  if (!arg.startsWith('-') && /\.(spec|test)\.[cm]?[jt]sx?$/.test(arg)) {
    filePath = path.resolve(arg);
  }
}

if (!filePath) {
  console.error('test-runner: could not find a test file in args:', args.join(' '));
  process.exit(1);
}

function findBin(cwd, name) {
  for (const candidate of [
    path.join(cwd, 'node_modules', '.bin', name),
    path.join(repoRoot, 'node_modules', '.bin', name),
  ]) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return name;
}

function run(command, commandArgs, cwd) {
  const result = spawnSync(command, commandArgs, { stdio: 'inherit', cwd });
  process.exit(result.status ?? 1);
}

const frontendRoot = path.join(repoRoot, 'frontend');
const engineRoot = path.join(repoRoot, 'engine');

if (filePath.startsWith(`${frontendRoot}${path.sep}`)) {
  const include = path.relative(frontendRoot, filePath);
  const ngArgs = ['test', '--watch=false', `--include=${include}`];
  if (testName) {
    ngArgs.push(`--filter=${testName}`);
  }
  run(findBin(frontendRoot, 'ng'), ngArgs, frontendRoot);
}

if (filePath.startsWith(`${engineRoot}${path.sep}`)) {
  const vitestArgs = ['run', path.relative(engineRoot, filePath)];
  if (testName) {
    vitestArgs.push('-t', testName);
  }
  run(findBin(engineRoot, 'vitest'), vitestArgs, engineRoot);
}

console.error(`test-runner: unsupported test file location: ${filePath}`);
process.exit(1);
