# Relay SDK Node E2E CLI

Dedicated end-to-end test harness for the deployed Node SDK package:

- Uses npm package: `@relay-sdk/sdk-node@1.2.0`
- Calls API methods one-by-one or as grouped flows
- Persists state and raw responses for replay/debug

## 1) Setup

```bash
cd /Users/colman/arena/relay/packages/examples/sdk-node-e2e-cli
cp .env.example .env
# edit .env and set RELAY_API_KEY
pnpm install
```

## 2) Quick checks

```bash
pnpm run doctor
```

## 3) Step-by-step SDK calls

```bash
# 1. quote
pnpm run quote

# 2. create task using last quoteId (quote lock)
pnpm run create:from-quote

# 3. get last task
pnpm run get:last

# 4. list tasks
pnpm run list

# 5. cancel last task (optional)
pnpm run cancel:last
```

## 4) Grouped flows

```bash
# quote -> create(with quoteId) -> get
pnpm run flow:quote-create-get

# quote -> create(with quoteId) -> get -> list
pnpm run flow:full
```

## 5) Useful command options

```bash
# custom fixture
pnpm run cli -- quote --fixture ./fixtures/food-delivery.json

# explicit idempotency key
pnpm run cli -- create-from-quote --idempotency-key order-123-delivery

# explicit task id
pnpm run cli -- get --task-id <taskId>

# websocket token for task tracking
pnpm run cli -- ws-token --last --expires-in 1800
```

## 6) Artifacts

- `.runs/state.json`: last quote/task/idempotency references
- `.runs/*.json`: raw request/response snapshots per command

This makes it easy to inspect full request/response history across the E2E flow.
