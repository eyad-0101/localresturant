using System.Windows;

namespace MediaDeck
{
    /// <summary>
    /// Application entry point.
    /// </summary>
    public partial class App : Application
    {
        protected override void OnStartup(StartupEventArgs e)
        {
            base.OnStartup(e);

            // Set up global exception handling
            DispatcherUnhandledException += (sender, args) =>
            {
                MessageBox.Show($"An error occurred: {args.Exception.Message}", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
                args.Handled = true;
            };
        }
    }
}
