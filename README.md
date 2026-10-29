# Relay SDK Examples

Official examples for the Relay Delivery Platform SDKs.

These examples demonstrate how to integrate Relay into your applications using our published npm packages.

## 📦 SDKs used here

- **[@relay-sdk/sdk-node](https://www.npmjs.com/package/@relay-sdk/sdk-node)** - Server SDK: tasks, webhooks and tracking tokens
- **[@relay-sdk/react](https://www.npmjs.com/package/@relay-sdk/react)** - React hooks for live tracking
- **[@relay-sdk/vue](https://www.npmjs.com/package/@relay-sdk/vue)** - Vue composables for live tracking

Relay also has SDKs for Python, Go, Java, Svelte, React Native, Flutter, Swift and Kotlin. See [Choosing an SDK](https://docs.sendrelay.com.ng/sdks).

## 🚀 Examples

### Backend Examples

- **[Node.js Backend](./node-backend/)** - Express server with task management, webhook handling and tracking tokens
- **[Next.js API Routes]** - (*todo)  Full-stack Next.js app with API routes

### Frontend Examples

- **[React App](./react-app/)** - Live tracking with status, rider location and live ETA, using `useTaskTracker`
- **[Next.js Full-Stack]** - (*todo) Complete Next.js application
- **[Vue App](./vue-app/)** - The same tracker in Vue 3, using the `useTaskTracker` composable

## 🔑 Getting Started

### 1. Get Your API Key

Sign up at [dashboard.sendrelay.com.ng](https://dashboard.sendrelay.com.ng) and create an API key. Start with an `sk_test_` key: test tasks play out as simulated deliveries, with a virtual rider and a live ETA, and never move money.

### 2. Run the backend

The frontends never hold your API key. They ask the backend for a short-lived tracking token, so start [node-backend](./node-backend/) first.

### 3. Create a task and track it

Create a task through the backend with `"simulationOutcome": "SUCCESS"`, put its id in the React or Vue app's `.env`, and run the app. Each example's README has the steps.

## 📚 Documentation

- [Node SDK](https://docs.sendrelay.com.ng/sdks/node-sdk)
- [React SDK](https://docs.sendrelay.com.ng/sdks/react-sdk)
- [Vue SDK](https://docs.sendrelay.com.ng/sdks/vue-sdk)
- [Live tracking guide](https://docs.sendrelay.com.ng/tracking)
- [API Reference](https://docs.sendrelay.com.ng/api-reference)
- [Webhook Events](https://docs.sendrelay.com.ng/webhooks)

## 🤝 Contributing

We welcome contributions! To add a new example:

1. Fork this repository
2. Create a new directory for your example
3. Include a comprehensive README
4. Submit a pull request

### Example Guidelines

- Use published npm packages (not local/workspace versions)
- Include a complete README with setup instructions
- Add a `.env.example` file
- Keep dependencies minimal
- Follow TypeScript best practices
- Include error handling

## 📝 Example Structure

Each example should follow this structure:

```
example-name/
├── README.md           # Setup and usage instructions
├── package.json        # Uses published @relay-sdk/* packages
├── .env.example        # Environment variables template
├── .gitignore
├── src/
│   └── index.ts
└── tsconfig.json
```

## 🆘 Support

- [GitHub Issues](https://github.com/SendRelay/relay-sdk-examples/issues)
- [Documentation](https://docs.sendrelay.com.ng)
- [Discord Community](https://discord.gg/relay)
- Email: ops@sendrelay.com.ng

## 📄 License

MIT License - feel free to use these examples in your projects.

---
