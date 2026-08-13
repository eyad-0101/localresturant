@echo off
REM MediaDeck Build Script for Windows
REM This script builds the MediaDeck application as a portable self-contained app

echo ========================================
echo MediaDeck Build Script
echo ========================================
echo.

REM Check if .NET SDK is installed
dotnet --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: .NET SDK is not installed or not in PATH
    echo Please install .NET 8 SDK from: https://dotnet.microsoft.com/download/dotnet/8.0
    pause
    exit /b 1
)

echo [1/4] Restoring NuGet packages...
dotnet restore
if %errorlevel% neq 0 (
    echo ERROR: Failed to restore packages
    pause
    exit /b 1
)

echo.
echo [2/4] Building the application...
dotnet build -c Release
if %errorlevel% neq 0 (
    echo ERROR: Build failed
    pause
    exit /b 1
)

echo.
echo [3/4] Publishing as portable self-contained app...
echo Output will be in: publish\win-x64\
dotnet publish -c Release -r win-x64 --self-contained true -p:PublishSingleFile=false -o publish\win-x64
if %errorlevel% neq 0 (
    echo ERROR: Publish failed
    pause
    exit /b 1
)

echo.
echo [4/4] Creating folder structure for USB deployment...
mkdir publish\usb-deploy\Apps\mpv 2>nul
mkdir publish\usb-deploy\Apps\SumatraPDF 2>nul
mkdir publish\usb-deploy\Library\Videos 2>nul
mkdir publish\usb-deploy\Library\Manga 2>nul
mkdir publish\usb-deploy\Library\Books 2>nul
mkdir publish\usb-deploy\Data\Cache\Thumbnails 2>nul

echo Copying MediaDeck.exe to USB deploy folder...
copy /Y publish\win-x64\MediaDeck.exe publish\usb-deploy\MediaDeck.exe
copy /Y publish\win-x64\*.dll publish\usb-deploy\ 2>nul
copy /Y publish\win-x64\*.runtimeconfig.json publish\usb-deploy\ 2>nul
copy /Y publish\win-x64\*.deps.json publish\usb-deploy\ 2>nul

echo.
echo ========================================
echo Build Complete!
echo ========================================
echo.
echo Portable app files are in: publish\win-x64\
echo.
echo For USB deployment, copy these files to your USB drive:
echo   - All files from publish\win-x64\ (MediaDeck.exe and dependencies)
echo   - Create an Apps folder with portable players (mpv, SumatraPDF, etc.)
echo   - Create a Library folder with Videos, Manga, and Books subfolders
echo.
echo The ready-to-deploy folder is: publish\usb-deploy\
echo.
echo To test locally, run:
echo   publish\win-x64\MediaDeck.exe
echo.
pause
