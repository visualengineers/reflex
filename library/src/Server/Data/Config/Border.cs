namespace ReFlex.Server.Data.Config
{
    public struct Border
    {
        public int Left { get; set; }

        public int Right { get; set; }

        public int Top { get; set; }

        public int Bottom { get; set; }

        public override string ToString()
        {
           return $"[ {Top}:{nameof(Top)} | {Left}:{nameof(Left)} | {Bottom}:{nameof(Bottom)} | {Right}:{nameof(Right)} ]";
        }
    }
}