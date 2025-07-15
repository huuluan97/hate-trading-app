# 🏗️ Build Instructions - Trading App

This guide explains how to build the Trading App for distribution on macOS, Windows, and Linux.

## 📋 Prerequisites

### Required Software

- **Node.js** (v16 or higher)
- **npm** (v7 or higher)
- **Git**

### Platform-Specific Requirements

#### For macOS Builds:

- **macOS** (required for DMG and code signing)
- **Xcode Command Line Tools**: `xcode-select --install`

#### For Windows Builds:

- Can build on **Windows**, **macOS**, or **Linux**
- **Wine** (optional, for better compatibility on non-Windows systems)

#### For Linux Builds:

- Can build on any platform
- **fpm** (for creating packages): `npm install -g fpm`

## 🚀 Quick Start

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Build for Your Platform**

   ```bash
   # Build for current platform
   npm run build:release

   # Build for specific platforms
   npm run build:mac     # macOS only
   npm run build:win     # Windows only
   npm run dist:all      # All platforms
   ```

## 📦 Build Commands

### Basic Commands

```bash
# Development build (for testing)
npm start

# Production build (all platforms)
npm run build:release

# Platform-specific builds
npm run build:mac       # macOS (DMG + ZIP)
npm run build:win       # Windows (Installer + Portable)
npm run package:linux   # Linux (AppImage)
```

### Advanced Commands

```bash
# Clean build (removes previous builds)
npm run package:all

# Individual package types
npm run package:mac     # macOS packages
npm run package:win     # Windows packages
npm run package:linux   # Linux packages
```

## 🎯 Output Files

After building, find your distributables in `release/build/`:

### macOS Output

- **`Trading App-x.x.x.dmg`** - Installer for macOS
- **`Trading App-x.x.x-mac.zip`** - Portable version
- **`Trading App-x.x.x-arm64.dmg`** - Apple Silicon optimized
- **`Trading App-x.x.x-x64.dmg`** - Intel Mac optimized

### Windows Output

- **`Trading App Setup x.x.x.exe`** - Windows installer
- **`Trading App x.x.x.exe`** - Portable executable
- Supports both **x64** and **x32** architectures

### Linux Output

- **`Trading App-x.x.x.AppImage`** - Universal Linux application

## ⚙️ Configuration

### App Information

Edit `package.json` to customize:

```json
{
  "name": "hate-trading-app",
  "productName": "Trading App",
  "description": "Decentralized Trading Application",
  "version": "1.0.0",
  "build": {
    "appId": "com.tradingapp.desktop",
    "productName": "Trading App"
  }
}
```

### Build Options

#### macOS Configuration

```json
"mac": {
  "target": [
    { "target": "dmg", "arch": ["arm64", "x64"] },
    { "target": "zip", "arch": ["arm64", "x64"] }
  ],
  "category": "public.app-category.finance",
  "icon": "assets/icon.icns"
}
```

#### Windows Configuration

```json
"win": {
  "target": [
    { "target": "nsis", "arch": ["x64", "ia32"] },
    { "target": "portable", "arch": ["x64"] }
  ],
  "icon": "assets/icon.ico"
}
```

## 🔧 Advanced Build Options

### Code Signing (Production)

#### macOS Code Signing

1. **Get Apple Developer Certificate**
2. **Update `package.json`**:
   ```json
   "mac": {
     "notarize": true,
     "hardenedRuntime": true
   }
   ```
3. **Set Environment Variables**:
   ```bash
   export APPLE_ID="your@email.com"
   export APPLE_ID_PASS="app-specific-password"
   ```

#### Windows Code Signing

1. **Get Code Signing Certificate**
2. **Update `package.json`**:
   ```json
   "win": {
     "certificateFile": "path/to/certificate.p12",
     "certificatePassword": "password"
   }
   ```

### Custom Build Script

Use the custom build script for enhanced control:

```bash
# Run custom build script directly
node scripts/build-release.js [platform]

# Examples:
node scripts/build-release.js mac     # macOS only
node scripts/build-release.js win     # Windows only
node scripts/build-release.js all     # All platforms
```

## 🐛 Troubleshooting

### Common Issues

#### "electron-builder not found"

```bash
npm install electron-builder --save-dev
```

#### "Native dependencies failed to build"

```bash
npm run rebuild
# or
npm install --build-from-source
```

#### "Code signing failed" (macOS)

- Ensure valid Apple Developer certificate
- Check certificate expiration
- Verify entitlements file exists

#### "Windows build fails on macOS/Linux"

```bash
# Install Wine for Windows builds on non-Windows
brew install wine  # macOS
sudo apt install wine  # Ubuntu/Debian
```

### Build Size Optimization

1. **Remove unused dependencies**:

   ```bash
   npm prune --production
   ```

2. **Optimize assets**:

   - Compress images in `assets/`
   - Remove unused fonts/icons

3. **Configure webpack optimization** in `.erb/configs/`

## 📊 Build Performance

### Typical Build Times

- **macOS**: 2-5 minutes
- **Windows**: 1-3 minutes
- **Linux**: 1-2 minutes
- **All platforms**: 5-10 minutes

### Output Sizes

- **macOS DMG**: ~150-200 MB
- **Windows Installer**: ~100-150 MB
- **Linux AppImage**: ~120-170 MB

## 🚀 Distribution

### Release Checklist

- [ ] Update version in `package.json`
- [ ] Test on target platforms
- [ ] Run full build: `npm run build:release`
- [ ] Test installers on clean systems
- [ ] Create release notes
- [ ] Upload to distribution platforms

### Auto-Update Setup

Configure auto-updates by updating `package.json`:

```json
"publish": {
  "provider": "github",
  "owner": "your-username",
  "repo": "trading-app"
}
```

## 📞 Support

For build issues:

1. Check this documentation
2. Review electron-builder docs
3. Check GitHub issues
4. Verify platform-specific requirements

---

**Happy Building!** 🎉
