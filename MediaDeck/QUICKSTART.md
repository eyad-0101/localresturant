# =====================================================
# MediaDeck - Quick Start Guide
# =====================================================

## For Users (Just Want to Run)

1. Download the built MediaDeck files
2. Copy to USB drive
3. Add portable players to Apps folder
4. Add media to Library folder
5. Run MediaDeck.exe

## For Developers (Want to Build)

### Minimum Requirements
- Windows 10/11
- .NET 8 SDK

### Quick Build (3 commands)
```batch
dotnet restore
dotnet build -c Release
dotnet publish -c Release -r win-x64 --self-contained true -o publish\win-x64
```

Or just run: `build.bat`

### Project Structure
```
MediaDeck/
├── App.xaml                 # Application resources & styles
├── App.xaml.cs              # Application entry point
├── MainWindow.xaml          # Main UI layout
├── MainWindow.xaml.cs       # Main UI logic
├── MediaDeck.csproj         # Project file
│
├── Helpers/
│   └── PortablePathResolver.cs   # Drive letter independent paths
│
├── Models/
│   └── MediaItem.cs              # Data models
│
├── Services/
│   ├── DatabaseService.cs        # SQLite database operations
│   ├── LibraryScanner.cs         # File scanning
│   ├── MediaLauncher.cs          # External player launching
│   └── SettingsService.cs        # JSON settings management
│
├── .github/workflows/
│   └── build.yml                 # GitHub Actions CI/CD
│
├── build.bat                     # Windows build script
├── README.md                     # Full documentation
├── BUILD_INSTRUCTIONS.md         # Detailed build guide
└── LICENSE                       # MIT License
```

### Key Features Implemented

✅ Portable path handling (no drive letter dependencies)
✅ SQLite database for library storage  
✅ JSON settings storage
✅ Library scanner for Videos/Manga/Books
✅ Dark mode WPF UI
✅ Home/Videos/Manga/Books/Favorites/Recent/Settings tabs
✅ Search functionality
✅ Favorite toggle
✅ Recently opened tracking
✅ External player launching
✅ Backup/restore database
✅ Clear cache functionality
✅ Self-contained publish (no .NET required on host)
✅ GitHub Actions CI/CD

### Supported File Types

Videos: .mp4, .mkv, .avi, .mov, .webm, .wmv
Manga:  .cbz, .cbr, .pdf, .zip
Books:  .epub

### Default Settings

Video Player: Apps/mpv/mpv.exe
Manga Reader: Apps/SumatraPDF/SumatraPDF.exe
EPUB Reader: Apps/SumatraPDF/SumatraPDF.exe
Library Root: Library
Theme: dark

### How Portability Works

All paths stored as relative:
  Library/Videos/movie.mp4

Resolved at runtime using app location:
  [AppRoot]/Library/Videos/movie.mp4

Works on any drive letter (E:, F:, G:, etc.)

### Next Steps After Building

1. Test: `publish\win-x64\MediaDeck.exe`
2. Deploy: Copy all files from publish\win-x64\ to USB
3. Add Players: Download mpv and SumatraPDF portable
4. Add Media: Put files in Library subfolders
5. Run: Launch MediaDeck.exe from USB

## Support

See README.md for full documentation and troubleshooting.
