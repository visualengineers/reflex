using Newtonsoft.Json;
using NLog;
using ReFlex.Server.Data;
using TrackingServer.Events;

namespace TrackingServer.Model
{
    /// <summary>
    /// Manager class responsible for loading and saving <see cref="TrackingServerAppSettings"/>
    /// and notify other services about changes.
    /// </summary>
    public class ConfigurationManager
    {
        private static readonly Logger Logger = NLog.LogManager.GetCurrentClassLogger();

        private readonly IWebHostEnvironment _env;
        private readonly IEventAggregator _evtAggregator;
        private readonly string _path;
        private readonly string _restorePath;
        private readonly string _backupPath;

        public TrackingServerAppSettings Settings { get; private set; }

        public bool CanRestoreBackup => File.Exists(RetrieveFullPath(_backupPath));

        public ConfigurationManager(IWebHostEnvironment environment, IEventAggregator evtAggregator, string filePath, string filePathRestore, string filePathBackup)
        {
            _path = filePath;
            _restorePath = filePathRestore;
            _backupPath = filePathBackup;
            _env = environment;
            _evtAggregator = evtAggregator;

            // initialize Settings with default values
            Settings = new TrackingServerAppSettings();

            try
            {
              Load();
            }
            catch (Exception exc)
            {
              Logger.Error(exc, "Error when reading configuration file - restoring default values.");

              ReadSettings(_restorePath);
              WriteSettings(_path);
            }
        }

        public void Load()
        {
            ReadSettings(_path);
        }

        public void LoadSettings(TrackingServerAppSettings settings)
        {
            Settings = settings;
            _evtAggregator.GetEvent<RequestConfigurationUpdateEvent>().Publish(settings.IsAutoStartEnabled);

        }

        public void RestoreDefaults()
        {
            WriteSettings(_backupPath);

            Logger.Info($"Restore Default Settings from File {RetrieveFullPath(_restorePath)}.");

            ReadSettings(_restorePath);
        }

        public void RestoreBackup()
        {
            Logger.Info("Restore Settings from Backup ...");

            if (!CanRestoreBackup)
            {
                Logger.Error($"Cannot restore backup: File '{RetrieveFullPath(_backupPath)}' does not exist.");
                return;
            }

            ReadSettings(_backupPath);
            File.Delete(RetrieveFullPath(_backupPath));
        }

        /// <summary>
        /// Creates a backup and saves new Settings
        /// </summary>
        /// <param name="updatedSettings"></param>
        public void Update(TrackingServerAppSettings updatedSettings)
        {
            WriteSettings(_backupPath);

            Settings = updatedSettings;
            WriteSettings(_path);
        }

        private void ReadSettings(string path)
        {
            var fullPath = RetrieveFullPath(path);

            if (!File.Exists(fullPath))
            {
                Logger.Error($"Cannot read config: File '{fullPath}' does not exist.");
                return;
            }

            var settingJson = File.ReadAllText(fullPath);

            var settings = JsonConvert.DeserializeObject<TrackingServerAppSettings>(settingJson);

            if (settings != null)
                Settings = settings;

            Logger.Info($"Sucessfully loaded Config from file '{fullPath}'");
            Logger.Trace($"Current config values: {Environment.NewLine}{Settings.GetCompleteValues()}");

            _evtAggregator.GetEvent<ServerSettingsUpdatedEvent>().Publish(Settings);
        }

        private void WriteSettings(string path)
        {
            var fullPath = RetrieveFullPath(path);

            if (fullPath == null)
                return;

            var convert = JsonConvert.SerializeObject(Settings);

            File.WriteAllText(fullPath, convert);

            Logger.Info($"Sucessfully wrote new config.");
            Logger.Trace($"Updated values: {Environment.NewLine}{Settings.GetCompleteValues()}.");

            _evtAggregator.GetEvent<ServerSettingsUpdatedEvent>().Publish(Settings);
        }

        private string RetrieveFullPath(string path)
        {
            return _env.WebRootFileProvider.GetFileInfo(path).PhysicalPath;
        }

    }
}
