namespace TrackingServer.Data.Config;

public class RemoteProcessingServiceSettings
{
    public string Address { get; set; } = "http://localhost:50051/";

    public int NumSkipValues { get; set; } = 0;

    public bool CompleteDataSet { get; set; } = true;

    public double CutOff { get; set; } = 0.1;

    public double Factor { get; set; } = 1200;

    public RemoteProcessingAlgorithm Algorithm { get; set; } = RemoteProcessingAlgorithm.Default;

    public string GetRemoteProcessingServiceSettingsString()
    {
        var result = $"=====  {nameof(RemoteProcessingServiceSettings)}  ====={Environment.NewLine}";
        result += $"  {nameof(Address)}: {Address} | ";
        result += $"{nameof(NumSkipValues)}: {NumSkipValues} | ";
        result += $"{nameof(CompleteDataSet)}: {CompleteDataSet}{Environment.NewLine}";
        result += $"{nameof(Algorithm)}: {Enum.GetName(typeof(RemoteProcessingAlgorithm), Algorithm)} | ";
        result += $"{nameof(CutOff)}: {CutOff} | {nameof(Factor)}: {Factor}{Environment.NewLine}";
        return result;
    }
}