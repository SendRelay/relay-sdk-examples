# Relay SDK Examples

Official examples for the Relay Delivery Platform SDKs.

These examples demonstrate how to integrate Relay into your applications using our published npm packages.

## 📦 Available SDKs

- **[@relay-sdk/sdk-node](https://www.npmjs.com/package/@relay-sdk/sdk-node)** - Server-side SDK for Node.js
- **[@relay-sdk/sdk-browser](https://www.npmjs.com/package/@relay-sdk/sdk-browser)** - Browser SDK for real-time WebSocket updates

## 🚀 Examples

### Backend Examples

- **[Node.js Backend](./node-backend/)** - Express server with task management and webhook handling
- **[Next.js API Routes]** - (*todo)  Full-stack Next.js app with API routes

### Frontend Examples

- **[React App](./react-app/)** - Real-time task tracking with React
- **[Next.js Full-Stack]** - (*todo) Complete Next.js application
- **[Vue App](./vue-app/)** - Task tracking with Vue 3

## 🔑 Getting Started

### 1. Get Your API Key

Sign up at [sendrelay.com.ng](https://dashboard.sendrelay.com.ng) and get your API key from the dashboard.

### 2. Choose an Example

Each example has its own README with setup instructions. All examples are standalone and production-ready.

### 3. Install Dependencies

All examples use the published npm packages:

```bash
npm install @relay-sdk/sdk-node @relay-sdk/sdk-browser
```

## 📚 Documentation

- [Server SDK Documentation](https://www.npmjs.com/package/@relay-sdk/sdk-node)
- [Browser SDK Documentation](https://www.npmjs.com/package/@relay-sdk/sdk-browser)
- [Flutter SDK Documentation](https://pub.dev/packages/relay_flutter)
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
├── package.json        # Uses published @relay/* packages
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
