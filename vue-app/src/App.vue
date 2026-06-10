<template>
	<div class="app">
		<header class="header">
			<h1>🚚 Relay Task Tracker</h1>
			<div class="status-bar">
				<div class="status-item">
					<span class="status-label">Connection:</span>
					<span class="status-value" :style="{ color: connectionColor }">
						{{ connectionState }}
					</span>
				</div>
				<div class="status-item">
					<span class="status-label">Task Status:</span>
					<span class="status-value" :style="{ color: statusColor }">
						{{ taskStatus }}
					</span>
				</div>
			</div>
		</header>

		<div v-if="error" class="error-banner">
			<strong>Error:</strong> {{ error }}
		</div>

		<div class="content">
			<div class="panel">
				<h2>Task Information</h2>
				<div class="info-grid">
					<div class="info-item">
						<span class="info-label">Task ID:</span>
						<span class="info-value">{{ TASK_ID }}</span>
					</div>
					<div class="info-item">
						<span class="info-label">Status:</span>
						<span class="info-value" :style="{ color: statusColor }">
							{{ taskStatus }}
						</span>
					</div>
					<div v-if="riderId" class="info-item">
						<span class="info-label">Rider ID:</span>
						<span class="info-value">{{ riderId }}</span>
					</div>
					<div v-if="eta" class="info-item">
						<span class="info-label">ETA:</span>
						<span class="info-value">{{ eta }} minutes</span>
					</div>
				</div>
			</div>

			<div v-if="riderLocation" class="panel">
				<h2>Rider Location</h2>
				<div class="info-grid">
					<div class="info-item">
						<span class="info-label">Latitude:</span>
						<span class="info-value">{{ riderLocation.latitude.toFixed(6) }}</span>
					</div>
					<div class="info-item">
						<span class="info-label">Longitude:</span>
						<span class="info-value">{{ riderLocation.longitude.toFixed(6) }}</span>
					</div>
					<div v-if="riderLocation.speed" class="info-item">
						<span class="info-label">Speed:</span>
						<span class="info-value">{{ riderLocation.speed.toFixed(1) }} km/h</span>
					</div>
				</div>
			</div>

			<div class="panel">
				<h2>Event Log</h2>
				<div class="event-log">
					<div v-if="events.length === 0" class="empty-state">
						No events yet. Waiting for updates...
					</div>
					<div v-for="event in events" :key="event.id" class="event-item">
						<div class="event-header">
							<span class="event-time">{{ event.time }}</span>
							<span class="event-type">{{ event.type }}</span>
						</div>
						<pre class="event-data">{{ event.data }}</pre>
					</div>
				</div>
			</div>
		</div>

		<footer class="footer">
			<p>
				Powered by <strong>@relay/sdk-browser</strong> + Vue 3
			</p>
		</footer>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { RelayRealtimeClient } from '@relay/sdk-browser';
import type {
	TaskAssignedEvent,
	RiderLocationUpdateEvent,
	TaskCompletedEvent,
} from '@relay/sdk-browser';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
const TASK_ID = import.meta.env.VITE_TASK_ID || 'task-demo-123';

interface Location {
	latitude: number;
	longitude: number;
	bearing?: number;
	speed?: number;
}

interface EventLog {
	id: number;
	time: string;
	type: string;
	data: string;
}

// State
const relay = ref<RelayRealtimeClient | null>(null);
const connectionState = ref('disconnected');
const taskStatus = ref('PENDING');
const riderId = ref<string | null>(null);
const riderLocation = ref<Location | null>(null);
const eta = ref<number | null>(null);
const events = ref<EventLog[]>([]);
const error = ref<string | null>(null);
let eventId = 0;

// Computed colors
const connectionColor = computed(() => {
	const colors: Record<string, string> = {
		connected: '#10b981',
		connecting: '#f59e0b',
		reconnecting: '#f59e0b',
		disconnected: '#ef4444',
		error: '#ef4444',
	};
	return colors[connectionState.value] || '#6b7280';
});

const statusColor = computed(() => {
	const colors: Record<string, string> = {
		PENDING: '#f59e0b',
		ASSIGNED: '#8b5cf6',
		IN_PROGRESS: '#06b6d4',
		COMPLETED: '#10b981',
		FAILED: '#ef4444',
		CANCELLED: '#ef4444',
	};
	return colors[taskStatus.value] || '#6b7280';
});

// Methods
const addEvent = (type: string, data: any) => {
	events.value.unshift({
		id: eventId++,
		time: new Date().toLocaleTimeString(),
		type,
		data: JSON.stringify(data, null, 2),
	});
	// Keep last 10 events
	if (events.value.length > 10) {
		events.value.pop();
	}
};

const initializeRelay = async () => {
	try {
		error.value = null;

		// Fetch session token from backend
		const res = await fetch(`${BACKEND_URL}/api/session-token`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ taskId: TASK_ID }),
		});

		if (!res.ok) {
			throw new Error('Failed to get session token');
		}

		const { token } = await res.json();

		// Initialize Relay client
		const client = new RelayRealtimeClient({
			token,
			autoConnect: true,
		});

		// Connection events
		client.on('CONNECTION_OPEN', () => {
			connectionState.value = 'connected';
			addEvent('CONNECTION_OPEN', { state: 'connected' });
		});

		client.on('CONNECTION_CLOSE', (event) => {
			connectionState.value = 'disconnected';
			addEvent('CONNECTION_CLOSE', event);
		});

		client.on('CONNECTION_ERROR', (event) => {
			connectionState.value = 'error';
			error.value = event.error;
			addEvent('CONNECTION_ERROR', event);
		});

		client.on('CONNECTION_RECONNECTING', (event) => {
			connectionState.value = 'reconnecting';
			addEvent('CONNECTION_RECONNECTING', event);
		});

		// Task events
		client.on('TASK_ASSIGNED', (event: TaskAssignedEvent) => {
			taskStatus.value = 'ASSIGNED';
			riderId.value = event.riderId;
			eta.value = event.eta || null;
			addEvent('TASK_ASSIGNED', event);
		});

		client.on('TASK_IN_PROGRESS', (event) => {
			taskStatus.value = 'IN_PROGRESS';
			addEvent('TASK_IN_PROGRESS', event);
		});

		client.on('TASK_COMPLETED', (event: TaskCompletedEvent) => {
			taskStatus.value = 'COMPLETED';
			addEvent('TASK_COMPLETED', event);
		});

		client.on('RIDER_LOCATION_UPDATE', (event: RiderLocationUpdateEvent) => {
			riderLocation.value = event.location;
			addEvent('RIDER_LOCATION_UPDATE', event);
		});

		// Token expiring
		client.on('TOKEN_EXPIRING', async (event) => {
			addEvent('TOKEN_EXPIRING', event);
			try {
				const res = await fetch(`${BACKEND_URL}/api/session-token`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ taskId: TASK_ID }),
				});
				const { token: newToken } = await res.json();
				client.updateToken(newToken);
			} catch (err) {
				console.error('Failed to refresh token:', err);
			}
		});

		// Subscribe to task
		await client.subscribe('task', TASK_ID);

		relay.value = client;
	} catch (err: any) {
		console.error('Initialization error:', err);
		error.value = err.message;
	}
};

// Lifecycle
onMounted(() => {
	initializeRelay();
});

onUnmounted(() => {
	relay.value?.disconnect();
});
</script>

<style scoped>
:root {
	--bg-primary: #0f172a;
	--bg-secondary: #1e293b;
	--bg-tertiary: #334155;
	--text-primary: #f1f5f9;
	--text-secondary: #cbd5e1;
	--border-color: #475569;
}

.app {
	min-height: 100vh;
	display: flex;
	flex-direction: column;
	background: var(--bg-primary);
	color: var(--text-primary);
}

.header {
	background: var(--bg-secondary);
	border-bottom: 1px solid var(--border-color);
	padding: 1.5rem 2rem;
}

.header h1 {
	font-size: 2rem;
	margin-bottom: 1rem;
}

.status-bar {
	display: flex;
	gap: 2rem;
	flex-wrap: wrap;
}

.status-item {
	display: flex;
	align-items: center;
	gap: 0.5rem;
}

.status-label {
	color: var(--text-secondary);
	font-size: 0.875rem;
}

.status-value {
	font-weight: 600;
	font-size: 0.875rem;
	text-transform: uppercase;
	letter-spacing: 0.05em;
}

.error-banner {
	background: #ef4444;
	color: white;
	padding: 1rem 2rem;
}

.content {
	flex: 1;
	padding: 2rem;
	display: flex;
	flex-direction: column;
	gap: 1.5rem;
	max-width: 1200px;
	margin: 0 auto;
	width: 100%;
}

.panel {
	background: var(--bg-secondary);
	border: 1px solid var(--border-color);
	border-radius: 0.5rem;
	padding: 1.5rem;
}

.panel h2 {
	font-size: 1.25rem;
	margin-bottom: 1rem;
}

.info-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
	gap: 1rem;
}

.info-item {
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
}

.info-label {
	color: var(--text-secondary);
	font-size: 0.75rem;
	text-transform: uppercase;
	letter-spacing: 0.05em;
}

.info-value {
	font-size: 1rem;
	font-weight: 500;
	font-family: 'Courier New', monospace;
}

.event-log {
	max-height: 600px;
	overflow-y: auto;
	display: flex;
	flex-direction: column;
	gap: 1rem;
}

.empty-state {
	padding: 3rem;
	text-align: center;
	color: var(--text-secondary);
	font-style: italic;
}

.event-item {
	background: var(--bg-primary);
	border: 1px solid var(--border-color);
	border-radius: 0.375rem;
	padding: 1rem;
}

.event-header {
	display: flex;
	justify-content: space-between;
	margin-bottom: 0.75rem;
}

.event-time {
	color: var(--text-secondary);
	font-size: 0.75rem;
	font-family: 'Courier New', monospace;
}

.event-type {
	background: #3b82f6;
	color: white;
	padding: 0.25rem 0.75rem;
	border-radius: 0.25rem;
	font-size: 0.75rem;
	font-weight: 600;
}

.event-data {
	background: var(--bg-tertiary);
	border: 1px solid var(--border-color);
	border-radius: 0.25rem;
	padding: 0.75rem;
	font-size: 0.75rem;
	overflow-x: auto;
	font-family: 'Courier New', monospace;
}

.footer {
	background: var(--bg-secondary);
	border-top: 1px solid var(--border-color);
	padding: 1.5rem 2rem;
	text-align: center;
	color: var(--text-secondary);
	font-size: 0.875rem;
}
</style>
