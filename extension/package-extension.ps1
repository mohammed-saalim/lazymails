# PowerShell script to package Chrome extension for Web Store submission
# Run this from the project root directory

Write-Host "Packaging LazyMails extension for Chrome Web Store..." -ForegroundColor Green

# Create temporary directory for packaging
$packageDir = "extension-package"
$extensionDir = "extension"

# Remove old package if exists
if (Test-Path $packageDir) {
    Remove-Item -Recurse -Force $packageDir
}

# Create package directory
New-Item -ItemType Directory -Path $packageDir | Out-Null

# Files to include (exclude dev files)
$filesToInclude = @(
    "background.js",
    "config.js",
    "content.js",
    "dashboard.css",
    "dashboard.html",
    "dashboard.js",
    "manifest.json",
    "popup.css",
    "popup.html",
    "popup.js",
    "profile.css",
    "profile.html",
    "profile.js",
    "icons"
)

# Copy files
foreach ($file in $filesToInclude) {
    $sourcePath = Join-Path $extensionDir $file
    $destPath = Join-Path $packageDir $file
    
    if (Test-Path $sourcePath) {
        if (Test-Path $sourcePath -PathType Container) {
            Copy-Item -Path $sourcePath -Destination $destPath -Recurse
        } else {
            Copy-Item -Path $sourcePath -Destination $destPath
        }
        Write-Host "  [OK] Copied $file" -ForegroundColor Gray
    } else {
        Write-Host "  [WARNING] $file not found" -ForegroundColor Yellow
    }
}

# Create ZIP file
$zipFile = "lazymails-extension-v1.0.0.zip"
if (Test-Path $zipFile) {
    Remove-Item $zipFile
}

Write-Host "`nCreating ZIP file..." -ForegroundColor Green
Compress-Archive -Path "$packageDir\*" -DestinationPath $zipFile -Force

# Cleanup
Remove-Item -Recurse -Force $packageDir

Write-Host "`n[SUCCESS] Package created: $zipFile" -ForegroundColor Green
Write-Host "`nReady for Chrome Web Store submission!" -ForegroundColor Cyan
$fileSize = [math]::Round((Get-Item $zipFile).Length / 1KB, 2)
Write-Host "File size: $fileSize KB" -ForegroundColor Gray

