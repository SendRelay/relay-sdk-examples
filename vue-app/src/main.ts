import { createApp } from 'vue';
import { createRelay } from '@relay-sdk/vue';
import App from './App.vue';
import './style.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

createApp(App)
	.use(
		createRelay({
			// The app never holds your API key: it asks your backend for a short-lived tracking token.
			getToken: async (taskIds) => {
				const res = await fetch(`${BACKEND_URL}/api/session-token`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ taskIds }),
				});
				if (!res.ok) throw new Error(`Token request failed (${res.status})`);
				return (await res.json()).token;
			},
			// Only matters when you run against a local Relay API.
			url: import.meta.env.VITE_RELAY_REALTIME_URL || undefined,
		}),
	)
	.mount('#app');
