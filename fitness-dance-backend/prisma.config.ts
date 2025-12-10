// prisma/config.ts
// Prisma 7 configuration for migrations
// This file is used by Prisma Migrate

import { config } from 'dotenv';

// Load environment variables
config();

export default {
  datasource: {
    url: process.env.DATABASE_URL,
  },
};
