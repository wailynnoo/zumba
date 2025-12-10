# PowerShell script to create database
# Run: .\SETUP_DATABASE.ps1

Write-Host "🚀 Setting up Fitness Dance App Database" -ForegroundColor Cyan
Write-Host ""

# Check if database already exists
Write-Host "Checking if database exists..." -ForegroundColor Yellow
$checkDb = & "D:\PostgreSQL\16\bin\psql.exe" -U postgres -t -c "SELECT 1 FROM pg_database WHERE datname='fitness_dance_dev';" 2>&1

if ($checkDb -match "1") {
    Write-Host "✅ Database 'fitness_dance_dev' already exists!" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can proceed to:" -ForegroundColor Yellow
    Write-Host "1. Add DATABASE_URL to .env files" -ForegroundColor White
    Write-Host "2. Test connection: npx ts-node test-db-connection.ts" -ForegroundColor White
    Write-Host "3. Create migration: npx prisma migrate dev --name init" -ForegroundColor White
} else {
    Write-Host "Creating database 'fitness_dance_dev'..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "You will be prompted for PostgreSQL password." -ForegroundColor Yellow
    Write-Host ""
    
    & "D:\PostgreSQL\16\bin\psql.exe" -U postgres -c "CREATE DATABASE fitness_dance_dev;"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Database created successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Yellow
        Write-Host "1. Add DATABASE_URL to .env files:" -ForegroundColor White
        Write-Host "   postgresql://postgres:YOUR_PASSWORD@localhost:5432/fitness_dance_dev?schema=public" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "2. Test connection:" -ForegroundColor White
        Write-Host "   npx ts-node test-db-connection.ts" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "3. Create migration:" -ForegroundColor White
        Write-Host "   npx prisma migrate dev --name init" -ForegroundColor Cyan
    } else {
        Write-Host ""
        Write-Host "❌ Failed to create database. Check your password." -ForegroundColor Red
    }
}

