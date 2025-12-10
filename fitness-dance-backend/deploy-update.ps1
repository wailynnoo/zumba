# Deployment script for latest security updates (PowerShell)
# Run this script to update the server with the latest fixes

$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting deployment update..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if we're in the right directory
if (-not (Test-Path "prisma/schema.prisma")) {
    Write-Host "❌ Error: Must run from fitness-dance-backend root directory" -ForegroundColor Red
    exit 1
}

# Step 2: Backup database (optional - uncomment if needed)
# Write-Host "📦 Creating database backup..." -ForegroundColor Yellow
# $backupFile = "backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
# pg_dump -h $env:DB_HOST -U $env:DB_USER -d $env:DB_NAME > $backupFile
# Write-Host "✅ Backup created: $backupFile" -ForegroundColor Green

# Step 3: Run migrations
Write-Host "📝 Running database migrations..." -ForegroundColor Yellow
npx prisma migrate deploy
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Migration failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Migrations applied" -ForegroundColor Green

# Step 4: Regenerate Prisma Client
Write-Host "🔧 Regenerating Prisma Client..." -ForegroundColor Yellow
npx prisma generate --schema=prisma/schema.prisma
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Prisma Client generation failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Prisma Client regenerated" -ForegroundColor Green

# Step 5: Build admin-api
Write-Host "🏗️  Building admin-api..." -ForegroundColor Yellow
Set-Location admin-api
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ admin-api build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ admin-api built" -ForegroundColor Green

# Step 6: Build member-api
Write-Host "🏗️  Building member-api..." -ForegroundColor Yellow
Set-Location ../member-api
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ member-api build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ member-api built" -ForegroundColor Green

Set-Location ..

Write-Host ""
Write-Host "✅ Deployment update completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Update environment variables (see DEPLOYMENT_UPDATE.md)"
Write-Host "2. Restart your services"
Write-Host "3. Test login and token refresh"
Write-Host ""

