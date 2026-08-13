using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using MediaDeck.Helpers;
using MediaDeck.Models;
using MediaDeck.Services;

namespace MediaDeck
{
    /// <summary>
    /// Main window code-behind for MediaDeck application.
    /// </summary>
    public partial class MainWindow : Window
    {
        private readonly SettingsService _settingsService;
        private readonly DatabaseService _databaseService;
        private readonly LibraryScanner _libraryScanner;
        private readonly MediaLauncher _mediaLauncher;
        private List<MediaItem> _allItems = new();
        private bool _isSearchFocused = false;

        public MainWindow()
        {
            InitializeComponent();

            // Initialize services
            _settingsService = new SettingsService();
            _databaseService = new DatabaseService();
            _libraryScanner = new LibraryScanner(_settingsService);
            _mediaLauncher = new MediaLauncher(_settingsService);

            // Load library and UI
            LoadLibrary();
            RefreshUI();
        }

        /// <summary>
        /// Scans the library and syncs with database.
        /// </summary>
        private void LoadLibrary()
        {
            try
            {
                var scannedItems = _libraryScanner.ScanLibrary();
                
                foreach (var item in scannedItems)
                {
                    if (!_databaseService.ExistsByPath(item.RelativePath))
                    {
                        _databaseService.SaveMediaItem(item);
                    }
                }

                _allItems = _databaseService.GetAllMediaItems();
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Error loading library: {ex.Message}", "Error", MessageBoxButton.OK, MessageBoxImage.Warning);
            }
        }

        /// <summary>
        /// Refreshes all UI elements with current data.
        /// </summary>
        private void RefreshUI()
        {
            RefreshHome();
            RefreshVideos();
            RefreshManga();
            RefreshBooks();
            RefreshFavorites();
            RefreshRecent();
            RefreshSettings();
        }

        /// <summary>
        /// Refreshes the Home tab with sections.
        /// </summary>
        private void RefreshHome()
        {
            HomeContent.Children.Clear();

            // Continue Watching/Reading section
            var continueItems = _databaseService.GetItemsWithProgress().Take(5).ToList();
            if (continueItems.Any())
            {
                HomeContent.Children.Add(CreateSectionHeader("Continue Watching/Reading"));
                HomeContent.Children.Add(CreateMediaGrid(continueItems));
                HomeContent.Children.Add(new Separator { Margin = new Thickness(0, 15, 0, 15), Background = Brushes.Gray });
            }

            // Recently Added section
            var recentAdded = _allItems.OrderByDescending(x => x.DateAdded).Take(5).ToList();
            if (recentAdded.Any())
            {
                HomeContent.Children.Add(CreateSectionHeader("Recently Added"));
                HomeContent.Children.Add(CreateMediaGrid(recentAdded));
                HomeContent.Children.Add(new Separator { Margin = new Thickness(0, 15, 0, 15), Background = Brushes.Gray });
            }

            // Favorites section
            var favorites = _databaseService.GetFavoriteItems().Take(5).ToList();
            if (favorites.Any())
            {
                HomeContent.Children.Add(CreateSectionHeader("Favorites"));
                HomeContent.Children.Add(CreateMediaGrid(favorites));
            }

            if (!HomeContent.Children.Cast<UIElement>().Any())
            {
                HomeContent.Children.Add(CreatePlaceholderText("No media found. Add files to your Library folder."));
            }
        }

        /// <summary>
        /// Refreshes the Videos tab.
        /// </summary>
        private void RefreshVideos()
        {
            var videos = _databaseService.GetMediaItemsByType(MediaType.Video);
            VideosList.ItemsSource = null;
            VideosList.ItemsSource = CreateMediaCards(videos);
        }

        /// <summary>
        /// Refreshes the Manga tab.
        /// </summary>
        private void RefreshManga()
        {
            var manga = _databaseService.GetMediaItemsByType(MediaType.Manga);
            MangaList.ItemsSource = null;
            MangaList.ItemsSource = CreateMediaCards(manga);
        }

        /// <summary>
        /// Refreshes the Books tab.
        /// </summary>
        private void RefreshBooks()
        {
            var books = _databaseService.GetMediaItemsByType(MediaType.Book);
            BooksList.ItemsSource = null;
            BooksList.ItemsSource = CreateMediaCards(books);
        }

        /// <summary>
        /// Refreshes the Favorites tab.
        /// </summary>
        private void RefreshFavorites()
        {
            var favorites = _databaseService.GetFavoriteItems();
            FavoritesList.ItemsSource = null;
            FavoritesList.ItemsSource = CreateMediaCards(favorites);
        }

        /// <summary>
        /// Refreshes the Recently Opened tab.
        /// </summary>
        private void RefreshRecent()
        {
            var recent = _databaseService.GetRecentlyOpened(20);
            RecentList.ItemsSource = null;
            RecentList.ItemsSource = CreateMediaCards(recent);
        }

        /// <summary>
        /// Refreshes the Settings tab.
        /// </summary>
        private void RefreshSettings()
        {
            SettingsContent.Children.Clear();
            var settings = _settingsService.LoadSettings();

            // Theme setting
            SettingsContent.Children.Add(CreateSettingHeader("Appearance"));
            var themePanel = new StackPanel { Margin = new Thickness(0, 0, 0, 15) };
            themePanel.Children.Add(CreateLabel("Theme:"));
            var themeCombo = new ComboBox
            {
                Width = 200,
                SelectedIndex = settings.Theme == "dark" ? 0 : 1,
                Background = Brushes.White,
                Margin = new Thickness(0, 5, 0, 0)
            };
            themeCombo.Items.Add("Dark");
            themeCombo.Items.Add("Light");
            themeCombo.SelectionChanged += (s, e) =>
            {
                settings.Theme = themeCombo.SelectedIndex == 0 ? "dark" : "light";
                _settingsService.SaveSettings(settings);
            };
            themePanel.Children.Add(themeCombo);
            SettingsContent.Children.Add(themePanel);

            // Video Player setting
            SettingsContent.Children.Add(CreateSettingHeader("Portable Apps"));
            SettingsContent.Children.Add(CreatePathSetting("Video Player:", settings.Apps.VideoPlayer, 
                path => { settings.Apps.VideoPlayer = path; _settingsService.SaveSettings(settings); }));

            // Manga Reader setting
            SettingsContent.Children.Add(CreatePathSetting("Manga Reader:", settings.Apps.MangaReader,
                path => { settings.Apps.MangaReader = path; _settingsService.SaveSettings(settings); }));

            // EPUB Reader setting
            SettingsContent.Children.Add(CreatePathSetting("EPUB Reader:", settings.Apps.EpubReader,
                path => { settings.Apps.EpubReader = path; _settingsService.SaveSettings(settings); }));

            // Library root setting
            SettingsContent.Children.Add(CreateSettingHeader("Library"));
            SettingsContent.Children.Add(CreatePathSetting("Library Root:", settings.LibraryRoot,
                path => { settings.LibraryRoot = path; _settingsService.SaveSettings(settings); }));

            // Actions
            SettingsContent.Children.Add(CreateSettingHeader("Actions"));
            var actionsPanel = new StackPanel { Margin = new Thickness(0, 0, 0, 15) };
            
            var rescanBtn = new Button
            {
                Content = "Rescan Library",
                Style = (Style)FindResource("ModernButton"),
                Margin = new Thickness(0, 0, 0, 10),
                HorizontalAlignment = HorizontalAlignment.Left
            };
            rescanBtn.Click += (s, e) =>
            {
                LoadLibrary();
                RefreshUI();
                MessageBox.Show("Library rescanned successfully!", "Info", MessageBoxButton.OK, MessageBoxImage.Information);
            };
            actionsPanel.Children.Add(rescanBtn);

            var clearCacheBtn = new Button
            {
                Content = "Clear Thumbnail Cache",
                Style = (Style)FindResource("ModernButton"),
                Margin = new Thickness(0, 0, 0, 10),
                HorizontalAlignment = HorizontalAlignment.Left
            };
            clearCacheBtn.Click += (s, e) =>
            {
                try
                {
                    var cacheDir = PortablePathResolver.CacheRoot;
                    if (Directory.Exists(cacheDir))
                    {
                        Directory.Delete(cacheDir, true);
                        Directory.CreateDirectory(cacheDir);
                    }
                    MessageBox.Show("Cache cleared!", "Info", MessageBoxButton.OK, MessageBoxImage.Information);
                }
                catch (Exception ex)
                {
                    MessageBox.Show($"Error clearing cache: {ex.Message}", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
                }
            };
            actionsPanel.Children.Add(clearCacheBtn);

            var backupBtn = new Button
            {
                Content = "Backup Library Database",
                Style = (Style)FindResource("ModernButton"),
                Margin = new Thickness(0, 0, 0, 10),
                HorizontalAlignment = HorizontalAlignment.Left
            };
            backupBtn.Click += (s, e) =>
            {
                try
                {
                    var dbPath = Path.Combine(PortablePathResolver.DataRoot, "library.db");
                    var backupPath = Path.Combine(PortablePathResolver.DataRoot, $"library_backup_{DateTime.Now:yyyyMMdd_HHmmss}.db");
                    File.Copy(dbPath, backupPath, true);
                    MessageBox.Show($"Database backed up to:\n{backupPath}", "Backup Complete", MessageBoxButton.OK, MessageBoxImage.Information);
                }
                catch (Exception ex)
                {
                    MessageBox.Show($"Error creating backup: {ex.Message}", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
                }
            };
            actionsPanel.Children.Add(backupBtn);

            SettingsContent.Children.Add(actionsPanel);

            // Info
            SettingsContent.Children.Add(CreateSettingHeader("About"));
            var infoText = new TextBlock
            {
                Text = "MediaDeck v1.0.0\n\nA portable media library that runs from USB drives.\nAll data is stored on the drive - nothing is written to the host PC.\n\nSupported formats:\n• Videos: MP4, MKV, AVI, MOV, WebM, WMV\n• Manga: CBZ, CBR, PDF, ZIP\n• Books: EPUB",
                Foreground = (Brush)FindResource("TextSecondaryBrush"),
                Margin = new Thickness(0, 0, 0, 15),
                TextWrapping = TextWrapping.Wrap
            };
            SettingsContent.Children.Add(infoText);
        }

        /// <summary>
        /// Creates a section header text block.
        /// </summary>
        private TextBlock CreateSectionHeader(string text)
        {
            return new TextBlock
            {
                Text = text,
                FontSize = 20,
                FontWeight = FontWeights.SemiBold,
                Foreground = (Brush)FindResource("TextBrush"),
                Margin = new Thickness(0, 0, 0, 15)
            };
        }

        /// <summary>
        /// Creates a setting header.
        /// </summary>
        private TextBlock CreateSettingHeader(string text)
        {
            return new TextBlock
            {
                Text = text,
                FontSize = 16,
                FontWeight = FontWeights.SemiBold,
                Foreground = (Brush)FindResource("TextBrush"),
                Margin = new Thickness(0, 15, 0, 10)
            };
        }

        /// <summary>
        /// Creates a label.
        /// </summary>
        private TextBlock CreateLabel(string text)
        {
            return new TextBlock
            {
                Text = text,
                FontSize = 14,
                Foreground = (Brush)FindResource("TextBrush")
            };
        }

        /// <summary>
        /// Creates a path setting row with textbox and browse button.
        /// </summary>
        private StackPanel CreatePathSetting(string label, string currentValue, Action<string> onSave)
        {
            var panel = new StackPanel { Margin = new Thickness(0, 0, 0, 10) };
            panel.Children.Add(CreateLabel(label));

            var grid = new Grid { Margin = new Thickness(0, 5, 0, 0) };
            grid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
            grid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(80) });

            var textBox = new TextBox
            {
                Text = currentValue,
                Padding = new Thickness(8, 6),
                Background = (Brush)FindResource("PrimaryBrush"),
                Foreground = (Brush)FindResource("TextBrush"),
                BorderBrush = (Brush)FindResource("BorderBrush"),
                BorderThickness = new Thickness(1)
            };
            Grid.SetColumn(textBox, 0);

            var browseBtn = new Button
            {
                Content = "Browse",
                Style = (Style)FindResource("ModernButton"),
                Margin = new Thickness(10, 0, 0, 0)
            };
            Grid.SetColumn(browseBtn, 1);
            browseBtn.Click += (s, e) =>
            {
                // For MVP, just show info - real implementation would use OpenFileDialog
                MessageBox.Show($"Current path: {currentValue}\n\nPlace portable apps in the Apps folder relative to MediaDeck.exe.", "Info", MessageBoxButton.OK, MessageBoxImage.Information);
            };

            grid.Children.Add(textBox);
            grid.Children.Add(browseBtn);
            panel.Children.Add(grid);

            return panel;
        }

        /// <summary>
        /// Creates placeholder text.
        /// </summary>
        private TextBlock CreatePlaceholderText(string text)
        {
            return new TextBlock
            {
                Text = text,
                FontSize = 16,
                Foreground = (Brush)FindResource("TextSecondaryBrush"),
                Margin = new Thickness(0, 20, 0, 0),
                TextWrapping = TextWrapping.Wrap
            };
        }

        /// <summary>
        /// Creates a horizontal grid of media cards.
        /// </summary>
        private ItemsControl CreateMediaGrid(List<MediaItem> items)
        {
            var itemsControl = new ItemsControl();
            var panel = new WrapPanel { Orientation = Orientation.Horizontal };
            itemsControl.ItemsPanel = new ItemsPanelTemplate(panel);
            itemsControl.ItemsSource = CreateMediaCards(items);
            return itemsControl;
        }

        /// <summary>
        /// Creates a collection of media card UI elements.
        /// </summary>
        private List<Border> CreateMediaCards(List<MediaItem> items)
        {
            var cards = new List<Border>();

            foreach (var item in items)
            {
                var card = CreateMediaCard(item);
                cards.Add(card);
            }

            return cards;
        }

        /// <summary>
        /// Creates a single media card UI element.
        /// </summary>
        private Border CreateMediaCard(MediaItem item)
        {
            var border = new Border
            {
                Width = 160,
                Height = 220,
                Margin = new Thickness(10),
                Background = (Brush)FindResource("SecondaryBrush"),
                CornerRadius = new CornerRadius(8),
                BorderBrush = (Brush)FindResource("BorderBrush"),
                BorderThickness = new Thickness(1),
                Cursor = Cursors.Hand,
                Tag = item
            };

            var grid = new Grid();
            grid.RowDefinitions.Add(new RowDefinition { Height = new GridLength(1, GridUnitType.Star) });
            grid.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto });

            // Cover area (placeholder color for now)
            var coverBorder = new Border
            {
                Background = GetMediaTypeColor(item.Type),
                CornerRadius = new CornerRadius(8, 8, 0, 0),
                Margin = new Thickness(0, 0, 0, 0)
            };

            var coverContent = new StackPanel
            {
                VerticalAlignment = VerticalAlignment.Center,
                HorizontalAlignment = HorizontalAlignment.Center
            };
            coverContent.Children.Add(new TextBlock
            {
                Text = GetMediaTypeIcon(item.Type),
                FontSize = 32,
                Foreground = Brushes.White,
                HorizontalAlignment = HorizontalAlignment.Center
            });

            // Favorite indicator
            if (item.IsFavorite)
            {
                var favStar = new TextBlock
                {
                    Text = "★",
                    FontSize = 20,
                    Foreground = Brushes.Gold,
                    HorizontalAlignment = HorizontalAlignment.Right,
                    VerticalAlignment = VerticalAlignment.Top,
                    Margin = new Thickness(0, 5, 5, 0)
                };
                coverContent.Children.Add(favStar);
            }

            coverBorder.Child = coverContent;
            Grid.SetRow(coverBorder, 0);
            grid.Children.Add(coverBorder);

            // Info area
            var infoStack = new StackPanel
            {
                Margin = new Thickness(10, 8, 10, 8)
            };

            var titleText = new TextBlock
            {
                Text = item.Title.Length > 25 ? item.Title.Substring(0, 22) + "..." : item.Title,
                FontSize = 12,
                Foreground = (Brush)FindResource("TextBrush"),
                TextWrapping = TextWrapping.Wrap,
                MaxHeight = 36
            };
            infoStack.Children.Add(titleText);

            var typeBadge = new TextBlock
            {
                Text = GetMediaTypeLabel(item.Type),
                FontSize = 10,
                Foreground = (Brush)FindResource("TextSecondaryBrush"),
                Margin = new Thickness(0, 4, 0, 0)
            };
            infoStack.Children.Add(typeBadge);

            // Progress indicator
            if (item.ProgressPercent > 0 && item.ProgressPercent < 100)
            {
                var progressText = new TextBlock
                {
                    Text = $"{item.ProgressPercent:F0}% complete",
                    FontSize = 10,
                    Foreground = (Brush)FindResource("AccentBrush"),
                    Margin = new Thickness(0, 2, 0, 0)
                };
                infoStack.Children.Add(progressText);
            }

            Grid.SetRow(infoStack, 1);
            grid.Children.Add(infoStack);

            border.Child = grid;

            // Double-click to open
            border.MouseLeftButtonDown += (s, e) =>
            {
                if (e.ClickCount == 2)
                {
                    OpenMediaItem(item);
                }
            };

            // Context menu for favorite toggle
            border.ContextMenu = new ContextMenu();
            var favMenuItem = new MenuItem
            {
                Header = item.IsFavorite ? "Remove from Favorites" : "Add to Favorites"
            };
            favMenuItem.Click += (s, e) =>
            {
                _databaseService.ToggleFavorite(item.Id);
                item.IsFavorite = !item.IsFavorite;
                RefreshUI();
            };
            border.ContextMenu.Items.Add(favMenuItem);

            var openMenuItem = new MenuItem { Header = "Open" };
            openMenuItem.Click += (s, e) => OpenMediaItem(item);
            border.ContextMenu.Items.Add(openMenuItem);

            return border;
        }

        /// <summary>
        /// Gets a color for the media type.
        /// </summary>
        private SolidColorBrush GetMediaTypeColor(MediaType type)
        {
            return type switch
            {
                MediaType.Video => new SolidColorBrush(Color.FromRgb(0, 120, 212)),
                MediaType.Manga => new SolidColorBrush(Color.FromRgb(200, 50, 50)),
                MediaType.Book => new SolidColorBrush(Color.FromRgb(50, 150, 50)),
                _ => new SolidColorBrush(Color.FromRgb(100, 100, 100))
            };
        }

        /// <summary>
        /// Gets an icon character for the media type.
        /// </summary>
        private string GetMediaTypeIcon(MediaType type)
        {
            return type switch
            {
                MediaType.Video => "▶",
                MediaType.Manga => "📖",
                MediaType.Book => "📚",
                _ => "📄"
            };
        }

        /// <summary>
        /// Gets a label for the media type.
        /// </summary>
        private string GetMediaTypeLabel(MediaType type)
        {
            return type switch
            {
                MediaType.Video => "Video",
                MediaType.Manga => "Manga",
                MediaType.Book => "Book",
                _ => "Unknown"
            };
        }

        /// <summary>
        /// Opens a media item with the configured player.
        /// </summary>
        private void OpenMediaItem(MediaItem item)
        {
            if (!_libraryScanner.FileExists(item))
            {
                MessageBox.Show($"File not found:\n{item.RelativePath}\n\nThe file may have been moved or deleted.", "File Not Found", MessageBoxButton.OK, MessageBoxImage.Warning);
                return;
            }

            _databaseService.UpdateLastOpened(item.Id);
            
            if (_mediaLauncher.OpenMedia(item, _libraryScanner))
            {
                item.LastOpened = DateTime.Now;
                RefreshRecent();
                RefreshHome();
            }
            else
            {
                MessageBox.Show($"Could not open {item.Title}.\n\nPlease ensure the portable player is installed in the Apps folder.", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        /// <summary>
        /// Handles search box focus.
        /// </summary>
        private void SearchBox_GotFocus(object sender, RoutedEventArgs e)
        {
            _isSearchFocused = true;
            SearchPlaceholder.Visibility = Visibility.Collapsed;
        }

        private void SearchBox_LostFocus(object sender, RoutedEventArgs e)
        {
            _isSearchFocused = false;
            if (string.IsNullOrEmpty(SearchBox.Text))
            {
                SearchPlaceholder.Visibility = Visibility.Visible;
            }
        }

        /// <summary>
        /// Handles search text changes.
        /// </summary>
        private void SearchBox_TextChanged(object sender, TextChangedEventArgs e)
        {
            var query = SearchBox.Text.Trim();
            
            if (string.IsNullOrEmpty(query))
            {
                RefreshUI();
                return;
            }

            var results = _databaseService.SearchByTitle(query);
            
            // Show results in all tabs
            VideosList.ItemsSource = CreateMediaCards(results.Where(x => x.Type == MediaType.Video).ToList());
            MangaList.ItemsSource = CreateMediaCards(results.Where(x => x.Type == MediaType.Manga).ToList());
            BooksList.ItemsSource = CreateMediaCards(results.Where(x => x.Type == MediaType.Book).ToList());
            FavoritesList.ItemsSource = CreateMediaCards(results.Where(x => x.IsFavorite).ToList());
            RecentList.ItemsSource = CreateMediaCards(results);
        }
    }
}
