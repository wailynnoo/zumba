// test-db-connection.ts
// Test script to verify database connection

import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";

dotenv.config();

// Prisma 7: Create PostgreSQL adapter
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function testConnection() {
  try {
    console.log("🔌 Attempting to connect to database...");
    console.log("📍 Database URL:", process.env.DATABASE_URL?.replace(/:[^:@]+@/, ":****@"));
    
    await prisma.$connect();
    console.log("✅ Database connection successful!");
    
    // Test a simple query
    const result = await prisma.$queryRaw`SELECT version() as version, current_database() as database`;
    console.log("✅ Database query successful!");
    console.log("📊 Database Info:", result);
    
    await prisma.$disconnect();
    console.log("✅ Disconnected successfully");
    process.exit(0);
  } catch (error: any) {
    console.error("❌ Database connection failed!");
    console.error("Error:", error.message);
    
    if (error.message.includes("password")) {
      console.error("\n💡 Tip: Check your password in DATABASE_URL");
    } else if (error.message.includes("does not exist")) {
      console.error("\n💡 Tip: Create the database first: CREATE DATABASE fitness_dance_dev;");
    } else if (error.message.includes("connection refused") || error.message.includes("ECONNREFUSED")) {
      console.error("\n💡 Tip: Make sure PostgreSQL service is running");
    }
    
    await prisma.$disconnect();
    process.exit(1);
  }
}

testConnection();

