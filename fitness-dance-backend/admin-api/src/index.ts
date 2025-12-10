// admin-api/src/index.ts
// Entry point for Admin API

import app from "./app";
// Environment variables are validated in app.ts via ./config/env
import { env } from "./config/env";

// Start server
app.listen(env.PORT, () => {
  console.log(`🚀 Admin API server running on port ${env.PORT}`);
  console.log(`📍 Environment: ${env.NODE_ENV}`);
  console.log(`🌐 Health check: http://localhost:${env.PORT}/health`);
});

