#!/usr/bin/env node
import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { RelayClient } from "@relay-sdk/sdk-node";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");
const RUNS_DIR = path.join(PROJECT_ROOT, ".runs");
const STATE_FILE = path.join(RUNS_DIR, "state.json");
const DEFAULT_FIXTURE = path.join(PROJECT_ROOT, "fixtures", "food-delivery.json");

async function exists(filePath) {
  try {
    await access(filePath, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function loadDotEnv() {
  const envPath = path.join(PROJECT_ROOT, ".env");
  if (!(await exists(envPath))) return;

  const content = await readFile(envPath, "utf8");
  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token.startsWith("--")) {
      const key = token.slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith("--")) {
        args[key] = true;
      } else {
        args[key] = next;
        i += 1;
      }
    } else {
      args._.push(token);
    }
  }
  return args;
}

async function ensureRunsDir() {
  await mkdir(RUNS_DIR, { recursive: true });
}

async function readJson(filePath) {
  const content = await readFile(filePath, "utf8");
  return JSON.parse(content);
}

async function writeJson(filePath, data) {
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function readState() {
  if (!(await exists(STATE_FILE))) return {};
  return readJson(STATE_FILE);
}

async function saveState(patch) {
  await ensureRunsDir();
  const current = await readState();
  const next = { ...current, ...patch, updatedAt: new Date().toISOString() };
  await writeJson(STATE_FILE, next);
  return next;
}

async function saveRun(label, data) {
  await ensureRunsDir();
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filePath = path.join(RUNS_DIR, `${stamp}-${label}.json`);
  await writeJson(filePath, data);
  return filePath;
}

function createClient() {
  const apiKey = process.env.RELAY_API_KEY;
  if (!apiKey) {
    throw new Error("Missing RELAY_API_KEY. Add it to .env or your shell env.");
  }

  return new RelayClient({
    apiKey,
    ...(process.env.RELAY_BASE_URL ? { baseUrl: process.env.RELAY_BASE_URL } : {}),
  });
}

async function loadFixture(fixturePath) {
  const resolved = fixturePath
    ? path.resolve(process.cwd(), fixturePath)
    : DEFAULT_FIXTURE;
  return readJson(resolved);
}

function makeIdempotencyKey(prefix = "sdk-e2e") {
  return `${prefix}-${randomUUID()}`;
}

function asQuotePayload(taskPayload) {
  const { taskType, priority, stages } = taskPayload;
  return { taskType, priority, stages };
}

async function cmdDoctor(client) {
  const apiKey = process.env.RELAY_API_KEY || "";
  const masked = `${apiKey.slice(0, 10)}...${apiKey.slice(-4)}`;
  const info = {
    environment: client.environment,
    apiKeyPreview: masked,
    baseUrl: process.env.RELAY_BASE_URL || "https://api.sendrelay.com.ng (SDK default)",
    defaultFixture: DEFAULT_FIXTURE,
    stateFile: STATE_FILE,
  };
  console.log(JSON.stringify(info, null, 2));
}

async function cmdQuote(client, args) {
  const payload = await loadFixture(args.fixture);
  const quotePayload = asQuotePayload(payload);
  const response = await client.tasks.quote(quotePayload);

  const runPath = await saveRun("quote", { request: quotePayload, response });
  await saveState({
    lastFixturePath: args.fixture ? path.resolve(process.cwd(), args.fixture) : DEFAULT_FIXTURE,
    lastQuote: {
      quoteId: response.quoteId,
      expiresAt: response.expiresAt,
      quoteTtlSeconds: response.quoteTtlSeconds,
      createdAt: new Date().toISOString(),
    },
  });

  console.log(JSON.stringify({ quoteId: response.quoteId, expiresAt: response.expiresAt, runPath }, null, 2));
}

async function cmdCreate(client, args, forceQuoteId) {
  const payload = await loadFixture(args.fixture);
  const idempotencyKey = args["idempotency-key"] || makeIdempotencyKey();

  let quoteId = args["quote-id"];
  if (!quoteId && forceQuoteId) {
    const state = await readState();
    quoteId = state?.lastQuote?.quoteId;
    if (!quoteId) {
      throw new Error("No saved quote found. Run `quote` first or pass --quote-id.");
    }
  }

  const createPayload = {
    ...payload,
    ...(args["external-id"] ? { externalId: args["external-id"] } : {}),
    ...(quoteId ? { quoteId } : {}),
  };

  const response = await client.tasks.create(createPayload, { idempotencyKey });
  const runPath = await saveRun("create", {
    request: createPayload,
    idempotencyKey,
    response,
  });

  await saveState({
    lastFixturePath: args.fixture ? path.resolve(process.cwd(), args.fixture) : DEFAULT_FIXTURE,
    lastTask: {
      taskId: response.task.taskId,
      createdAt: new Date().toISOString(),
    },
    lastIdempotencyKey: idempotencyKey,
  });

  console.log(
    JSON.stringify(
      {
        taskId: response.task.taskId,
        status: response.task.status,
        totalFee: response.task.totalFee,
        idempotencyKey,
        runPath,
      },
      null,
      2
    )
  );
}

async function resolveTaskIdArg(args) {
  if (args["task-id"]) return args["task-id"];
  if (args.last) {
    const state = await readState();
    const taskId = state?.lastTask?.taskId;
    if (taskId) return taskId;
  }
  throw new Error("Missing task ID. Pass --task-id <id> or use --last.");
}

async function cmdGet(client, args) {
  const taskId = await resolveTaskIdArg(args);
  const response = await client.tasks.get(taskId);
  const runPath = await saveRun("get", { taskId, response });
  console.log(JSON.stringify({ taskId, runPath, response }, null, 2));
}

async function cmdList(client, args) {
  const request = {
    ...(args.limit ? { limit: Number(args.limit) } : {}),
    ...(args.cursor ? { cursor: args.cursor } : {}),
    ...(args.order ? { order: args.order } : {}),
  };
  const response = await client.tasks.list(request);
  const runPath = await saveRun("list", { request, response });
  console.log(JSON.stringify({ count: response.data.length, hasMore: response.hasMore, runPath, response }, null, 2));
}

async function cmdCancel(client, args) {
  const taskId = await resolveTaskIdArg(args);
  const request = args.reason ? { reason: args.reason } : undefined;
  const response = await client.tasks.cancel(taskId, request);
  const runPath = await saveRun("cancel", { taskId, request, response });
  console.log(JSON.stringify({ taskId, runPath, response }, null, 2));
}

async function cmdWsToken(client, args) {
  const taskId = await resolveTaskIdArg(args);
  const expiresIn = args["expires-in"] ? Number(args["expires-in"]) : undefined;
  const response = await client.auth.createWebSocketToken({
    scope: [`task:${taskId}`],
    ...(expiresIn ? { expiresIn } : {}),
  });
  const runPath = await saveRun("ws-token", { taskId, expiresIn, response });
  console.log(JSON.stringify({ taskId, expiresAt: response.expiresAt, runPath, response }, null, 2));
}

async function cmdFlow(client, args) {
  const flowName = args._[1];
  if (!flowName) {
    throw new Error("Missing flow name. Use: flow quote-create-get | flow full");
  }

  if (flowName !== "quote-create-get" && flowName !== "full") {
    throw new Error(`Unknown flow '${flowName}'. Supported: quote-create-get, full`);
  }

  const flowArgs = {
    fixture: args.fixture,
    "idempotency-key": args["idempotency-key"] || makeIdempotencyKey("sdk-e2e-flow"),
    "external-id": args["external-id"],
  };

  await cmdQuote(client, flowArgs);
  await cmdCreate(client, flowArgs, true);
  await cmdGet(client, { last: true });

  if (flowName === "full") {
    await cmdList(client, { limit: 10, order: "desc" });
  }
}

function printHelp() {
  const help = `
Relay SDK Node E2E CLI

Commands
  doctor
  quote [--fixture <path>]
  create [--fixture <path>] [--quote-id <id>] [--idempotency-key <key>] [--external-id <id>]
  create-from-quote [--fixture <path>] [--idempotency-key <key>] [--external-id <id>]
  get --task-id <id>
  get --last
  list [--limit <n>] [--order asc|desc] [--cursor <cursor>]
  cancel --task-id <id> [--reason <text>]
  cancel --last [--reason <text>]
  ws-token --task-id <id> [--expires-in <seconds>]
  ws-token --last [--expires-in <seconds>]
  flow quote-create-get [--fixture <path>] [--idempotency-key <key>] [--external-id <id>]
  flow full [--fixture <path>] [--idempotency-key <key>] [--external-id <id>]

Notes
  - Uses deployed npm package: @relay-sdk/sdk-node@1.2.0
  - Reads RELAY_API_KEY and optional RELAY_BASE_URL from .env
  - Saves state and API responses under .runs/
`.trim();
  console.log(help);
}

async function main() {
  await loadDotEnv();
  const args = parseArgs(process.argv.slice(2));
  const command = args._[0];

  if (!command || command === "help" || command === "--help") {
    printHelp();
    return;
  }

  const client = createClient();

  switch (command) {
    case "doctor":
      await cmdDoctor(client);
      return;
    case "quote":
      await cmdQuote(client, args);
      return;
    case "create":
      await cmdCreate(client, args, false);
      return;
    case "create-from-quote":
      await cmdCreate(client, args, true);
      return;
    case "get":
      await cmdGet(client, args);
      return;
    case "list":
      await cmdList(client, args);
      return;
    case "cancel":
      await cmdCancel(client, args);
      return;
    case "ws-token":
      await cmdWsToken(client, args);
      return;
    case "flow":
      await cmdFlow(client, args);
      return;
    default:
      throw new Error(`Unknown command '${command}'. Run 'help' for usage.`);
  }
}

main().catch(async (error) => {
  const payload = {
    error: error?.message || "Unknown error",
    stack: error?.stack,
    at: new Date().toISOString(),
  };
  try {
    const runPath = await saveRun("error", payload);
    console.error(JSON.stringify({ ...payload, runPath }, null, 2));
  } catch {
    console.error(JSON.stringify(payload, null, 2));
  }
  process.exit(1);
});
