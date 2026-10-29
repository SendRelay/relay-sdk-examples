# Vue App Example

Live delivery tracking in Vue 3 with `@relay-sdk/vue`. A single composable drives the whole page.

## Features

- ✅ Live task status and current stop
- ✅ Live ETA: arrival time, road distance and a countdown that ticks between updates
- ✅ Rider location
- ✅ Event log with timestamps
- ✅ Connection state, with automatic reconnection and token refresh handled by the SDK
- ✅ No API key in the browser: tracking tokens come from your backend

## Prerequisites

- Node.js 18+
- The backend running (see the [node-backend example](../node-backend/)). It issues the tracking tokens.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a task

Create a task through the backend. With an `sk_test_` key, pass `"simulationOutcome": "SUCCESS"` to play a full simulated delivery, with a virtual rider and a live ETA. The [React example's README](../react-app/README.md#2-create-a-task) has a ready-made `curl` command.

### 3. Configure the environment

```bash
cp .env.example .env
```

```env
VITE_BACKEND_URL=http://localhost:3001
VITE_TASK_ID=<your taskId>
```

`VITE_RELAY_REALTIME_URL` is only for running against a local Relay API. Leave it empty to use production.

### 4. Run it

```bash
npm run dev
```

The app runs at http://localhost:5174.

## How it works

### 1. Install the plugin once

`main.ts` installs `createRelay`. `getToken` asks your backend for a short-lived token scoped to the tasks being tracked:

```ts
import { createApp } from 'vue';
import { createRelay } from '@relay-sdk/vue';

createApp(App)
  .use(
    createRelay({
      getToken: async (taskIds) => {
        const res = await fetch(`${BACKEND_URL}/api/session-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskIds }),
        });
        return (await res.json()).token;
      },
    }),
  )
  .mount('#app');
```

### 2. Track a task

```vue
<script setup lang="ts">
import { useEtaCountdown, useTaskTracker } from '@relay-sdk/vue';

const { status, rider, eta, events, connection, error, currentStageIndex } = useTaskTracker(taskId);
const secondsLeft = useEtaCountdown(eta);
</script>
```

Each value is a ref:

| Value | What it holds |
| --- | --- |
| `status` | The task status (`ASSIGNED`, `IN_PROGRESS`, `COMPLETED`, ...) |
| `currentStageIndex` | The stop the rider is heading to |
| `rider` | The rider's id and latest location |
| `eta` | `seconds`, `meters` and `arrivesAt` for the next stop, when the rider app reports a route |
| `events` | Recent events, newest first |
| `connection` | `idle`, `connecting`, `live`, `reconnecting` or `offline` |
| `error` | The last connection or token error |

`useEtaCountdown(eta)` counts down from `arrivesAt` every second, so the time stays current between location updates. The composable subscribes when the component mounts and unsubscribes when it unmounts. `useTaskTracker` also accepts a ref or getter, and follows it when the task id changes.

The SDK reports `rider.location.speed` in metres per second. The example multiplies by 3.6 to show km/h.

## Production build

```bash
npm run build
```

Deploy `dist/` to any static host. In production, set `VITE_BACKEND_URL` to your backend, and read the task id from the route or props instead of `VITE_TASK_ID`.

## Learn more

- [Vue SDK documentation](https://docs.sendrelay.com.ng/sdks/vue-sdk)
- [Tracking guide](https://docs.sendrelay.com.ng/tracking)
- [Test-mode simulations](https://docs.sendrelay.com.ng/simulation)

## License

MIT
