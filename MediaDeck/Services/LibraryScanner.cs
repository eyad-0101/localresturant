using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using MediaDeck.Helpers;
using MediaDeck.Models;

namespace MediaDeck.Services
{
    /// <summary>
    /// Service for scanning library folders and detecting media files.
    /// </summary>
    public class LibraryScanner
    {
        private readonly SettingsService _settingsService;

        public LibraryScanner(SettingsService settingsService)
        {
            _settingsService = settingsService;
        }

        /// <summary>
        /// Scans the library folders and returns detected media items.
        /// </summary>
        public List<MediaItem> ScanLibrary()
        {
            var settings = _settingsService.LoadSettings();
            var libraryRoot = PortablePathResolver.ResolveRelativePath(settings.LibraryRoot);
            var items = new List<MediaItem>();

            if (!Directory.Exists(libraryRoot))
            {
                // Create default library structure
                PortablePathResolver.EnsureDirectoryExists("Library/Videos");
                PortablePathResolver.EnsureDirectoryExists("Library/Manga");
                PortablePathResolver.EnsureDirectoryExists("Library/Books");
                return items;
            }

            // Scan Videos
            var videosPath = Path.Combine(libraryRoot, "Videos");
            if (Directory.Exists(videosPath))
            {
                items.AddRange(ScanFolder(videosPath, MediaType.Video, settings.SupportedVideoExtensions));
            }

            // Scan Manga
            var mangaPath = Path.Combine(libraryRoot, "Manga");
            if (Directory.Exists(mangaPath))
            {
                items.AddRange(ScanFolder(mangaPath, MediaType.Manga, settings.SupportedMangaExtensions));
            }

            // Scan Books
            var booksPath = Path.Combine(libraryRoot, "Books");
            if (Directory.Exists(booksPath))
            {
                items.AddRange(ScanFolder(booksPath, MediaType.Book, settings.SupportedBookExtensions));
            }

            return items;
        }

        /// <summary>
        /// Scans a single folder recursively for media files.
        /// </summary>
        private List<MediaItem> ScanFolder(string folderPath, MediaType type, List<string> extensions)
        {
            var items = new List<MediaItem>();
            
            try
            {
                var files = Directory.EnumerateFiles(folderPath, "*.*", SearchOption.AllDirectories)
                    .Where(f => extensions.Contains(Path.GetExtension(f).ToLowerInvariant()));

                foreach (var file in files)
                {
                    var relativePath = PortablePathResolver.ToRelativePath(file);
                    var title = Path.GetFileNameWithoutExtension(file);
                    
                    // Try to extract series name from folder structure
                    var directory = Path.GetDirectoryName(file);
                    if (!string.IsNullOrEmpty(directory))
                    {
                        var parentFolder = Path.GetFileName(directory);
                        if (!string.IsNullOrEmpty(parentFolder) && parentFolder != type.ToString() + "s")
                        {
                            title = $"{parentFolder} - {Path.GetFileNameWithoutExtension(file)}";
                        }
                    }

                    items.Add(new MediaItem
                    {
                        Type = type,
                        Title = title,
                        RelativePath = relativePath,
                        DateAdded = DateTime.Now,
                        CoverPath = null // Could be generated later
                    });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error scanning {folderPath}: {ex.Message}");
            }

            return items;
        }

        /// <summary>
        /// Checks if a file still exists at the stored relative path.
        /// </summary>
        public bool FileExists(MediaItem item)
        {
            var fullPath = PortablePathResolver.ResolveRelativePath(item.RelativePath);
            return File.Exists(fullPath);
        }

        /// <summary>
        /// Gets the absolute path for a media item.
        /// </summary>
        public string GetAbsolutePath(MediaItem item)
        {
            return PortablePathResolver.ResolveRelativePath(item.RelativePath);
        }
    }
}
