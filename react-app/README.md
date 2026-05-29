# React App Example

Real-time task tracking app using the Relay Browser SDK (`@relay-sdk/sdk-browser`).

## Features

- ✅ Real-time WebSocket connection
- ✅ Live task status updates
- ✅ Rider location tracking
- ✅ Event log with timestamps
- ✅ Automatic reconnection
- ✅ Token auto-refresh
- ✅ Beautiful dark mode UI

## Prerequisites

- Node.js 18+
- Running backend (see [node-backend example](../node-backend/))

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Configure:

```env
VITE_BACKEND_URL=http://localhost:3001
VITE_TASK_ID=task-your-task-id
```

**Note:** You need to create a task first using the backend, then use that task ID here.

### 3. Run Development Server

```bash
npm run dev
```

App runs at http://localhost:5173

## Usage

### 1. Start the Backend

```bash
cd ../node-backend
npm run dev
```

### 2. Create a Task

```bash
curl -X POST http://localhost:3001/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "taskType": "PACKAGE_DELIVERY",
    "stages": [
      {
        "type": "PICKUP",
        "location": {
          "address": "123 Main St, Lagos",
          "latitude": 6.5244,
          "longitude": 3.3792
        },
        "instructions": "Call sender on arrival",
        "items": [
          {
            "name": "Package",
            "estimatedValue": 5000000,
            "estimatedWeight": "STANDARD",
            "estimatedSize": "BOX"
          }
        ]
      },
      {
        "type": "DROPOFF",
        "location": {
          "address": "456 Oak Ave, Lagos",
          "latitude": 6.4541,
          "longitude": 3.3947
        },
        "instructions": "Drop with security at gate",
        "items": []
      }
    ]
  }'
```

Copy the returned `taskId`.

### 3. Update Environment

Add the task ID to `.env`:

```env
VITE_TASK_ID=task-abc123
```

### 4. Run React App

```bash
npm run dev
```

## How It Works

### 1. Fetch Session Token

```typescript
const res = await fetch(`${BACKEND_URL}/api/session-token`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ taskId: TASK_ID }),
});

const { token } = await res.json();
```

### 2. Initialize Relay Client

```typescript
const client = new RelayRealtimeClient({
  getToken: async (taskIds) => {
    const res = await fetch(`${BACKEND_URL}/api/session-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // this backend endpoint accepts a single taskId
      body: JSON.stringify({ taskId: taskIds[0] }),
    });
    return (await res.json()).token;
  },
});
```

### 3. Subscribe to Events

```typescript
client.on('TASK_ASSIGNED', (event) => {
  setTaskStatus('ASSIGNED');
  setRiderId(event.riderId);
});

client.on('RIDER_LOCATION_UPDATE', (event) => {
  setRiderLocation(event.location);
});
```

### 4. Subscribe to Task

```typescript
await client.listen(TASK_ID);
```

## Event Types

The app handles all Relay event types:

- `CONNECTION_OPEN` - WebSocket connected
- `CONNECTION_CLOSE` - WebSocket disconnected
- `CONNECTION_ERROR` - Connection error
- `CONNECTION_RECONNECTING` - Reconnecting
- `TOKEN_EXPIRING` - Token about to expire (auto-refreshes)
- `TASK_ASSIGNED` - Task assigned to rider
- `TASK_IN_PROGRESS` - Rider started task
- `TASK_COMPLETED` - Task completed
- `RIDER_LOCATION_UPDATE` - Rider GPS location updated

## UI Components

### Task Information Panel
- Task ID
- Current status (color-coded)
- Rider ID (when assigned)

### Rider Location Panel
- Real-time GPS coordinates
- Speed (km/h)

### Event Log
- Last 10 events with timestamps
- Full event payload (JSON)

## Production Build

```bash
npm run build
```

Deploy the `dist/` folder to:
- Vercel
- Netlify
- AWS S3 + CloudFront
- Any static hosting

## Environment Variables (Production)

Create `.env.production`:

```env
VITE_BACKEND_URL=https://your-backend.com
VITE_TASK_ID=task-id-from-url-param
```

## Learn More

- [Relay Browser SDK Documentation](https://www.npmjs.com/package/@relay-sdk/sdk-browser)
- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)

## License

MIT
