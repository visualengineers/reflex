namespace ReFlex.Server.Data.Config
{
    public struct Distance
    {
        public float Min { get; set; }
        public float Max { get; set; }
        public float Default { get; set; }
        public float InputDistance { get; set; }

        public override string ToString()
        {
            return $"[ {Min}:{nameof(Min)} | {Default}:{nameof(Default)} | {Max}:{nameof(Max)} | {InputDistance}:{nameof(InputDistance)} ]";
        }
    }
}