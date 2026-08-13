using System;
using System.IO;
using System.Reflection;

namespace MediaDeck.Helpers
{
    /// <summary>
    /// Handles portable path resolution for running from USB/external drives.
    /// All paths are stored relative to the application root, not absolute paths.
    /// </summary>
    public static class PortablePathResolver
    {
        private static string? _appRoot;
        private static string? _dataRoot;

        /// <summary>
        /// Gets the root directory where MediaDeck.exe is located.
        /// This is the base for all relative path resolution.
        /// </summary>
        public static string AppRoot
        {
            get
            {
                if (_appRoot == null)
                {
                    var location = Assembly.GetExecutingAssembly().Location;
                    _appRoot = Path.GetDirectoryName(location) ?? Environment.CurrentDirectory;
                }
                return _appRoot;
            }
        }

        /// <summary>
        /// Gets the data directory where settings, database, and cache are stored.
        /// Defaults to [AppRoot]/Data
        /// </summary>
        public static string DataRoot
        {
            get
            {
                if (_dataRoot == null)
                {
                    _dataRoot = Path.Combine(AppRoot, "Data");
                    if (!Directory.Exists(_dataRoot))
                    {
                        Directory.CreateDirectory(_dataRoot);
                    }
                }
                return _dataRoot;
            }
        }

        /// <summary>
        /// Gets the cache directory for thumbnails.
        /// Defaults to [AppRoot]/Data/Cache/Thumbnails
        /// </summary>
        public static string CacheRoot => Path.Combine(DataRoot, "Cache", "Thumbnails");

        /// <summary>
        /// Resolves a relative path to an absolute path based on current app location.
        /// Example: "Library/Videos/movie.mp4" -> "E:\MediaDeck\Library\Videos\movie.mp4"
        /// </summary>
        public static string ResolveRelativePath(string relativePath)
        {
            if (string.IsNullOrEmpty(relativePath))
                return string.Empty;

            // Normalize path separators
            relativePath = relativePath.Replace('/', Path.DirectorySeparatorChar)
                                       .Replace('\\', Path.DirectorySeparatorChar);

            // If already absolute, return as-is
            if (Path.IsPathRooted(relativePath))
                return relativePath;

            return Path.GetFullPath(Path.Combine(AppRoot, relativePath));
        }

        /// <summary>
        /// Converts an absolute path to a relative path from the app root.
        /// Example: "E:\MediaDeck\Library\Videos\movie.mp4" -> "Library/Videos/movie.mp4"
        /// </summary>
        public static string ToRelativePath(string absolutePath)
        {
            if (string.IsNullOrEmpty(absolutePath))
                return string.Empty;

            if (!absolutePath.StartsWith(AppRoot, StringComparison.OrdinalIgnoreCase))
                return absolutePath; // Not under app root, return as-is

            var relative = absolutePath.Substring(AppRoot.Length).TrimStart(Path.DirectorySeparatorChar);
            return relative.Replace('\\', '/');
        }

        /// <summary>
        /// Ensures a directory exists at the given relative path.
        /// </summary>
        public static void EnsureDirectoryExists(string relativePath)
        {
            var fullPath = ResolveRelativePath(relativePath);
            if (!Directory.Exists(fullPath))
            {
                Directory.CreateDirectory(fullPath);
            }
        }

        /// <summary>
        /// Gets the parent directory of the app root (useful for finding Library folder).
        /// </summary>
        public static string GetParentDirectory()
        {
            var parent = Directory.GetParent(AppRoot);
            return parent?.FullName ?? AppRoot;
        }
    }
}
