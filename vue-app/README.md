# Vue App Example

Real-time task tracking app using Vue 3 Composition API and the Relay Browser SDK.

## Features

- ✅ Vue 3 Composition API with TypeScript
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

### 3. Run Development Server

```bash
npm run dev
```

App runs at http://localhost:5174

## Usage

The app demonstrates the Relay Browser SDK using Vue 3's Composition API:

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { RelayRealtimeClient } from '@relay/sdk-browser';

const relay = ref<RelayRealtimeClient | null>(null);
const taskStatus = ref('PENDING');

onMounted(async () => {
  // Fetch token from backend
  const res = await fetch('http://localhost:3001/api/session-token', {
    method: 'POST',
    body: JSON.stringify({ taskId: 'task-123' }),
  });

  const { token } = await res.json();

  // Initialize Relay client
  const client = new RelayRealtimeClient({ token, autoConnect: true });

  // Listen for events
  client.on('TASK_ASSIGNED', (event) => {
    taskStatus.value = 'ASSIGNED';
  });

  // Subscribe
  await client.subscribe('task', 'task-123');
  relay.value = client;
});
</script>
```

## Key Features

### Composition API

Uses Vue 3's Composition API for clean, type-safe state management:

```typescript
const connectionState = ref('disconnected');
const taskStatus = ref('PENDING');
const riderId = ref<string | null>(null);
const riderLocation = ref<Location | null>(null);
```

### Computed Properties

Dynamic styling based on state:

```typescript
const connectionColor = computed(() => {
  const colors: Record<string, string> = {
    connected: '#10b981',
    disconnected: '#ef4444',
  };
  return colors[connectionState.value] || '#6b7280';
});
```

### Lifecycle Management

Proper setup and cleanup:

```typescript
onMounted(() => {
  initializeRelay();
});

onUnmounted(() => {
  relay.value?.disconnect();
});
```

## Event Handling

The app handles all Relay event types:

- `CONNECTION_OPEN` - WebSocket connected
- `CONNECTION_CLOSE` - WebSocket disconnected
- `TASK_ASSIGNED` - Task assigned to rider
- `TASK_IN_PROGRESS` - Rider started task
- `TASK_COMPLETED` - Task completed
- `RIDER_LOCATION_UPDATE` - Rider GPS updated
- `TOKEN_EXPIRING` - Token about to expire

## Production Build

```bash
npm run build
```

Deploy the `dist/` folder to any static hosting:
- Vercel
- Netlify
- AWS S3 + CloudFront

## Environment Variables (Production)

```env
VITE_BACKEND_URL=https://your-backend.com
```

For dynamic task IDs, modify the app to get the task ID from the URL or props.

## Learn More

- [Relay Browser SDK Documentation](https://www.npmjs.com/package/@relay/sdk-browser)
- [Vue 3 Documentation](https://vuejs.org)
- [Vite Documentation](https://vitejs.dev)

## License

MIT
