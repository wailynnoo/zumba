-- Create database for Fitness Dance App
-- Run this with: psql -U postgres -f create-database.sql

-- Create database
CREATE DATABASE fitness_dance_dev;

-- Connect to the new database
\c fitness_dance_dev

-- Create schema (if needed)
CREATE SCHEMA
IF NOT EXISTS public;

-- Verify
SELECT current_database();

