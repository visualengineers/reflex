namespace ReFlex.Server.Data.Config
{
    public struct ConfidenceParameter
    {
        public int Min { get; set; }

        public int Max { get; set; }

        public override string ToString()
        {
            return $"[ {Min}:{nameof(Min)} | {Max}:{nameof(Max)} ]";
        }
    }
}