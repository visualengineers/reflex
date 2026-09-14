using TrackingServer.Model;

namespace TrackingServer.Hubs
{
    public class ProcessingHub : StateHubBase<string>
    {
        #region Fields

        private readonly ProcessingService _processingService;

        public static readonly string ProcessingStateGroup = "ProcessingState";
        
        public static readonly string InteractionsGroup = "Interactions";
        public static readonly string InteractionFramesGroup = "InteractionFrames";
        public static readonly string InteractionHistoryGroup = "InteractionHistory";

        #endregion

        #region Constructor

        public ProcessingHub(ProcessingService processingService) 
            : base(processingService, ProcessingStateGroup)
        {
            _processingService = processingService;
        }

        #endregion

        #region public Methods

        public async Task StartInteractions() 
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, InteractionsGroup);
            _processingService.InteractionSubscriptionManager.Subscribe(Context.ConnectionId);
        }

        public async Task StopInteractions() 
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, InteractionsGroup);
            _processingService.InteractionSubscriptionManager.Unsubscribe(Context.ConnectionId);
        }
        
        public async Task StartInteractionFrames() 
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, InteractionFramesGroup);
            _processingService.InteractionFrameSubscriptionManager.Subscribe(Context.ConnectionId);
        }

        public async Task StopInteractionFrames() 
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, InteractionFramesGroup);
            _processingService.InteractionFrameSubscriptionManager.Unsubscribe(Context.ConnectionId);
        }
        
        public async Task StartInteractionHistory() 
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, InteractionHistoryGroup);
            _processingService.InteractionHistorySubscriptionManager.Subscribe(Context.ConnectionId);
        }

        public async Task StopInteractionHistory() 
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, InteractionHistoryGroup);
            _processingService.InteractionHistorySubscriptionManager.Unsubscribe(Context.ConnectionId);
        }

        #endregion
    }
}