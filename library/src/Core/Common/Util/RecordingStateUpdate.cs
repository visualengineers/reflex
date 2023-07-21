namespace ReFlex.Core.Common.Util
{
    public class RecordingStateUpdate
    {
        public RecordingState State { get; }

        public int FramesRecorded { get; }

        public string SessionName { get; }

        public RecordingStateUpdate(RecordingState state, int framesRecorded, string sessionName)
        {
            State = state;
            FramesRecorded = framesRecorded;
            SessionName = sessionName;
        }
    }
}
