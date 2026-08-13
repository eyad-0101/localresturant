using System;
using System.Collections.Generic;
using System.IO;
using MediaDeck.Helpers;
using MediaDeck.Models;

namespace MediaDeck.Services
{
    /// <summary>
    /// Service for loading and saving application settings.
    /// </summary>
    public class SettingsService
    {
        private readonly string _settingsPath;

        public SettingsService()
        {
            _settingsPath = Path.Combine(PortablePathResolver.DataRoot, "settings.json");
        }

        /// <summary>
        /// Loads application settings from JSON file.
        /// Creates default settings if file doesn't exist.
        /// </summary>
        public AppSettings LoadSettings()
        {
            try
            {
                if (File.Exists(_settingsPath))
                {
                    var json = File.ReadAllText(_settingsPath);
                    var settings = Newtonsoft.Json.JsonConvert.DeserializeObject<AppSettings>(json);
                    return settings ?? new AppSettings();
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error loading settings: {ex.Message}");
            }

            var defaultSettings = new AppSettings();
            SaveSettings(defaultSettings);
            return defaultSettings;
        }

        /// <summary>
        /// Saves application settings to JSON file.
        /// </summary>
        public void SaveSettings(AppSettings settings)
        {
            try
            {
                var json = Newtonsoft.Json.JsonConvert.SerializeObject(settings, Newtonsoft.Json.Formatting.Indented);
                File.WriteAllText(_settingsPath, json);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error saving settings: {ex.Message}");
            }
        }

        /// <summary>
        /// Gets the absolute path for a portable app executable.
        /// </summary>
        public string GetPortableAppPath(string relativePath)
        {
            return PortablePathResolver.ResolveRelativePath(relativePath);
        }

        /// <summary>
        /// Checks if a portable app exists at the configured path.
        /// </summary>
        public bool IsPortableAppAvailable(string relativePath)
        {
            var fullPath = GetPortableAppPath(relativePath);
            return File.Exists(fullPath);
        }
    }
}
