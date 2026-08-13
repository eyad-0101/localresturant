using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Linq;
using MediaDeck.Helpers;
using MediaDeck.Models;
using Microsoft.Data.Sqlite;

namespace MediaDeck.Services
{
    /// <summary>
    /// Service for managing the SQLite database of media items.
    /// </summary>
    public class DatabaseService : IDisposable
    {
        private readonly string _dbPath;
        private SqliteConnection _connection;

        public DatabaseService()
        {
            _dbPath = Path.Combine(PortablePathResolver.DataRoot, "library.db");
            _connection = new SqliteConnection($"Data Source={_dbPath}");
            InitializeDatabase();
        }

        /// <summary>
        /// Initializes the database schema if it doesn't exist.
        /// </summary>
        private void InitializeDatabase()
        {
            _connection.Open();
            
            var command = _connection.CreateCommand();
            command.CommandText = @"
                CREATE TABLE IF NOT EXISTS MediaItems (
                    Id INTEGER PRIMARY KEY AUTOINCREMENT,
                    Type INTEGER NOT NULL,
                    Title TEXT NOT NULL,
                    RelativePath TEXT NOT NULL UNIQUE,
                    CoverPath TEXT,
                    Tags TEXT,
                    IsFavorite INTEGER DEFAULT 0,
                    DateAdded TEXT NOT NULL,
                    LastOpened TEXT,
                    Status INTEGER DEFAULT 0,
                    Rating REAL DEFAULT 0,
                    ProgressPercent REAL DEFAULT 0,
                    LastPageNumber INTEGER,
                    LastTimestampSeconds REAL
                );

                CREATE INDEX IF NOT EXISTS IX_MediaItems_Type ON MediaItems(Type);
                CREATE INDEX IF NOT EXISTS IX_MediaItems_Favorite ON MediaItems(IsFavorite);
                CREATE INDEX IF NOT EXISTS IX_MediaItems_LastOpened ON MediaItems(LastOpened);
            ";
            command.ExecuteNonQuery();
            _connection.Close();
        }

        /// <summary>
        /// Gets or creates a connection to the database.
        /// </summary>
        private SqliteConnection GetConnection()
        {
            if (_connection.State != ConnectionState.Open)
            {
                _connection.Open();
            }
            return _connection;
        }

        /// <summary>
        /// Adds or updates a media item in the database.
        /// </summary>
        public int SaveMediaItem(MediaItem item)
        {
            var conn = GetConnection();
            var command = conn.CreateCommand();
            
            if (item.Id == 0)
            {
                // Insert new item
                command.CommandText = @"
                    INSERT INTO MediaItems (Type, Title, RelativePath, CoverPath, Tags, IsFavorite, DateAdded, LastOpened, Status, Rating, ProgressPercent, LastPageNumber, LastTimestampSeconds)
                    VALUES (@Type, @Title, @RelativePath, @CoverPath, @Tags, @IsFavorite, @DateAdded, @LastOpened, @Status, @Rating, @ProgressPercent, @LastPageNumber, @LastTimestampSeconds);
                    SELECT last_insert_rowid();
                ";
            }
            else
            {
                // Update existing item
                command.CommandText = @"
                    UPDATE MediaItems SET
                        Type = @Type,
                        Title = @Title,
                        RelativePath = @RelativePath,
                        CoverPath = @CoverPath,
                        Tags = @Tags,
                        IsFavorite = @IsFavorite,
                        DateAdded = @DateAdded,
                        LastOpened = @LastOpened,
                        Status = @Status,
                        Rating = @Rating,
                        ProgressPercent = @ProgressPercent,
                        LastPageNumber = @LastPageNumber,
                        LastTimestampSeconds = @LastTimestampSeconds
                    WHERE Id = @Id;
                    SELECT @Id;
                ";
                command.Parameters.AddWithValue("@Id", item.Id);
            }

            command.Parameters.AddWithValue("@Type", (int)item.Type);
            command.Parameters.AddWithValue("@Title", item.Title);
            command.Parameters.AddWithValue("@RelativePath", item.RelativePath);
            command.Parameters.AddWithValue("@CoverPath", (object?)item.CoverPath ?? DBNull.Value);
            command.Parameters.AddWithValue("@Tags", (object?)item.Tags ?? DBNull.Value);
            command.Parameters.AddWithValue("@IsFavorite", item.IsFavorite ? 1 : 0);
            command.Parameters.AddWithValue("@DateAdded", item.DateAdded.ToString("o"));
            command.Parameters.AddWithValue("@LastOpened", (object?)item.LastOpened?.ToString("o") ?? DBNull.Value);
            command.Parameters.AddWithValue("@Status", item.Status);
            command.Parameters.AddWithValue("@Rating", item.Rating);
            command.Parameters.AddWithValue("@ProgressPercent", item.ProgressPercent);
            command.Parameters.AddWithValue("@LastPageNumber", (object?)item.LastPageNumber ?? DBNull.Value);
            command.Parameters.AddWithValue("@LastTimestampSeconds", (object?)item.LastTimestampSeconds ?? DBNull.Value);

            var result = command.ExecuteScalar();
            return Convert.ToInt32(result);
        }

        /// <summary>
        /// Gets all media items from the database.
        /// </summary>
        public List<MediaItem> GetAllMediaItems()
        {
            var conn = GetConnection();
            var command = conn.CreateCommand();
            command.CommandText = "SELECT * FROM MediaItems ORDER BY DateAdded DESC";
            
            var items = new List<MediaItem>();
            using (var reader = command.ExecuteReader())
            {
                while (reader.Read())
                {
                    items.Add(MapReaderToMediaItem(reader));
                }
            }
            return items;
        }

        /// <summary>
        /// Gets media items filtered by type.
        /// </summary>
        public List<MediaItem> GetMediaItemsByType(MediaType type)
        {
            var conn = GetConnection();
            var command = conn.CreateCommand();
            command.CommandText = "SELECT * FROM MediaItems WHERE Type = @Type ORDER BY Title ASC";
            command.Parameters.AddWithValue("@Type", (int)type);
            
            var items = new List<MediaItem>();
            using (var reader = command.ExecuteReader())
            {
                while (reader.Read())
                {
                    items.Add(MapReaderToMediaItem(reader));
                }
            }
            return items;
        }

        /// <summary>
        /// Gets favorite media items.
        /// </summary>
        public List<MediaItem> GetFavoriteItems()
        {
            var conn = GetConnection();
            var command = conn.CreateCommand();
            command.CommandText = "SELECT * FROM MediaItems WHERE IsFavorite = 1 ORDER BY Title ASC";
            
            var items = new List<MediaItem>();
            using (var reader = command.ExecuteReader())
            {
                while (reader.Read())
                {
                    items.Add(MapReaderToMediaItem(reader));
                }
            }
            return items;
        }

        /// <summary>
        /// Gets recently opened media items.
        /// </summary>
        public List<MediaItem> GetRecentlyOpened(int count = 10)
        {
            var conn = GetConnection();
            var command = conn.CreateCommand();
            command.CommandText = @"
                SELECT * FROM MediaItems 
                WHERE LastOpened IS NOT NULL 
                ORDER BY LastOpened DESC 
                LIMIT @Count";
            command.Parameters.AddWithValue("@Count", count);
            
            var items = new List<MediaItem>();
            using (var reader = command.ExecuteReader())
            {
                while (reader.Read())
                {
                    items.Add(MapReaderToMediaItem(reader));
                }
            }
            return items;
        }

        /// <summary>
        /// Gets items with progress (for "Continue Watching/Reading").
        /// </summary>
        public List<MediaItem> GetItemsWithProgress()
        {
            var conn = GetConnection();
            var command = conn.CreateCommand();
            command.CommandText = @"
                SELECT * FROM MediaItems 
                WHERE ProgressPercent > 0 AND ProgressPercent < 100
                ORDER BY LastOpened DESC";
            
            var items = new List<MediaItem>();
            using (var reader = command.ExecuteReader())
            {
                while (reader.Read())
                {
                    items.Add(MapReaderToMediaItem(reader));
                }
            }
            return items;
        }

        /// <summary>
        /// Updates the last opened timestamp for a media item.
        /// </summary>
        public void UpdateLastOpened(int itemId)
        {
            var conn = GetConnection();
            var command = conn.CreateCommand();
            command.CommandText = @"
                UPDATE MediaItems 
                SET LastOpened = @LastOpened 
                WHERE Id = @Id";
            command.Parameters.AddWithValue("@Id", itemId);
            command.Parameters.AddWithValue("@LastOpened", DateTime.Now.ToString("o"));
            command.ExecuteNonQuery();
        }

        /// <summary>
        /// Toggles the favorite status of a media item.
        /// </summary>
        public void ToggleFavorite(int itemId)
        {
            var conn = GetConnection();
            var command = conn.CreateCommand();
            command.CommandText = @"
                UPDATE MediaItems 
                SET IsFavorite = NOT IsFavorite 
                WHERE Id = @Id";
            command.Parameters.AddWithValue("@Id", itemId);
            command.ExecuteNonQuery();
        }

        /// <summary>
        /// Deletes a media item from the database.
        /// </summary>
        public void DeleteMediaItem(int itemId)
        {
            var conn = GetConnection();
            var command = conn.CreateCommand();
            command.CommandText = "DELETE FROM MediaItems WHERE Id = @Id";
            command.Parameters.AddWithValue("@Id", itemId);
            command.ExecuteNonQuery();
        }

        /// <summary>
        /// Searches for media items by title.
        /// </summary>
        public List<MediaItem> SearchByTitle(string query)
        {
            var conn = GetConnection();
            var command = conn.CreateCommand();
            command.CommandText = @"
                SELECT * FROM MediaItems 
                WHERE Title LIKE @Query 
                ORDER BY Title ASC";
            command.Parameters.AddWithValue("@Query", $"%{query}%");
            
            var items = new List<MediaItem>();
            using (var reader = command.ExecuteReader())
            {
                while (reader.Read())
                {
                    items.Add(MapReaderToMediaItem(reader));
                }
            }
            return items;
        }

        /// <summary>
        /// Checks if a media item exists by its relative path.
        /// </summary>
        public bool ExistsByPath(string relativePath)
        {
            var conn = GetConnection();
            var command = conn.CreateCommand();
            command.CommandText = "SELECT COUNT(*) FROM MediaItems WHERE RelativePath = @RelativePath";
            command.Parameters.AddWithValue("@RelativePath", relativePath);
            var result = command.ExecuteScalar();
            return Convert.ToInt64(result) > 0;
        }

        /// <summary>
        /// Maps a database row to a MediaItem object.
        /// </summary>
        private MediaItem MapReaderToMediaItem(IDataRecord reader)
        {
            return new MediaItem
            {
                Id = Convert.ToInt32(reader["Id"]),
                Type = (MediaType)Convert.ToInt32(reader["Type"]),
                Title = reader["Title"].ToString()!,
                RelativePath = reader["RelativePath"].ToString()!,
                CoverPath = reader["CoverPath"] as string,
                Tags = reader["Tags"] as string,
                IsFavorite = Convert.ToBoolean(reader["IsFavorite"]),
                DateAdded = DateTime.Parse(reader["DateAdded"].ToString()!),
                LastOpened = reader["LastOpened"] != DBNull.Value ? DateTime.Parse(reader["LastOpened"].ToString()!) : null,
                Status = Convert.ToInt32(reader["Status"]),
                Rating = Convert.ToDouble(reader["Rating"]),
                ProgressPercent = Convert.ToDouble(reader["ProgressPercent"]),
                LastPageNumber = reader["LastPageNumber"] != DBNull.Value ? Convert.ToInt32(reader["LastPageNumber"]) : null,
                LastTimestampSeconds = reader["LastTimestampSeconds"] != DBNull.Value ? Convert.ToDouble(reader["LastTimestampSeconds"]) : null
            };
        }

        public void Dispose()
        {
            _connection?.Close();
            _connection?.Dispose();
        }
    }
}
