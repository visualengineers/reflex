using Emulator.Benchmark.Benchmark;

using BenchmarkDotNet.Configs;
using BenchmarkDotNet.Reports;
using BenchmarkDotNet.Running;

namespace Emulator.Benchmark
{
    public class Program
    {
        private static IConfig _cfg = new DebugInProcessConfig();
        
        public static void Main(string[] args)
        {
            _cfg.WithOptions(ConfigOptions.DisableOptimizationsValidator);
            // var summary1 = BenchmarkEmulator();
            
            var summary2 = BenchmarkEmulatedPointCloud();
            
        }

        private static Summary BenchmarkEmulator() => BenchmarkRunner.Run<EmulatorBenchmark>(_cfg);
        
        private static Summary BenchmarkEmulatedPointCloud() => BenchmarkRunner.Run<EmulatedPointCloudBenchmark>(_cfg);
    }
}