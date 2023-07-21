using ReFlex.Core.Common.Exceptions;

namespace PointCloud.Benchmark.Common
{
    /// <summary>
    /// Helps to initialize and referencing arrays.
    /// </summary>
    public static class ArrayUtils
    {
        /// <summary>
        /// Initializes the array.
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="array">The array.</param>
        /// <param name="size">The size.</param>
        public static void InitializeArray<T>(out T[] array, int size)
            where T : new()
        {
            array = new T[size];
            for (var i = 0; i < array.Length; i++)
                array[i] = new T();
        }
        
        /// <summary>
        /// Initializes the span with default values.
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="span">The resulting span.</param>
        /// <param name="size">The size.</param>
        public static void InitializeSpan<T>(out Span<T> span, int size)
            where T : new()
        {
            span = new T[size];
            span.Fill(new T());
            // for (var i = 0; i < array.Length; i++)
            //     array[i] = new T();
        }

        /// <summary>
        /// Initializes a multidimensional array.
        /// </summary>
        /// <typeparam name="T">The inner value type of the array.</typeparam>
        /// <param name="array">The array.</param>
        /// <param name="width">The width.</param>
        /// <param name="height">The height.</param>
        public static void InitializeArray<T>(out T[,] array, int width, int height)
            where T : new()
        {
            array = new T[width, height];
            for (var i = 0; i < array.GetLength(0); i++)
                for (var j = 0; j < array.GetLength(1); j++)
                    array[i, j] = new T();
        }

        /// <summary>
        /// Initializes a jagged array.
        /// </summary>
        /// <typeparam name="T">The inner value type of the array.</typeparam>
        /// <param name="array">The array.</param>
        /// <param name="width">The width.</param>
        /// <param name="height">The height.</param>
        public static void InitializeArray<T>(out T[][] array, int width, int height)
            where T : new()
        {
            array = new T[width][];
            for (var i = 0; i < array.Length; i++)
            {
                array[i] = new T[height];
                for (var j = 0; j < array[i].Length; j++)
                    array[i][j] = new T();
            }
        }
        
        /// <summary>
        /// Initializes a jagged array.
        /// </summary>
        /// <typeparam name="T">The inner value type of the array.</typeparam>
        /// <param name="array">The array.</param>
        /// <param name="width">The width.</param>
        /// <param name="height">The height.</param>
        public static void InitializeSpan<T>(out Span<T[]> array, int width, int height)
            where T : new()
        {
            array = new Span<T[]>(new T[width][]);
            for (var i = 0; i < array.Length; i++)
            {
                var innerSpan = new T[height].AsSpan();
                innerSpan.Fill(new T());
                array[i] = innerSpan.ToArray();
            }
        }

        /// <summary>
        /// Referencing the inner values in the arrays.
        /// </summary>
        /// <typeparam name="T">The inner value type of both arrays.</typeparam>
        /// <param name="source">The source.</param>
        /// <param name="target">The target.</param>
        /// <exception cref="ArraysWithDifferentSizesException"></exception>
        public static void ReferencingArrays<T>(T[] source, T[] target)
        {
            if (source.Length != target.Length)
                throw new ArraysWithDifferentSizesException();

            for (var i = 0; i < target.Length; i++)
                target[i] = source[i];
        }

        /// <summary>
        /// Referencing the inner values in the arrays.
        /// </summary>
        /// <typeparam name="T">The inner value type of both arrays.</typeparam>
        /// <param name="source">The source.</param>
        /// <param name="target">The target.</param>
        /// <exception cref="ArraysWithDifferentSizesException"></exception>
        public static void ReferencingArrays<T>(T[] source, T[,] target)
        {
            if (source.Length != target.GetLength(1) * target.GetLength(0))
                throw new ArraysWithDifferentSizesException();

            for (var x = 0; x < target.GetLength(0); x++)
                for (var y = 0; y < target.GetLength(1); y++)
                    target[x, y] = source[y * target.GetLength(0) + x];
        }

        /// <summary>
        /// Referencing the inner values in the arrays.
        /// </summary>
        /// <typeparam name="T">The inner value type of both arrays.</typeparam>
        /// <param name="source">The one dimensional array.</param>
        /// <param name="target">The two dimensional array.</param>
        /// <exception cref="ArraysWithDifferentSizesException"></exception>
        public static void ReferencingArrays<T>(T[] source, T[][] target)
        {
            for (var i = 0; i < target.Length; i++)
            {
                if (source.Length != target.Length * target[i].Length)
                    throw new ArraysWithDifferentSizesException();

                for (var j = 0; j < target[i].Length; j++)
                    target[i][j] = source[j * target.Length + i];
            }
        }
        
        /// <summary>
        /// Referencing the inner values in the arrays.
        /// </summary>
        /// <typeparam name="T">The inner value type of both arrays.</typeparam>
        /// <param name="source">The one dimensional array.</param>
        /// <param name="target">The two dimensional array.</param>
        /// <exception cref="ArraysWithDifferentSizesException"></exception>
        public static void ReferencingArrays<T>(ReadOnlySpan<T> source, Span<T[]> target)
        {
            for (var i = 0; i < target.Length; i++)
            {
                if (source.Length != target.Length * target[i].Length)
                    throw new ArraysWithDifferentSizesException();

                for (var j = 0; j < target[i].Length; j++)
                    target[i][j] = source[j * target.Length + i];
            }
        }

        /// <summary>
        /// RReferencing the inner values in the arrays.
        /// </summary>
        /// <typeparam name="T">The inner value type of both arrays.</typeparam>
        /// <param name="source">The source.</param>
        /// <param name="target">The target.</param>
        /// <exception cref="ArraysWithDifferentSizesException"></exception>
        public static void ReferencingArrays<T>(T[,] source, T[,] target)
        {
            for (var i = 0; i < target.Length; i++)
            {
                if (source.GetLength(0) * source.GetLength(1) != target.GetLength(0) * target.GetLength(1))
                    throw new ArraysWithDifferentSizesException();

                for (var x = 0; x < target.GetLength(0); x++)
                    for (var y = 0; y < target.GetLength(1); y++)
                        target[x, y] = source[x, y];
            }
        }

        /// <summary>
        /// RReferencing the inner values in the arrays.
        /// </summary>
        /// <typeparam name="T">The inner value type of both arrays.</typeparam>
        /// <param name="source">The source.</param>
        /// <param name="target">The target.</param>
        /// <exception cref="ArraysWithDifferentSizesException"></exception>
        public static void ReferencingArrays<T>(T[][] source, T[][] target)
        {
            for (var i = 0; i < target.Length; i++)
            {
                if (source.Length * source[i].Length != target.Length * target[i].Length)
                    throw new ArraysWithDifferentSizesException();

                for (var j = 0; j < target[i].Length; j++)
                    target[i][j] = source[i][j];
            }
        }
    }
}
