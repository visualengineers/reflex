namespace ReFlex.Server.Data.Config;

public class PointCloudSettings
{
  public int UpdateInterval { get; set; } = 100;

  public int PointCloudSize { get; set; } = 40000;

  public string GetPointCloudSettingsString()
  {
    var result = $"=====  {nameof(PointCloudSettings)}  ====={Environment.NewLine}";
    result += $"  {nameof(UpdateInterval)}: {UpdateInterval}ms){Environment.NewLine}";
    result += $"  {nameof(PointCloudSize)}: {PointCloudSize}{Environment.NewLine}";
    return result;
  }
}
