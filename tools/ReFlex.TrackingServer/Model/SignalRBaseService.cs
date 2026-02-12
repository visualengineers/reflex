using System.Reactive.Subjects;
using Microsoft.AspNetCore.SignalR;
using NLog;
using TrackingServer.Interfaces;
using TrackingServer.Util;

namespace TrackingServer.Model
{
    public abstract class SignalRBaseService<T,TU> : ISignalRBaseService<T>, IDisposable where T : class where TU : Hub
    {
        private static Logger Log = LogManager.GetCurrentClassLogger();

        protected readonly HubGroupSubscriptionManager<T>
            StateSubscription;

        protected BehaviorSubject<T?> CurrentState { get; }

        private readonly IDisposable _stateHubSubscription;

        public IHubGroupSubscriptionManager StateSubscriptionManager => StateSubscription;

        public event EventHandler<T>? StateChanged;

        protected SignalRBaseService(string stateGroupIdentifier, IHubContext<TU> hubContext)
        {
            CurrentState = new BehaviorSubject<T?>(null);
            _stateHubSubscription = CurrentState.Subscribe(state =>
            {
                if (state != null)
                  StateChanged?.Invoke(this, state);
            });

            StateSubscription = new HubGroupSubscriptionManager<T>(stateGroupIdentifier);
            StateSubscription.Setup(
                (handler) => StateChanged += handler,
                (handler) => StateChanged -= handler,
                hubContext,
                stateGroupIdentifier
            );
        }

        public abstract T GetState();

        public virtual void Dispose()
        {
            CurrentState.Dispose();
            _stateHubSubscription?.Dispose();
        }
    }
}
