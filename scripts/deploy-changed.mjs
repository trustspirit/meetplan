#!/usr/bin/env node
import { execFileSync, spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const passthrough = [];
let base = process.env.DEPLOY_BASE;
let head = process.env.DEPLOY_HEAD || "HEAD";
let forceAll = process.env.FORCE_DEPLOY_ALL === "true";
let planOnly = false;

for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];
  if (arg === "--base") {
    base = args[++i];
  } else if (arg === "--head") {
    head = args[++i];
  } else if (arg === "--all") {
    forceAll = true;
  } else if (arg === "--plan-only") {
    planOnly = true;
  } else if (arg === "--") {
    continue;
  } else {
    passthrough.push(arg);
  }
}

const sharedBuildInputs = [
  "packages/shared/src/**",
  "packages/shared/package.json",
  "packages/shared/tsconfig.json",
  "packages/shared/tsconfig.esm.json",
  "package.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  "tsconfig.base.json",
];

const deployRules = {
  functions: [
    "functions/src/**",
    "functions/package.json",
    "functions/tsconfig.json",
    "functions/tsconfig.build.json",
    ...sharedBuildInputs,
  ],
  hosting: [
    "apps/web/src/**",
    "apps/web/public/**",
    "apps/web/index.html",
    "apps/web/package.json",
    "apps/web/postcss.config.js",
    "apps/web/tailwind.config.ts",
    "apps/web/tsconfig.json",
    "apps/web/vite.config.ts",
    ...sharedBuildInputs,
  ],
  firestore: [
    "firestore.rules",
    "firestore.indexes.json",
  ],
};

function git(args, options = {}) {
  return execFileSync("git", args, {
    encoding: "utf8",
    stdio: options.stdio || ["ignore", "pipe", "ignore"],
  }).trim();
}

function gitSucceeds(args) {
  try {
    execFileSync("git", args, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function listChangedFiles() {
  if (forceAll) return ["firebase.json"];

  if (base) {
    return diffFiles(base, head);
  }

  const eventBefore = process.env.GITHUB_EVENT_BEFORE;
  const eventHead = process.env.GITHUB_SHA;
  if (eventBefore && eventHead && !/^0+$/.test(eventBefore)) {
    return diffFiles(eventBefore, eventHead, false);
  }

  const localChanges = new Set([
    ...lines(git(["diff", "--name-only", "HEAD"])),
    ...lines(git(["ls-files", "--others", "--exclude-standard"])),
  ]);
  if (localChanges.size > 0) {
    return [...localChanges];
  }

  if (gitSucceeds(["rev-parse", "--verify", "origin/main"])) {
    const mergeBase = git(["merge-base", "origin/main", "HEAD"]);
    return diffFiles(mergeBase, "HEAD", false);
  }

  if (gitSucceeds(["rev-parse", "--verify", "HEAD~1"])) {
    return diffFiles("HEAD~1", "HEAD", false);
  }

  return ["firebase.json"];
}

function diffFiles(from, to, useMergeBase = true) {
  const range = useMergeBase ? `${from}...${to}` : `${from}..${to}`;
  try {
    return lines(git(["diff", "--name-only", range]));
  } catch {
    return lines(git(["diff", "--name-only", `${from}..${to}`]));
  }
}

function lines(value) {
  return value ? value.split("\n").filter(Boolean) : [];
}

function globToRegExp(pattern) {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*/g, ".*")
    .replace(/\*/g, "[^/]*");
  return new RegExp(`^${escaped}$`);
}

function matches(file, pattern) {
  if (pattern.endsWith("/**")) {
    return file.startsWith(pattern.slice(0, -3));
  }
  if (pattern.includes("*")) {
    return globToRegExp(pattern).test(file);
  }
  return file === pattern;
}

function targetsFor(files) {
  const targets = new Set();
  for (const file of files) {
    if (file === "firebase.json") {
      targets.add("functions");
      targets.add("hosting");
      targets.add("firestore");
      continue;
    }
    for (const [target, patterns] of Object.entries(deployRules)) {
      if (patterns.some((pattern) => matches(file, pattern))) {
        targets.add(target);
      }
    }
  }
  return [...targets];
}

function run(command, commandArgs) {
  const result = spawnSync(command, commandArgs, { stdio: "inherit" });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function runWithRetry(command, commandArgs, attempts, delaySeconds) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const result = spawnSync(command, commandArgs, { stdio: "inherit" });
    if (result.status === 0) {
      return;
    }
    if (attempt === attempts) {
      process.exit(result.status ?? 1);
    }

    const delay = attempt * delaySeconds;
    console.log(`Deploy attempt ${attempt} failed, retrying in ${delay}s...`);
    run("sleep", [String(delay)]);
  }
}

const changedFiles = listChangedFiles();
const targets = targetsFor(changedFiles);

console.log("Changed files:");
for (const file of changedFiles) console.log(`- ${file}`);

if (targets.length === 0) {
  console.log("No Firebase deploy targets changed; skipping deploy.");
  process.exit(0);
}

console.log(`Firebase deploy targets: ${targets.join(",")}`);

if (planOnly) {
  process.exit(0);
}

if (targets.includes("functions") || targets.includes("hosting")) {
  run("pnpm", ["--filter", "@meetplan/shared", "build"]);
}
if (targets.includes("hosting")) {
  run("pnpm", ["--filter", "web", "build"]);
}
if (targets.includes("functions")) {
  run("pnpm", ["--filter", "functions", "build"]);
}

const deployAttempts = targets.includes("functions")
  ? Number(process.env.DEPLOY_RETRY_ATTEMPTS || 4)
  : 1;
const deployDelaySeconds = Number(process.env.DEPLOY_RETRY_DELAY_SECONDS || 90);

runWithRetry(
  "firebase",
  ["deploy", "--only", targets.join(","), ...passthrough],
  deployAttempts,
  deployDelaySeconds
);
