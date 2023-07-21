using System;
using System.Collections.Concurrent;
using System.Reactive;
using System.Reactive.Linq;
using Microsoft.AspNetCore.SignalR;
using NLog;
using LogLevel = NLog.LogLevel;

namespace TrackingServer.Util
{
    public abstract class HubGroupSubscriptionManager : IHubGroupSubscriptionManager
    {
        protected static readonly Logger Logger = LogManager.GetCurrentClassLogger();

        protected readonly string Name;
        protected readonly ConcurrentDictionary<string, IDisposable> Subscriptions;

        protected HubGroupSubscriptionManager(string name)
        {
            Name = name;
            Subscriptions = new ConcurrentDictionary<string, IDisposable>();
        }

        public abstract void Subscribe(string identifier);

        public void Unsubscribe(string identifier)
        {
            if (!Subscriptions.TryRemove(identifier, out var sub))
            {
                Logger.Log(LogLevel.Error, $"Cannot remove subscription of {Name} for {identifier}: Subsctription not found in dictionary.");
                return;
            }

            Logger.Info($"Removed subscription of {Name} for {identifier}.");
            sub.Dispose();
        }
    }

    public class HubGroupSubscriptionManager<TResult> : HubGroupSubscriptionManager
    {
        private IObservable<TResult> _observable;

        public HubGroupSubscriptionManager(IObservable<TResult> observable, string name) : base(name)
        {
            _observable = observable;
        }

        public HubGroupSubscriptionManager(string name) : base(name)
        {
        }

        public void Setup<THub, TSource>(Action<EventHandler<TSource>> subscription,
            Action<EventHandler<TSource>> unsubscription,
            Func<EventPattern<TSource>, TResult> select,
            IHubContext<THub> ctx,
            string groupName) where THub : Hub
        {
            _observable = Observable.FromEventPattern(subscription, unsubscription)
                .Select(select)
                .Do(values => ctx.Clients.Groups(groupName)
                    .SendAsync(Name, values).Wait())
                .Publish()
                .RefCount(); ;
        }

        public void Setup<THub>(Action<EventHandler<TResult>> subscription,
            Action<EventHandler<TResult>> unsubscription,
            IHubContext<THub> ctx,
            string groupName) where THub : Hub
        {
            Setup(
                subscription,
                unsubscription,
                evt => evt.EventArgs,
                ctx,
                groupName);
        }

        public override void Subscribe(string identifier)
        {
            if (_observable == null)
                return;

            Subscriptions.AddOrUpdate(
                identifier,
                (id) =>
                {
                    Logger.Info($"Added subscription of {Name} for {identifier}.");
                    return _observable.Subscribe();
                },
                (id, sub) =>
                {
                    Logger.Info($"Updated subscription of {Name} for {identifier}.");
                    sub.Dispose();
                    return _observable.Subscribe();
                });
        }
    }
}
