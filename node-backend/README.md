# Node.js Backend Example

Complete Node.js/Express backend demonstrating the Relay Server SDK (`@relay/sdk-node`).

## Features

- ✅ Create and manage delivery tasks
- ✅ Get task quotes (pricing estimates)
- ✅ Handle webhook events with signature verification
- ✅ List and filter tasks
- ✅ Cancel tasks
- ✅ Full TypeScript support

## Prerequisites

- Node.js 18+
- Relay API key (get from [relay.delivery](https://relay.delivery))

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
RELAY_API_KEY=relay_live_your_api_key_here
RELAY_WEBHOOK_SECRET=whsec_your_webhook_secret_here
PORT=3001
```

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
      }
    },
    {
      "type": "DROPOFF",
      "location": {
        "address": "456 Oak Ave, Lagos",
        "latitude": 6.4541,
        "longitude": 3.3947
      }
    }
  ],
  "items": [
    {
      "name": "Package",
      "weight": "STANDARD",
      "size": "BOX",
      "value": 5000000
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
  "customerName": "John Doe",
  "customerPhone": "+2348012345678",
  "stages": [...],
  "items": [...]
}
```

### Get Task

```bash
GET /api/tasks/:taskId
```

### List Tasks

```bash
GET /api/tasks?status=PENDING&limit=50
```

### Cancel Task

```bash
POST /api/tasks/:taskId/cancel
Content-Type: application/json

{
  "reason": "Customer requested cancellation"
}
```

## Webhook Handling

This example includes webhook signature verification:

```typescript
app.post('/api/webhooks/relay', async (req, res) => {
  const signature = req.headers['relay-signature'] as string;
  const secret = process.env.RELAY_WEBHOOK_SECRET!;

  // Verify signature
  const verification = relay.webhooks.verifySignature(
    JSON.stringify(req.body),
    signature,
    secret
  );

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
import { RelayClient } from '@relay/sdk-node';

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
      contactName: 'Sender',
      contactPhone: '+2348012345678',
    },
    {
      type: 'DROPOFF',
      location: {
        address: '456 Oak Ave, Lagos',
        latitude: 6.4541,
        longitude: 3.3947,
      },
      contactName: 'Receiver',
      contactPhone: '+2348087654321',
    },
  ],
  items: [
    {
      name: 'Package',
      weight: 'STANDARD',
      size: 'BOX',
      value: 5000000, // ₦50,000 in kobo
    },
  ],
  customerName: 'John Doe',
  customerPhone: '+2348012345678',
});

console.log('Task created:', task.taskId);
console.log('Delivery fee: ₦' + task.pricingBreakdown.total / 100);
```

### List All Tasks with Pagination

```typescript
// Automatic pagination with async iterator
for await (const task of relay.tasks.listAll({ status: 'COMPLETED' })) {
  console.log(`Task ${task.taskId}: ${task.status}`);
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
    "stages": [...],
    "items": [...]
  }'

# List tasks
curl http://localhost:3001/api/tasks?status=PENDING
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

- [Relay Server SDK Documentation](https://www.npmjs.com/package/@relay/sdk-node)
- [API Reference](https://docs.relay.delivery/api)
- [Webhook Events](https://docs.relay.delivery/webhooks)

## License

MIT
