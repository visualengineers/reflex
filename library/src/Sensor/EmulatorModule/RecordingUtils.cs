using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Newtonsoft.Json;
using ReFlex.Core.Common.Util;

namespace ReFlex.Sensor.EmulatorModule
{
    public static class RecordingUtils
    {
        public const string SavePath = "wwwroot/recordings/";
        public const string ConfigFile = "config.json";

        public static bool DeleteRecording(string name)
        {
            if (!Directory.Exists(SavePath))
            {
                Directory.CreateDirectory(SavePath);
                return false;
            }

            var recordings = Directory.GetDirectories(SavePath);

            var numDirectoriesDeleted = 0;

            foreach (var dir in recordings)
            {
                var cfgFile = Path.Combine(dir, ConfigFile);

                if (!File.Exists(cfgFile))
                    continue;

                var cfgObj = File.ReadAllText(cfgFile);

                var cfg = JsonConvert.DeserializeObject<StreamParameter>(cfgObj);

                if (!Equals(cfg.Name, name)) 
                    continue;

                var deleted = DeleteRecordingDirectory(dir);
                if (deleted)
                    numDirectoriesDeleted += 1;
            }

            return numDirectoriesDeleted > 0;
        }

        public static int DeleteAllRecordings()
        {
            if (!Directory.Exists(SavePath))
            {
                Directory.CreateDirectory(SavePath);
                return 0;
            }

            var recordings = Directory.GetDirectories(SavePath);

            return recordings.
                // find all directories with config file
                Where(dir => File.Exists(Path.Combine(dir, ConfigFile))).
                // delete directories and select result of delete Method
                Select(DeleteRecordingDirectory).
                // count number of successful deletions
                Count(deleted => deleted);
        }

        public static IEnumerable<StreamParameter> RetrieveConfigurations()
        {
            if(!Directory.Exists(SavePath))
                return new List<StreamParameter>();

            var recordings = Directory.GetDirectories(SavePath);

            return recordings.
                // Select config file path
                Select(dir => Path.Combine(dir, ConfigFile)).
                // filter all directories that do not contain config file
                Where(File.Exists)
                // load and deserialize config file
                .Select(file => JsonConvert.DeserializeObject<StreamParameter>(File.ReadAllText(file)));
        }

        public static string[] GetFrames(string name)
        {
            if(!Directory.Exists(SavePath))
                return new string[0];

            var recordings = Directory.GetDirectories(SavePath);

            var settings = recordings.
                // Select tuple containing directory and config file path
                Select(dir => Tuple.Create(dir, Path.Combine(dir, ConfigFile))).
                // filter all directories that do not contain config file
                Where(tpl => File.Exists(tpl.Item2))
                // load and deserialize config file
                .Select(tpl => Tuple.Create(tpl.Item1, JsonConvert.DeserializeObject<StreamParameter>(File.ReadAllText(tpl.Item2))))
                // filter configs with matching name
                .Where(tpl => Equals(tpl.Item2.Name, name)).
                // return first item (if there are matching elements)
                FirstOrDefault();

            var selectedRecordingsDir = settings?.Item1;

            if (settings?.Item2 == null || selectedRecordingsDir == null || !Directory.Exists(selectedRecordingsDir))
                return new string[0];

           return Directory.GetFiles(selectedRecordingsDir, $"*.{DepthImageFormatTools.GetFileExtension(settings.Item2.Format)}");

            

        }

        private static bool DeleteRecordingDirectory(string directory)
        {
            if (Directory.Exists(directory))
                Directory.Delete(directory, true);

            return !Directory.Exists(directory);
        }
    }
}
