using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using NLog;
using TrackingServer.Interfaces;

namespace TrackingServer.Hubs
{
    public abstract class StateHubBase<T>: Hub
    {
        private static Logger Log = LogManager.GetCurrentClassLogger();
        
        private readonly ISignalRBaseService<T> _service;
        private readonly string _groupId;

        protected StateHubBase(ISignalRBaseService<T> service, string groupId)
        {
            _service = service;
            _groupId = groupId;
        }

        public async Task StartState()
        {
            Log.Info($"Group [{_groupId}] subscribed to state updates from {_service.GetType().FullName}.");
            _service.StateSubscriptionManager.Subscribe(Context.ConnectionId);
            
            await Groups.AddToGroupAsync(Context.ConnectionId, _groupId);
            await Clients.Group(_groupId).SendAsync(_groupId, _service.GetState());
        }
        
        public async Task StopState()
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, _groupId);
            _service.StateSubscriptionManager.Unsubscribe(Context.ConnectionId);
            
            Log.Info($"Group [{_groupId}] unsubscribed to state updates from {_service.GetType().FullName}.");
        }
    }
}