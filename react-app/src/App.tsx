import { useState, useEffect } from 'react';
import { RelayRealtimeClient } from '@relay/sdk-browser';
import type { TaskAssignedEvent, RiderLocationUpdateEvent } from '@relay/sdk-browser';
import './App.css';

// Configuration
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
const TASK_ID = import.meta.env.VITE_TASK_ID || 'task-demo-123';

interface Location {
	latitude: number;
	longitude: number;
	bearing?: number;
	speed?: number;
}

function App() {
	const [relay, setRelay] = useState<RelayRealtimeClient | null>(null);
	const [connectionState, setConnectionState] = useState<string>('disconnected');
	const [taskStatus, setTaskStatus] = useState<string>('PENDING');
	const [riderId, setRiderId] = useState<string | null>(null);
	const [riderLocation, setRiderLocation] = useState<Location | null>(null);
	const [eta, setEta] = useState<number | null>(null);
	const [events, setEvents] = useState<Array<{ time: string; type: string; data: string }>>([]);
	const [error, setError] = useState<string | null>(null);

	const addEvent = (type: string, data: any) => {
		setEvents((prev) => [
			{
				time: new Date().toLocaleTimeString(),
				type,
				data: JSON.stringify(data, null, 2),
			},
			...prev.slice(0, 9),
		]);
	};

	const initializeRelay = async () => {
		try {
			setError(null);

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
				setConnectionState('connected');
				addEvent('CONNECTION_OPEN', { state: 'connected' });
			});

			client.on('CONNECTION_CLOSE', (event) => {
				setConnectionState('disconnected');
				addEvent('CONNECTION_CLOSE', event);
			});

			client.on('CONNECTION_ERROR', (event) => {
				setConnectionState('error');
				setError(event.error);
				addEvent('CONNECTION_ERROR', event);
			});

			client.on('CONNECTION_RECONNECTING', (event) => {
				setConnectionState('reconnecting');
				addEvent('CONNECTION_RECONNECTING', event);
			});

			// Task events
			client.on('TASK_ASSIGNED', (event: TaskAssignedEvent) => {
				setTaskStatus('ASSIGNED');
				setRiderId(event.riderId);
				setEta(event.eta || null);
				addEvent('TASK_ASSIGNED', event);
			});

			client.on('TASK_IN_PROGRESS', (event) => {
				setTaskStatus('IN_PROGRESS');
				addEvent('TASK_IN_PROGRESS', event);
			});

			client.on('TASK_COMPLETED', (event) => {
				setTaskStatus('COMPLETED');
				addEvent('TASK_COMPLETED', event);
			});

			client.on('RIDER_LOCATION_UPDATE', (event: RiderLocationUpdateEvent) => {
				setRiderLocation(event.location);
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
				} catch (error) {
					console.error('Failed to refresh token:', error);
				}
			});

			// Subscribe to task
			await client.subscribe('task', TASK_ID);

			setRelay(client);
		} catch (error: any) {
			console.error('Initialization error:', error);
			setError(error.message);
		}
	};

	useEffect(() => {
		initializeRelay();
		return () => {
			relay?.disconnect();
		};
	}, []);

	const getStatusColor = () => {
		const colors: Record<string, string> = {
			PENDING: '#f59e0b',
			ASSIGNED: '#8b5cf6',
			IN_PROGRESS: '#06b6d4',
			COMPLETED: '#10b981',
			FAILED: '#ef4444',
			CANCELLED: '#ef4444',
		};
		return colors[taskStatus] || '#6b7280';
	};

	const getConnectionColor = () => {
		const colors: Record<string, string> = {
			connected: '#10b981',
			connecting: '#f59e0b',
			reconnecting: '#f59e0b',
			disconnected: '#ef4444',
			error: '#ef4444',
		};
		return colors[connectionState] || '#6b7280';
	};

	return (
		<div className="app">
			<header className="header">
				<h1>🚚 Relay Task Tracker</h1>
				<div className="status-bar">
					<div className="status-item">
						<span className="status-label">Connection:</span>
						<span className="status-value" style={{ color: getConnectionColor() }}>
							{connectionState}
						</span>
					</div>
					<div className="status-item">
						<span className="status-label">Task Status:</span>
						<span className="status-value" style={{ color: getStatusColor() }}>
							{taskStatus}
						</span>
					</div>
				</div>
			</header>

			{error && (
				<div className="error-banner">
					<strong>Error:</strong> {error}
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
							<span className="info-value" style={{ color: getStatusColor() }}>
								{taskStatus}
							</span>
						</div>
						{riderId && (
							<div className="info-item">
								<span className="info-label">Rider ID:</span>
								<span className="info-value">{riderId}</span>
							</div>
						)}
						{eta && (
							<div className="info-item">
								<span className="info-label">ETA:</span>
								<span className="info-value">{eta} minutes</span>
							</div>
						)}
					</div>
				</div>

				{riderLocation && (
					<div className="panel">
						<h2>Rider Location</h2>
						<div className="info-grid">
							<div className="info-item">
								<span className="info-label">Latitude:</span>
								<span className="info-value">{riderLocation.latitude.toFixed(6)}</span>
							</div>
							<div className="info-item">
								<span className="info-label">Longitude:</span>
								<span className="info-value">{riderLocation.longitude.toFixed(6)}</span>
							</div>
							{riderLocation.speed && (
								<div className="info-item">
									<span className="info-label">Speed:</span>
									<span className="info-value">{riderLocation.speed.toFixed(1)} km/h</span>
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
							events.map((event, index) => (
								<div key={index} className="event-item">
									<div className="event-header">
										<span className="event-time">{event.time}</span>
										<span className="event-type">{event.type}</span>
									</div>
									<pre className="event-data">{event.data}</pre>
								</div>
							))
						)}
					</div>
				</div>
			</div>

			<footer className="footer">
				<p>
					Powered by <strong>@relay/sdk-browser</strong>
				</p>
			</footer>
		</div>
	);
}

export default App;
