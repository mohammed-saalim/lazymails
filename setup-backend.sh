#!/bin/bash

# Bash script to set up the Cold Email Generator backend (macOS/Linux)

echo "=== LinkedIn Cold Email Generator - Backend Setup ==="
echo ""

# Check if .NET is installed
echo "Checking for .NET SDK..."
if command -v dotnet &> /dev/null; then
    DOTNET_VERSION=$(dotnet --version)
    echo "✓ .NET SDK found: $DOTNET_VERSION"
else
    echo "✗ .NET SDK not found. Please install .NET 9.0 SDK from:"
    echo "  https://dotnet.microsoft.com/download/dotnet/9.0"
    exit 1
fi

# Navigate to backend directory
echo ""
echo "Navigating to backend directory..."
cd backend/ColdEmailAPI || exit 1

# Check if appsettings.json exists
echo ""
if [ -f "appsettings.json" ]; then
    echo "✓ appsettings.json found"
    echo "  Make sure you have configured your Gemini API key!"
else
    echo "⚠ appsettings.json not found"
    echo "  Copying from appsettings.Example.json..."
    cp appsettings.Example.json appsettings.json
    echo "  ✓ Created appsettings.json"
    echo "  ⚠ IMPORTANT: Edit appsettings.json and add your Gemini API key!"
    echo "  Get your key from: https://makersuite.google.com/app/apikey"
fi

# Restore NuGet packages
echo ""
echo "Restoring NuGet packages..."
dotnet restore
if [ $? -eq 0 ]; then
    echo "✓ Packages restored successfully"
else
    echo "✗ Failed to restore packages"
    exit 1
fi

# Build the project
echo ""
echo "Building the project..."
dotnet build
if [ $? -eq 0 ]; then
    echo "✓ Build successful"
else
    echo "✗ Build failed"
    exit 1
fi

# Check if database exists and run migrations
echo ""
echo "Setting up database..."
echo "Running database migrations..."
dotnet ef database update
if [ $? -eq 0 ]; then
    echo "✓ Database created/updated successfully"
else
    echo "✗ Database migration failed"
    echo "  Make sure SQL Server is running and connection string is correct"
    exit 1
fi

# All done
echo ""
echo "=== Setup Complete! ==="
echo ""
echo "Next steps:"
echo "1. Make sure you've added your Gemini API key to appsettings.json"
echo "2. Run the backend with: dotnet run"
echo "3. Load the Chrome extension from the 'extension' folder"
echo "4. Check SETUP.md for detailed instructions"
echo ""
echo "To start the backend now, press Enter. To exit, press Ctrl+C"
read

# Start the backend
echo ""
echo "Starting the backend..."
echo "The API will be available at:"
echo "  - https://localhost:7000"
echo "  - http://localhost:5000"
echo "  - Swagger UI: https://localhost:7000/swagger"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

dotnet run

