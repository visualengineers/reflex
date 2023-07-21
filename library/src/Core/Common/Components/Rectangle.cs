namespace ReFlex.Core.Common.Components
{
    public class Rectangle
    {
        public float Left { get; set; }

        public float Right { get; set; }

        public float Top { get; set; }

        public float Bottom { get; set; }

        public Rectangle() : this(0, 0, 0, 0)
        {
        }

        public Rectangle(float left, float right, float bottom, float top)
        {
            Left = left;
            Right = right;
            Bottom = bottom;
            Top = top;
        }

        public bool Contains(Point2 point) => Contains(point.X, point.Y);

        public bool Contains(float x, float y) => x > Left && x < Right && y > Bottom && y < Top;
    }
}