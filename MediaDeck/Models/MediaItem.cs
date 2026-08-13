namespace MediaDeck.Models
{
    /// <summary>
    /// Represents the type of media item.
    /// </summary>
    public enum MediaType
    {
        Video,
        Manga,
        Book
    }

    /// <summary>
    /// Represents a media item in the library (video, manga, or book).
    /// </summary>
    public class MediaItem
    {
        public int Id { get; set; }
        public MediaType Type { get; set; }
        public string Title { get; set; } = string.Empty;
        public string RelativePath { get; set; } = string.Empty;
        public string? CoverPath { get; set; }
        public string? Tags { get; set; }
        public bool IsFavorite { get; set; }
        public DateTime DateAdded { get; set; }
        public DateTime? LastOpened { get; set; }
        public int Status { get; set; } // 0=New, 1=InProgress, 2=Completed
        public double Rating { get; set; } // 0-5
        public double ProgressPercent { get; set; } // 0-100
        public int? LastPageNumber { get; set; }
        public double? LastTimestampSeconds { get; set; }
    }

    /// <summary>
    /// Application settings stored in JSON format.
    /// </summary>
    public class AppSettings
    {
        public string Theme { get; set; } = "dark";
        public string LibraryRoot { get; set; } = "Library";
        public PortableAppsConfig Apps { get; set; } = new PortableAppsConfig();
        public List<string> SupportedVideoExtensions { get; set; } = new()
        {
            ".mp4", ".mkv", ".avi", ".mov", ".webm", ".wmv"
        };
        public List<string> SupportedMangaExtensions { get; set; } = new()
        {
            ".cbz", ".cbr", ".pdf", ".zip"
        };
        public List<string> SupportedBookExtensions { get; set; } = new()
        {
            ".epub"
        };
    }

    /// <summary>
    /// Configuration for portable external apps (players/readers).
    /// </summary>
    public class PortableAppsConfig
    {
        public string VideoPlayer { get; set; } = "Apps/mpv/mpv.exe";
        public string MangaReader { get; set; } = "Apps/SumatraPDF/SumatraPDF.exe";
        public string EpubReader { get; set; } = "Apps/SumatraPDF/SumatraPDF.exe";
    }
}
