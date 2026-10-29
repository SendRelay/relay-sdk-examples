import React from 'react';
import ReactDOM from 'react-dom/client';
import { RelayProvider } from '@relay-sdk/react';
import App from './App.tsx';
import './index.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

// The app never holds your API key: it asks your backend for a short-lived tracking token.
async function getToken(taskIds: string[]) {
	const res = await fetch(`${BACKEND_URL}/api/session-token`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ taskIds }),
	});
	if (!res.ok) throw new Error(`Token request failed (${res.status})`);
	return (await res.json()).token as string;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
	<React.StrictMode>
		{/* VITE_RELAY_REALTIME_URL only matters when you run against a local Relay API. */}
		<RelayProvider getToken={getToken} url={import.meta.env.VITE_RELAY_REALTIME_URL || undefined}>
			<App />
		</RelayProvider>
	</React.StrictMode>
);
