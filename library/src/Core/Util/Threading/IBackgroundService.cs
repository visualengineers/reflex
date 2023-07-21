using System.Threading;
using System.Threading.Tasks;

namespace ReFlex.Core.Util.Threading
{
    public interface IBackgroundService
    {
        Task StartAsync(CancellationToken cancellationToken);
        Task StopAsync(CancellationToken cancellationToken);
    }
}
