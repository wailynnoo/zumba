#!/bin/bash
# Deployment script for latest security updates
# Run this script to update the server with the latest fixes

set -e  # Exit on error

echo "🚀 Starting deployment update..."
echo ""

# Step 1: Check if we're in the right directory
if [ ! -f "prisma/schema.prisma" ]; then
    echo "❌ Error: Must run from fitness-dance-backend root directory"
    exit 1
fi

# Step 2: Backup database (optional - uncomment if needed)
# echo "📦 Creating database backup..."
# pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME > backup_$(date +%Y%m%d_%H%M%S).sql
# echo "✅ Backup created"

# Step 3: Run migrations
echo "📝 Running database migrations..."
npx prisma migrate deploy
echo "✅ Migrations applied"

# Step 4: Regenerate Prisma Client
echo "🔧 Regenerating Prisma Client..."
npx prisma generate --schema=prisma/schema.prisma
echo "✅ Prisma Client regenerated"

# Step 5: Build admin-api
echo "🏗️  Building admin-api..."
cd admin-api
npm run build
echo "✅ admin-api built"

# Step 6: Build member-api
echo "🏗️  Building member-api..."
cd ../member-api
npm run build
echo "✅ member-api built"

cd ..

echo ""
echo "✅ Deployment update completed!"
echo ""
echo "📋 Next steps:"
echo "1. Update environment variables (see DEPLOYMENT_UPDATE.md)"
echo "2. Restart your services"
echo "3. Test login and token refresh"
echo ""

