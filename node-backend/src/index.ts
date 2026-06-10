/**
 * Relay Node.js Backend Example
 *
 * Demonstrates how to use @relay/sdk-node to:
 * - Create and manage delivery tasks
 * - Handle webhooks
 * - Generate session tokens for browser clients
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { RelayClient } from '@relay/sdk-node';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Relay SDK
const relay = new RelayClient({
	apiKey: process.env.RELAY_API_KEY!,
});

/**
 * Health check
 */
app.get('/health', (req, res) => {
	res.json({
		status: 'ok',
		environment: relay.environment,
		timestamp: new Date().toISOString(),
	});
});

/**
 * Get task quote (pricing estimate)
 */
app.post('/api/tasks/quote', async (req, res) => {
	try {
		const quote = await relay.tasks.quote({
			taskType: req.body.taskType || 'PACKAGE_DELIVERY',
			stages: req.body.stages,
			items: req.body.items || [],
			priority: req.body.priority || 'STANDARD',
		});

		res.json(quote);
	} catch (error: any) {
		console.error('Quote error:', error);
		res.status(error.statusCode || 500).json({
			error: error.message,
		});
	}
});

/**
 * Create delivery task
 */
app.post('/api/tasks', async (req, res) => {
	try {
		const task = await relay.tasks.create(
			{
				taskType: req.body.taskType || 'PACKAGE_DELIVERY',
				stages: req.body.stages,
				items: req.body.items || [],
				priority: req.body.priority || 'STANDARD',
				customerName: req.body.customerName,
				customerPhone: req.body.customerPhone,
				notes: req.body.notes,
			},
			{
				idempotencyKey: req.body.idempotencyKey,
			}
		);

		res.json(task);
	} catch (error: any) {
		console.error('Create task error:', error);
		res.status(error.statusCode || 500).json({
			error: error.message,
		});
	}
});

/**
 * Get task details
 */
app.get('/api/tasks/:taskId', async (req, res) => {
	try {
		const task = await relay.tasks.get(req.params.taskId);
		res.json(task);
	} catch (error: any) {
		res.status(error.statusCode || 500).json({
			error: error.message,
		});
	}
});

/**
 * List tasks
 */
app.get('/api/tasks', async (req, res) => {
	try {
		const result = await relay.tasks.list({
			status: req.query.status as any,
			limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
			cursor: req.query.cursor as string,
		});

		res.json(result);
	} catch (error: any) {
		res.status(error.statusCode || 500).json({
			error: error.message,
		});
	}
});

/**
 * Cancel task
 */
app.post('/api/tasks/:taskId/cancel', async (req, res) => {
	try {
		const task = await relay.tasks.cancel(req.params.taskId, req.body.reason);
		res.json(task);
	} catch (error: any) {
		res.status(error.statusCode || 500).json({
			error: error.message,
		});
	}
});

/**
 * Webhook endpoint
 *
 * Receives webhook events from Relay
 */
app.post('/api/webhooks/relay', async (req, res) => {
	try {
		const signature = req.headers['relay-signature'] as string;
		const secret = process.env.RELAY_WEBHOOK_SECRET!;

		// Verify webhook signature
		const verification = relay.webhooks.verifySignature(JSON.stringify(req.body), signature, secret);

		if (!verification.valid) {
			console.error('Invalid webhook signature');
			return res.status(401).json({ error: 'Invalid signature' });
		}

		// Handle webhook event
		const event = req.body;
		console.log('Received webhook:', event.type);

		switch (event.type) {
			case 'task.created':
				console.log('Task created:', event.data.taskId);
				break;

			case 'task.assigned':
				console.log('Task assigned to rider:', event.data.riderId);
				break;

			case 'task.completed':
				console.log('Task completed:', event.data.taskId);
				break;

			case 'task.failed':
				console.log('Task failed:', event.data.reason);
				break;

			case 'payment.released':
				console.log('Payment released:', event.data.amount / 100); // Convert kobo to naira
				break;

			default:
				console.log('Unknown event type:', event.type);
		}

		res.json({ received: true });
	} catch (error: any) {
		console.error('Webhook error:', error);
		res.status(500).json({ error: error.message });
	}
});

// Start server
app.listen(PORT, () => {
	console.log(`🚀 Relay Node.js Example running on http://localhost:${PORT}`);
	console.log(`   Environment: ${relay.environment}`);
	console.log('');
	console.log('Example requests:');
	console.log(`  Health:      GET  http://localhost:${PORT}/health`);
	console.log(`  Quote:       POST http://localhost:${PORT}/api/tasks/quote`);
	console.log(`  Create Task: POST http://localhost:${PORT}/api/tasks`);
	console.log(`  List Tasks:  GET  http://localhost:${PORT}/api/tasks`);
});
