# React App Example

Live delivery tracking in React with `@relay-sdk/react`. A single hook drives the whole page.

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

Start the backend, then create a task through it. With an `sk_test_` key, `simulationOutcome: "SUCCESS"` plays a full simulated delivery, with a virtual rider moving and a live ETA, so you can watch the tracker without a real rider.

```bash
curl -X POST http://localhost:3001/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "taskType": "PACKAGE_DELIVERY",
    "simulationOutcome": "SUCCESS",
    "stages": [
      {
        "type": "PICKUP",
        "location": { "address": "12 Marina Road, Lagos", "latitude": 6.452, "longitude": 3.389 },
        "items": [{ "name": "Package", "estimatedValue": 5000000, "estimatedWeight": "STANDARD", "estimatedSize": "BOX" }]
      },
      {
        "type": "DROPOFF",
        "location": { "address": "456 Oak Ave, Lagos", "latitude": 6.4541, "longitude": 3.3947 },
        "items": []
      }
    ]
  }'
```

Copy the returned `taskId`.

### 3. Configure the environment

```bash
cp .env.example .env
```

```env
VITE_BACKEND_URL=http://localhost:3001
VITE_TASK_ID=<the taskId from step 2>
```

`VITE_RELAY_REALTIME_URL` is only for running against a local Relay API. Leave it empty to use production.

### 4. Run it

```bash
npm run dev
```

The app runs at http://localhost:5173.

## How it works

### 1. Provide the client once

`main.tsx` wraps the app in `RelayProvider`. `getToken` asks your backend for a short-lived token scoped to the tasks being tracked:

```tsx
import { RelayProvider } from '@relay-sdk/react';

async function getToken(taskIds: string[]) {
  const res = await fetch(`${BACKEND_URL}/api/session-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ taskIds }),
  });
  return (await res.json()).token;
}

<RelayProvider getToken={getToken}>
  <App />
</RelayProvider>
```

### 2. Track a task

```tsx
import { useEtaCountdown, useTaskTracker } from '@relay-sdk/react';

const { status, rider, eta, events, connection, error, currentStageIndex } = useTaskTracker(taskId);
const secondsLeft = useEtaCountdown(eta);
```

| Value | What it holds |
| --- | --- |
| `status` | The task status (`ASSIGNED`, `IN_PROGRESS`, `COMPLETED`, ...) |
| `currentStageIndex` | The stop the rider is heading to |
| `rider` | The rider's id and latest location |
| `eta` | `seconds`, `meters` and `arrivesAt` for the next stop, when the rider app reports a route |
| `events` | Recent events, newest first |
| `connection` | `idle`, `connecting`, `live`, `reconnecting` or `offline` |
| `error` | The last connection or token error |

`useEtaCountdown(eta)` counts down from `arrivesAt` every second, so the time stays current between location updates. The hook subscribes on mount and unsubscribes on unmount, or when `taskId` changes.

The SDK reports `rider.location.speed` in metres per second. The example multiplies by 3.6 to show km/h.

## Production build

```bash
npm run build
```

Deploy `dist/` to any static host. In production, set `VITE_BACKEND_URL` to your backend, and read the task id from the URL or your own state instead of `VITE_TASK_ID`.

## Learn more

- [React SDK documentation](https://docs.sendrelay.com.ng/sdks/react-sdk)
- [Tracking guide](https://docs.sendrelay.com.ng/tracking)
- [Test-mode simulations](https://docs.sendrelay.com.ng/simulation)

## License

MIT
