import { useEtaCountdown, useTaskTracker } from '@relay-sdk/react';
import './App.css';

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

function formatDistance(meters: number) {
	return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${meters} m`;
}

function formatCountdown(seconds: number) {
	if (seconds < 60) return 'under a minute';
	const minutes = Math.ceil(seconds / 60);
	return `${minutes} min`;
}

function App() {
	// One hook tracks the task: status, rider position, live ETA, events and connection state.
	const { status, rider, eta, events, connection, error, currentStageIndex } = useTaskTracker(TASK_ID);
	const secondsLeft = useEtaCountdown(eta);
	const statusColor = STATUS_COLORS[status ?? 'PENDING'] ?? '#6b7280';

	return (
		<div className="app">
			<header className="header">
				<h1>🚚 Relay Task Tracker</h1>
				<div className="status-bar">
					<div className="status-item">
						<span className="status-label">Connection:</span>
						<span className="status-value" style={{ color: CONNECTION_COLORS[connection] }}>
							{connection}
						</span>
					</div>
					<div className="status-item">
						<span className="status-label">Task Status:</span>
						<span className="status-value" style={{ color: statusColor }}>
							{status ?? 'Finding a rider…'}
						</span>
					</div>
				</div>
			</header>

			{error && (
				<div className="error-banner">
					<strong>Error:</strong> {error.message}
				</div>
			)}

			<div className="content">
				<div className="panel">
					<h2>Task Information</h2>
					<div className="info-grid">
						<div className="info-item">
							<span className="info-label">Task ID:</span>
							<span className="info-value">{TASK_ID}</span>
						</div>
						<div className="info-item">
							<span className="info-label">Status:</span>
							<span className="info-value" style={{ color: statusColor }}>
								{status ?? 'PENDING'}
							</span>
						</div>
						{currentStageIndex !== null && (
							<div className="info-item">
								<span className="info-label">Current stop:</span>
								<span className="info-value">{currentStageIndex + 1}</span>
							</div>
						)}
						{rider?.riderId && (
							<div className="info-item">
								<span className="info-label">Rider ID:</span>
								<span className="info-value">{rider.riderId}</span>
							</div>
						)}
					</div>
				</div>

				{eta && secondsLeft !== null && (
					<div className="panel eta-panel">
						<h2>Arrival</h2>
						<p className="eta-headline">
							Arriving at stop {eta.stageIndex + 1} in <strong>{formatCountdown(secondsLeft)}</strong>
						</p>
						<div className="info-grid">
							<div className="info-item">
								<span className="info-label">Arrives at:</span>
								<span className="info-value">{new Date(eta.arrivesAt).toLocaleTimeString()}</span>
							</div>
							<div className="info-item">
								<span className="info-label">Distance by road:</span>
								<span className="info-value">{formatDistance(eta.meters)}</span>
							</div>
						</div>
					</div>
				)}

				{rider && (
					<div className="panel">
						<h2>Rider Location</h2>
						<div className="info-grid">
							<div className="info-item">
								<span className="info-label">Latitude:</span>
								<span className="info-value">{rider.latitude.toFixed(6)}</span>
							</div>
							<div className="info-item">
								<span className="info-label">Longitude:</span>
								<span className="info-value">{rider.longitude.toFixed(6)}</span>
							</div>
							{rider.speed !== null && (
								<div className="info-item">
									<span className="info-label">Speed:</span>
									{/* The SDK reports metres per second. */}
									<span className="info-value">{(rider.speed * 3.6).toFixed(1)} km/h</span>
								</div>
							)}
						</div>
					</div>
				)}

				<div className="panel">
					<h2>Event Log</h2>
					<div className="event-log">
						{events.length === 0 ? (
							<div className="empty-state">No events yet. Waiting for updates...</div>
						) : (
							events.map((event) => (
								<div key={`${event.type}-${event.at}`} className="event-item">
									<div className="event-header">
										<span className="event-time">{new Date(event.at).toLocaleTimeString()}</span>
										<span className="event-type">{event.type}</span>
									</div>
									<pre className="event-data">{JSON.stringify(event.payload, null, 2)}</pre>
								</div>
							))
						)}
					</div>
				</div>
			</div>

			<footer className="footer">
				<p>
					Powered by <strong>@relay-sdk/react</strong>
				</p>
			</footer>
		</div>
	);
}

export default App;
