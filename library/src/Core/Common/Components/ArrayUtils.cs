using System;
using System.ComponentModel;
using ReFlex.Core.Common.Exceptions;

namespace ReFlex.Core.Common.Components
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
        /// RReferencing the inner values in the arrays.
        /// </summary>
        /// <typeparam name="T">The inner value type of both arrays.</typeparam>
        /// <param name="source">The source.</param>
        /// <param name="target">The target.</param>
        /// <exception cref="ArraysWithDifferentSizesException"></exception>
        [Obsolete("Warning: Referencing 2d arrays is extremely slow")]
        public static void ReferencingArrays<T>(T[,] source, T[,] target)
        {
            if (source.Rank != 2 || target.Rank != 2)
                throw new DataMisalignedException();
            
            if (source.GetLength(0) != target.GetLength(0) || source.GetLength(1) != target.GetLength(1))
                throw new ArraysWithDifferentSizesException();
            
            for (var i = 0; i < target.Length; i++)
            {
                // if (source.GetLength(0) * source.GetLength(1) != target.GetLength(0) * target.GetLength(1))
                //     throw new ArraysWithDifferentSizesException();

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
            if (source.GetLength(0) != target.GetLength(0))
                throw new ArraysWithDifferentSizesException();
                
            for (var i = 0; i < target.Length; i++)
            {
                if (source[i].Length != target[i].Length)
                    throw new ArraysWithDifferentSizesException();
                
                for (var j = 0; j < target[i].Length; j++)
                    target[i][j] = source[i][j];
            }
        }
    }
}
