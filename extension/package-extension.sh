#!/bin/bash
# Bash script to package Chrome extension for Web Store submission
# Run this from the project root directory

echo "Packaging LazyMails extension for Chrome Web Store..."

# Create temporary directory for packaging
PACKAGE_DIR="extension-package"
EXTENSION_DIR="extension"

# Remove old package if exists
rm -rf "$PACKAGE_DIR"

# Create package directory
mkdir -p "$PACKAGE_DIR"

# Files to include (exclude dev files)
FILES=(
    "background.js"
    "config.js"
    "content.js"
    "dashboard.css"
    "dashboard.html"
    "dashboard.js"
    "manifest.json"
    "popup.css"
    "popup.html"
    "popup.js"
    "profile.css"
    "profile.html"
    "profile.js"
    "icons"
)

# Copy files
for file in "${FILES[@]}"; do
    if [ -e "$EXTENSION_DIR/$file" ]; then
        cp -r "$EXTENSION_DIR/$file" "$PACKAGE_DIR/"
        echo "  ✓ Copied $file"
    else
        echo "  ⚠ Warning: $file not found"
    fi
done

# Create ZIP file
ZIP_FILE="lazymails-extension-v1.0.0.zip"
rm -f "$ZIP_FILE"

echo ""
echo "Creating ZIP file..."
cd "$PACKAGE_DIR"
zip -r "../$ZIP_FILE" . > /dev/null
cd ..

# Cleanup
rm -rf "$PACKAGE_DIR"

echo ""
echo "✅ Package created: $ZIP_FILE"
echo ""
echo "Ready for Chrome Web Store submission!"
echo "File size: $(du -h "$ZIP_FILE" | cut -f1)"










