<template>
	<div class="app">
		<header class="header">
			<h1>🚚 Relay Task Tracker</h1>
			<div class="status-bar">
				<div class="status-item">
					<span class="status-label">Connection:</span>
					<span class="status-value" :style="{ color: connectionColor }">{{ connection }}</span>
				</div>
				<div class="status-item">
					<span class="status-label">Task Status:</span>
					<span class="status-value" :style="{ color: statusColor }">{{ status ?? 'Finding a rider…' }}</span>
				</div>
			</div>
		</header>

		<div v-if="error" class="error-banner"><strong>Error:</strong> {{ error.message }}</div>

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
						<span class="info-value" :style="{ color: statusColor }">{{ status ?? 'PENDING' }}</span>
					</div>
					<div v-if="currentStageIndex !== null" class="info-item">
						<span class="info-label">Current stop:</span>
						<span class="info-value">{{ currentStageIndex + 1 }}</span>
					</div>
					<div v-if="rider?.riderId" class="info-item">
						<span class="info-label">Rider ID:</span>
						<span class="info-value">{{ rider.riderId }}</span>
					</div>
				</div>
			</div>

			<div v-if="eta && secondsLeft !== null" class="panel eta-panel">
				<h2>Arrival</h2>
				<p class="eta-headline">
					Arriving at stop {{ eta.stageIndex + 1 }} in <strong>{{ formatCountdown(secondsLeft) }}</strong>
				</p>
				<div class="info-grid">
					<div class="info-item">
						<span class="info-label">Arrives at:</span>
						<span class="info-value">{{ new Date(eta.arrivesAt).toLocaleTimeString() }}</span>
					</div>
					<div class="info-item">
						<span class="info-label">Distance by road:</span>
						<span class="info-value">{{ formatDistance(eta.meters) }}</span>
					</div>
				</div>
			</div>

			<div v-if="rider" class="panel">
				<h2>Rider Location</h2>
				<div class="info-grid">
					<div class="info-item">
						<span class="info-label">Latitude:</span>
						<span class="info-value">{{ rider.latitude.toFixed(6) }}</span>
					</div>
					<div class="info-item">
						<span class="info-label">Longitude:</span>
						<span class="info-value">{{ rider.longitude.toFixed(6) }}</span>
					</div>
					<div v-if="rider.speed !== null" class="info-item">
						<span class="info-label">Speed:</span>
						<!-- The SDK reports metres per second. -->
						<span class="info-value">{{ (rider.speed * 3.6).toFixed(1) }} km/h</span>
					</div>
				</div>
			</div>

			<div class="panel">
				<h2>Event Log</h2>
				<div class="event-log">
					<div v-if="events.length === 0" class="empty-state">No events yet. Waiting for updates...</div>
					<div v-for="event in events" :key="`${event.type}-${event.at}`" class="event-item">
						<div class="event-header">
							<span class="event-time">{{ new Date(event.at).toLocaleTimeString() }}</span>
							<span class="event-type">{{ event.type }}</span>
						</div>
						<pre class="event-data">{{ JSON.stringify(event.payload, null, 2) }}</pre>
					</div>
				</div>
			</div>
		</div>

		<footer class="footer">
			<p>Powered by <strong>@relay-sdk/vue</strong></p>
		</footer>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useEtaCountdown, useTaskTracker } from '@relay-sdk/vue';

const TASK_ID = import.meta.env.VITE_TASK_ID || 'task-demo-123';

const STATUS_COLORS: Record<string, string> = {
	PENDING: '#f59e0b',
	OFFERED: '#f59e0b',
	ASSIGNED: '#8b5cf6',
	IN_PROGRESS: '#06b6d4',
	COMPLETED: '#10b981',
	FAILED: '#ef4444',
	CANCELLED: '#ef4444',
};
const CONNECTION_COLORS: Record<string, string> = {
	live: '#10b981',
	connecting: '#f59e0b',
	reconnecting: '#f59e0b',
	offline: '#ef4444',
	idle: '#6b7280',
};

// One composable tracks the task: status, rider position, live ETA, events and connection state.
const { status, rider, eta, events, connection, error, currentStageIndex } = useTaskTracker(TASK_ID);
const secondsLeft = useEtaCountdown(eta);

const statusColor = computed(() => STATUS_COLORS[status.value ?? 'PENDING'] ?? '#6b7280');
const connectionColor = computed(() => CONNECTION_COLORS[connection.value]);

function formatDistance(meters: number) {
	return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${meters} m`;
}

function formatCountdown(seconds: number) {
	return seconds < 60 ? 'under a minute' : `${Math.ceil(seconds / 60)} min`;
}
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

.eta-panel {
	border-color: #10b981;
}

.eta-headline {
	margin-bottom: 1rem;
	font-size: 1.25rem;
}

.eta-headline strong {
	color: #10b981;
}
</style>
