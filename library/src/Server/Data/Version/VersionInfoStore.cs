namespace ReFlex.Server.Data.Version
{
    public class VersionInfoStore
    {
        public List<AppVersionInfo> VersionInfo { get; } = new List<AppVersionInfo>();

        public VersionInfoStore()
        {
            var assemblies = GetType().Assembly.GetReferencedAssemblies();

            assemblies.OrderBy(assembly => assembly.Name).ToList().ForEach(assembly =>
            {
                var name = assembly.Name;
                var version = assembly.Version;

                if (name != null && version != null)
                  VersionInfo.Add(new AppVersionInfo(name, version));
            });
        }
    }
}
