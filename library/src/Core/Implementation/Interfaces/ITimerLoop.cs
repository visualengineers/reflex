using System;

namespace Implementation.Interfaces
{
    public interface ITimerLoop
    {
        int IntervalLength { get; set; }

        bool IsLoopRunning { get; set; }

        void Run();

        void Stop();

        event EventHandler<bool> IsLoopRunningChanged;
    }
}
