# Node.js Backend Example

Complete Node.js/Express backend demonstrating the Relay Server SDK (`@relay-sdk/sdk-node`).

## Features

- ✅ Create and manage delivery tasks
- ✅ Get task quotes (pricing estimates)
- ✅ Handle webhook events with signature verification
- ✅ List and paginate tasks
- ✅ Mint scoped WebSocket tokens for browser clients
- ✅ Cancel tasks
- ✅ Full TypeScript support

## Prerequisites

- Node.js 18+
- A Relay API key from the [dashboard](https://dashboard.sendrelay.com.ng). Start with an `sk_test_` key: test tasks play out as simulated deliveries and never move money.

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

Add your Relay API key:

```env
RELAY_API_KEY=sk_test_your_api_key_here
RELAY_WEBHOOK_SECRET=whsec_your_webhook_secret_here
PORT=3001
```

`RELAY_BASE_URL` is only for running against a local Relay API (for example `http://127.0.0.1:8790`). Leave it empty to use production.

### 3. Run Development Server

```bash
npm run dev
```

Server runs at http://localhost:3001

## API Endpoints

### Health Check

```bash
GET /health
```

Response:
```json
{
  "status": "ok",
  "environment": "live",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Get Quote

```bash
POST /api/tasks/quote
Content-Type: application/json

{
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
}
```

### Create Task

```bash
POST /api/tasks
Content-Type: application/json

{
  "taskType": "PACKAGE_DELIVERY",
  "priority": "STANDARD",
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
}
```

For `PASSENGER_RIDE` tasks, use `stages[].passengers` (and `items: []`) instead of cargo `items`.

With an `sk_test_` key, add `"simulationOutcome": "SUCCESS"` to watch a full simulated delivery, with a virtual rider moving and a live ETA, in the [React](../react-app/) or [Vue](../vue-app/) example. Other outcomes (`NO_RIDERS`, `CANCEL_AFTER_ACCEPT`, ...) are listed in the [simulation docs](https://docs.sendrelay.com.ng/simulation).

### Get Task

```bash
GET /api/tasks/:taskId
```

### List Tasks

```bash
GET /api/tasks?limit=30&order=desc
```

### Cancel Task

```bash
POST /api/tasks/:taskId/cancel
Content-Type: application/json

{
  "reason": "Customer requested cancellation"
}
```

### Create Browser Session Token

```bash
POST /api/session-token
Content-Type: application/json

{
  "taskIds": ["task-123"]
}
```

Authenticate this endpoint and verify task ownership before using it in production.

## Webhook Handling

This example verifies webhook signatures. Verify the raw request body exactly as it arrived: re-serialising the parsed JSON can change it and break the signature.

```typescript
app.post('/api/webhooks/relay', async (req, res) => {
  const signature = req.headers['x-relay-signature'] as string;
  const secret = process.env.RELAY_WEBHOOK_SECRET!;
  const rawBody = req.rawBody.toString('utf8'); // kept by the express.json() verify hook

  const verification = relay.webhooks.verifySignature(rawBody, signature, secret);

  if (!verification.valid) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Handle event
  const event = req.body;
  console.log('Event:', event.type, event.data);

  res.json({ received: true });
});
```

## Usage Examples

### Create a Delivery Task

```typescript
import { RelayClient } from '@relay-sdk/sdk-node';

const relay = new RelayClient({
  apiKey: process.env.RELAY_API_KEY!,
});

const task = await relay.tasks.create({
  taskType: 'PACKAGE_DELIVERY',
  stages: [
    {
      type: 'PICKUP',
      location: {
        address: '123 Main St, Lagos',
        latitude: 6.5244,
        longitude: 3.3792,
      },
      instructions: 'Call sender on arrival',
      items: [
        {
          name: 'Package',
          estimatedValue: 5000000, // ₦50,000 in kobo
          estimatedWeight: 'STANDARD',
          estimatedSize: 'BOX',
        },
      ],
    },
    {
      type: 'DROPOFF',
      location: {
        address: '456 Oak Ave, Lagos',
        latitude: 6.4541,
        longitude: 3.3947,
      },
      instructions: 'Drop with security at gate',
      items: [],
    },
  ],
});

console.log('Task created:', task.task.taskId);
console.log('Delivery fee: ₦' + task.pricing.total / 100);
```

### List All Tasks with Pagination

```typescript
// Automatic pagination with async iterator
for await (const task of relay.tasks.listAll({ limit: 20 })) {
  console.log(`Task ${task.id}: ${task.status}`);
}
```

## Testing

Test the API with curl:

```bash
# Health check
curl http://localhost:3001/health

# Create task
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

# List tasks
curl http://localhost:3001/api/tasks
```

## Production Deployment

### Build for Production

```bash
npm run build
npm start
```

### Environment Variables

Ensure these are set in production:

- `RELAY_API_KEY` - Your production API key
- `RELAY_WEBHOOK_SECRET` - Your webhook signing secret
- `PORT` - Server port (default: 3001)

### Deploy To

- **Heroku**: `git push heroku main`
- **Railway**: Connect GitHub repo
- **AWS**: Use Elastic Beanstalk or ECS
- **DigitalOcean**: App Platform

## Learn More

- [Node SDK documentation](https://docs.sendrelay.com.ng/sdks/node-sdk)
- [API Reference](https://docs.sendrelay.com.ng/api-reference)
- [Webhook Events](https://docs.sendrelay.com.ng/webhooks)

## License

MIT

### Restrict live deliveries to your fleets

The quote and create endpoints forward `preferences` to Relay. Include the same
preferences in both requests:

```json
{
  "preferences": {
    "allowedOrganisations": ["your-fleet-organization-id"],
    "blockedOrganisations": ["excluded-fleet-organization-id"],
    "allowIndependentRiders": false
  }
}
```

Use the organisation profile's `organizationId`, not its wallet account ID.
Blocked memberships take precedence, and empty lists impose no list restriction.
With `allowIndependentRiders: false`, only current fleet members qualify. These
preferences also constrain available riders and manual offers, and membership is
checked again at assignment. Test-mode simulations do not model fleet membership.
