using System;
using System.Diagnostics;
using MediaDeck.Models;

namespace MediaDeck.Services
{
    /// <summary>
    /// Service for launching external portable applications to open media files.
    /// </summary>
    public class MediaLauncher
    {
        private readonly SettingsService _settingsService;

        public MediaLauncher(SettingsService settingsService)
        {
            _settingsService = settingsService;
        }

        /// <summary>
        /// Opens a media item with the configured external application.
        /// </summary>
        public bool OpenMedia(MediaItem item, LibraryScanner scanner)
        {
            var settings = _settingsService.LoadSettings();
            var absolutePath = scanner.GetAbsolutePath(item);

            if (!System.IO.File.Exists(absolutePath))
            {
                Console.WriteLine($"File not found: {absolutePath}");
                return false;
            }

            string? playerPath = null;

            switch (item.Type)
            {
                case MediaType.Video:
                    playerPath = settings.Apps.VideoPlayer;
                    break;
                case MediaType.Manga:
                    playerPath = settings.Apps.MangaReader;
                    break;
                case MediaType.Book:
                    playerPath = settings.Apps.EpubReader;
                    break;
            }

            if (string.IsNullOrEmpty(playerPath))
            {
                Console.WriteLine("No player configured for this media type.");
                return false;
            }

            var fullPlayerPath = _settingsService.GetPortableAppPath(playerPath);

            if (!System.IO.File.Exists(fullPlayerPath))
            {
                Console.WriteLine($"Player not found: {fullPlayerPath}");
                Console.WriteLine("Please ensure the portable player is installed in the Apps folder.");
                return false;
            }

            try
            {
                var startInfo = new ProcessStartInfo
                {
                    FileName = fullPlayerPath,
                    Arguments = $"\"{absolutePath}\"",
                    UseShellExecute = true,
                    WorkingDirectory = System.IO.Path.GetDirectoryName(fullPlayerPath) ?? Environment.CurrentDirectory
                };

                Process.Start(startInfo);
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error launching player: {ex.Message}");
                return false;
            }
        }

        /// <summary>
        /// Opens a file with the system default application.
        /// </summary>
        public bool OpenWithSystem(string filePath)
        {
            try
            {
                var startInfo = new ProcessStartInfo
                {
                    FileName = filePath,
                    UseShellExecute = true
                };

                Process.Start(startInfo);
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error opening file: {ex.Message}");
                return false;
            }
        }
    }
}
