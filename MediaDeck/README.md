# MediaDeck - Portable Media Library

A portable Windows media library and launcher that runs from a USB flash drive, external HDD, or SSD. No installation required.

## Features

- **Portable First**: Runs directly from removable media without installation
- **Drive Letter Independent**: Works regardless of drive letter (E:, F:, G:, etc.)
- **Media Types Supported**:
  - Videos: MP4, MKV, AVI, MOV, WebM, WMV
  - Manga/Comics: CBZ, CBR, PDF, ZIP
  - Books: EPUB
- **Library Management**: Automatic scanning and organization of media files
- **Dark Mode UI**: Modern, easy-on-the-eyes interface
- **Favorites & Recent**: Track your favorite items and recently opened files
- **External Player Support**: Configure portable players (mpv, SumatraPDF, etc.)
- **SQLite Database**: Fast, reliable library storage
- **No Host PC Traces**: All data stored on the drive itself

## Folder Structure

```
/MediaDeck
  MediaDeck.exe           # Main application
  *.dll                   # Dependencies
  /Data
    settings.json         # App settings
    library.db            # SQLite database
    /Cache
      /Thumbnails         # Thumbnail cache
  /Apps
    /mpv                  # Portable video player (download separately)
    /SumatraPDF           # Portable PDF/CBZ/EPUB reader (download separately)
  /Library
    /Videos               # Your video files
    /Manga                # Your manga/comic archives
    /Books                # Your EPUB books
```

## Requirements

### To Build
- Windows 10/11
- .NET 8 SDK (https://dotnet.microsoft.com/download/dotnet/8.0)

### To Run (on any Windows PC)
- Windows 10/11 (no .NET installation needed - self-contained)
- Optional: Portable players in the Apps folder:
  - mpv (for videos): https://mpv.io/installation/
  - SumatraPDF (for manga/EPUBs): https://www.sumatrapdfreader.org/free-pdf-reader.html

## Building from Source

### Option 1: Using the Build Script (Recommended)

1. Open Command Prompt or PowerShell
2. Navigate to the MediaDeck folder
3. Run:
   ```batch
   build.bat
   ```
4. Find the built files in `publish\win-x64\`

### Option 2: Manual Build Commands

```batch
# Restore dependencies
dotnet restore

# Build
dotnet build -c Release

# Publish as portable self-contained app
dotnet publish -c Release -r win-x64 --self-contained true -p:PublishSingleFile=false -o publish\win-x64
```

## Deploying to USB Drive

1. Build the application using the steps above
2. Copy ALL files from `publish\win-x64\` to your USB drive
3. Create the following folders on the USB drive:
   - `Apps/mpv` - Download mpv-portable and extract here
   - `Apps/SumatraPDF` - Download SumatraPDF-portable and extract here
   - `Library/Videos` - Add your video files
   - `Library/Manga` - Add your manga/comic archives
   - `Library/Books` - Add your EPUB books
4. Run `MediaDeck.exe` from the USB drive

### Downloading Portable Players

**mpv (Video Player)**
1. Go to https://sourceforge.net/projects/mpv-player-windows/files/
2. Download `mpv-dev-x86_64.zip` (or the latest version)
3. Extract to `Apps/mpv/` on your USB drive

**SumatraPDF (Manga/EPUB Reader)**
1. Go to https://www.sumatrapdfreader.org/download-free-pdf-viewer
2. Download the portable version
3. Extract to `Apps/SumatraPDF/` on your USB drive

## Usage

1. Plug in your USB drive
2. Run `MediaDeck.exe`
3. The app will automatically scan the Library folders
4. Browse your media by type or use the search function
5. Double-click an item to open it with the configured player
6. Right-click to add/remove from favorites

## Settings

Access the Settings tab to:
- Change theme (Dark/Light)
- Configure portable app paths
- Rescan the library
- Clear thumbnail cache
- Backup the library database

## How Portability Works

MediaDeck uses relative paths instead of absolute paths. For example:

- **Stored in database**: `Library/Videos/movie.mp4`
- **Resolved at runtime**: `[CurrentDrive]:\MediaDeck\Library\Videos\movie.mp4`

This means if you plug the drive into different computers (where it might be E:, F:, or G:), MediaDeck will still find all your files correctly.

All settings and the library database are stored in the `Data` folder on the same drive, so nothing is written to the host PC.

## GitHub Actions CI/CD

This project includes a GitHub Actions workflow that automatically builds MediaDeck on every push:

1. Push code to GitHub
2. GitHub Actions builds the app
3. Download artifacts from the Actions tab
4. Or create a release tag to generate a release with downloadable assets

## Troubleshooting

**"Player not found" error**
- Make sure the portable player executable exists at the configured path
- Default paths are relative to MediaDeck.exe: `Apps/mpv/mpv.exe`, `Apps/SumatraPDF/SumatraPDF.exe`

**No media showing up**
- Ensure files are in the correct Library subfolders
- Click "Rescan Library" in Settings
- Check that file extensions match supported formats

**Build fails**
- Ensure .NET 8 SDK is installed
- Run `dotnet --version` to verify
- Try `dotnet clean` then rebuild

## License

MIT License - Feel free to modify and distribute.

## Version History

- **1.0.0** - Initial MVP release
  - Basic library management
  - Video, Manga, and EPUB support
  - Dark mode UI
  - Portable path handling
  - SQLite database storage
  - Favorites and Recently Opened tracking
