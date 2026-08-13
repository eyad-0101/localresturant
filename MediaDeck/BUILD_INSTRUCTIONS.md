# =====================================================
# MediaDeck - Step-by-Step Build Instructions
# =====================================================

This document provides detailed instructions for building MediaDeck.exe.

## Prerequisites

1. **Windows 10 or Windows 11** (required for WPF)
2. **.NET 8 SDK** - Download from: https://dotnet.microsoft.com/download/dotnet/8.0
   - Choose "SDK" (not just Runtime)
   - Select x64 version for most systems

## Verify Installation

Open Command Prompt and run:
```batch
dotnet --version
```

You should see something like `8.0.x`. If you get an error, .NET is not installed correctly.

## Method 1: Using the Build Script (Easiest)

1. Open File Explorer and navigate to the MediaDeck folder
2. Double-click `build.bat`
3. Wait for the build to complete (may take a few minutes on first run)
4. Find the built files in `publish\win-x64\`

The script will:
- Restore NuGet packages
- Build the application
- Publish as a self-contained portable app
- Create a USB deployment structure

## Method 2: Manual Build Commands

Open Command Prompt in the MediaDeck folder and run:

### Step 1: Restore Dependencies
```batch
dotnet restore
```

### Step 2: Build
```batch
dotnet build -c Release
```

### Step 3: Publish as Portable App
```batch
dotnet publish -c Release -r win-x64 --self-contained true -p:PublishSingleFile=false -o publish\win-x64
```

## Output Files

After building, you'll find these files in `publish\win-x64\`:
- `MediaDeck.exe` - Main application
- `*.dll` - Required libraries
- `*.runtimeconfig.json` - Runtime configuration

Total size: approximately 70-80 MB (includes .NET runtime)

## Deploying to USB Drive

### Option A: Using the build.bat output
1. The script creates `publish\usb-deploy\` with the folder structure
2. Copy everything from `publish\usb-deploy\` to your USB drive

### Option B: Manual setup
1. Format your USB drive (NTFS recommended for large files)
2. Create a folder named `MediaDeck` on the USB drive
3. Copy ALL files from `publish\win-x64\` to `MediaDeck\`
4. Create these folders on the USB drive:
   ```
   /Apps/mpv/
   /Apps/SumatraPDF/
   /Library/Videos/
   /Library/Manga/
   /Library/Books/
   /Data/Cache/Thumbnails/
   ```

5. Download portable players:
   - **mpv**: https://sourceforge.net/projects/mpv-player-windows/files/
     - Extract to `Apps/mpv/`
   
   - **SumatraPDF**: https://www.sumatrapdfreader.org/download-free-pdf-viewer
     - Extract portable version to `Apps/SumatraPDF/`

6. Add your media files to the Library folders

## Testing Locally

Before copying to USB, test locally:
```batch
publish\win-x64\MediaDeck.exe
```

The app should launch and show the main window.

## Troubleshooting

### Build Error: "dotnet is not recognized"
- .NET SDK is not installed or not in PATH
- Reinstall .NET 8 SDK from Microsoft's website
- Restart Command Prompt after installation

### Build Error: "NuGet restore failed"
- Check internet connection
- Run: `dotnet nuget locals all --clear`
- Try: `dotnet restore --force`

### Build Error: "Reference assemblies not found"
- Ensure you have .NET 8 SDK (not just Runtime)
- Run: `dotnet workload install desktop-build`

### App Won't Start
- Make sure all DLL files are copied with MediaDeck.exe
- Check Windows Defender isn't blocking the app
- Try running as Administrator once

### "Player not found" when opening media
- Verify portable player exists at configured path
- Default: `Apps/mpv/mpv.exe` and `Apps/SumatraPDF/SumatraPDF.exe`
- Update paths in Settings tab if needed

## GitHub Actions (Automatic Builds)

If you push this code to GitHub:
1. Go to repository Settings > Actions > General
2. Enable GitHub Actions
3. Push code to main branch
4. Go to Actions tab to see build progress
5. Download artifacts from workflow runs

To create a release:
```batch
git tag v1.0.0
git push origin v1.0.0
```

This triggers the release build in GitHub Actions.

## File Size Optimization (Optional)

For smaller distribution size, you can use single-file publish:
```batch
dotnet publish -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -o publish\single-file
```

Note: Single-file may have slightly longer startup time.

## Next Steps

1. Build the application
2. Test locally
3. Copy to USB drive
4. Add portable players
5. Add media files to Library folders
6. Run MediaDeck.exe from USB drive
7. Configure settings as needed

Enjoy your portable media library!
