# PowerShell script to set up the Cold Email Generator backend

Write-Host "=== LinkedIn Cold Email Generator - Backend Setup ===" -ForegroundColor Cyan
Write-Host ""

# Check if .NET is installed
Write-Host "Checking for .NET SDK..." -ForegroundColor Yellow
$dotnetVersion = dotnet --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ .NET SDK found: $dotnetVersion" -ForegroundColor Green
} else {
    Write-Host "✗ .NET SDK not found. Please install .NET 9.0 SDK from:" -ForegroundColor Red
    Write-Host "  https://dotnet.microsoft.com/download/dotnet/9.0" -ForegroundColor Yellow
    exit 1
}

# Navigate to backend directory
Write-Host ""
Write-Host "Navigating to backend directory..." -ForegroundColor Yellow
Set-Location -Path "backend\ColdEmailAPI"

# Check if appsettings.json exists
Write-Host ""
if (Test-Path "appsettings.json") {
    Write-Host "✓ appsettings.json found" -ForegroundColor Green
    Write-Host "  Make sure you have configured your Gemini API key!" -ForegroundColor Yellow
} else {
    Write-Host "⚠ appsettings.json not found" -ForegroundColor Yellow
    Write-Host "  Copying from appsettings.Example.json..." -ForegroundColor Yellow
    Copy-Item "appsettings.Example.json" -Destination "appsettings.json"
    Write-Host "  ✓ Created appsettings.json" -ForegroundColor Green
    Write-Host "  ⚠ IMPORTANT: Edit appsettings.json and add your Gemini API key!" -ForegroundColor Red
    Write-Host "  Get your key from: https://makersuite.google.com/app/apikey" -ForegroundColor Yellow
}

# Restore NuGet packages
Write-Host ""
Write-Host "Restoring NuGet packages..." -ForegroundColor Yellow
dotnet restore
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Packages restored successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to restore packages" -ForegroundColor Red
    exit 1
}

# Build the project
Write-Host ""
Write-Host "Building the project..." -ForegroundColor Yellow
dotnet build
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Build successful" -ForegroundColor Green
} else {
    Write-Host "✗ Build failed" -ForegroundColor Red
    exit 1
}

# Check if database exists and run migrations
Write-Host ""
Write-Host "Setting up database..." -ForegroundColor Yellow
Write-Host "Running database migrations..." -ForegroundColor Yellow
dotnet ef database update
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Database created/updated successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Database migration failed" -ForegroundColor Red
    Write-Host "  Make sure SQL Server is running and connection string is correct" -ForegroundColor Yellow
    exit 1
}

# All done
Write-Host ""
Write-Host "=== Setup Complete! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Make sure you've added your Gemini API key to appsettings.json" -ForegroundColor White
Write-Host "2. Run the backend with: dotnet run" -ForegroundColor White
Write-Host "3. Load the Chrome extension from the 'extension' folder" -ForegroundColor White
Write-Host "4. Check SETUP.md for detailed instructions" -ForegroundColor White
Write-Host ""
Write-Host "To start the backend now, press Enter. To exit, press Ctrl+C" -ForegroundColor Yellow
Read-Host

# Start the backend
Write-Host ""
Write-Host "Starting the backend..." -ForegroundColor Green
Write-Host "The API will be available at:" -ForegroundColor Cyan
Write-Host "  - https://localhost:7000" -ForegroundColor White
Write-Host "  - http://localhost:5000" -ForegroundColor White
Write-Host "  - Swagger UI: https://localhost:7000/swagger" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

dotnet run

