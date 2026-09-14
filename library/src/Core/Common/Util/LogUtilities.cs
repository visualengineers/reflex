using System;
using System.Collections.Concurrent;
using System.Linq;
using System.Text;
using NLog;

namespace ReFlex.Core.Common.Util
{
    public static class LogUtilities
    {
        private static readonly Logger Log = LogManager.GetCurrentClassLogger();
        private static readonly ConcurrentDictionary<string, byte> LoggedErrors = new ConcurrentDictionary<string, byte>();

        /// <summary>
        /// Logs an exception only once for the same source, method and exception signature.
        /// </summary>
        /// <param name="exception">Exception to log.</param>
        /// <param name="sourceName">Logical source (for example class name) used for scoping deduplication.</param>
        /// <param name="methodName">Method name used for scoping deduplication.</param>
        /// <param name="message">Optional custom message for the log entry.</param>
        /// <exception cref="ArgumentNullException">Thrown when required arguments are null.</exception>
        public static void LogErrorOnce(
            Exception exception,
            string sourceName,
            string methodName,
            string message = null)
        {
            if (sourceName == null)
                throw new ArgumentNullException(nameof(sourceName));
            if (methodName == null)
                throw new ArgumentNullException(nameof(methodName));

            if (exception == null)
            {
                return;
            }

            var errorKey = BuildErrorKey(sourceName, methodName, exception);
            if (!LoggedErrors.TryAdd(errorKey, 0))
            {
                return;
            }

            if (string.IsNullOrWhiteSpace(message))
            {
                Log.Error(exception);
                return;
            }

            Log.Error(exception, message);
        }

        /// <summary>
        /// Clears deduplication entries.
        /// If <paramref name="sourceName"/> is provided, only entries for this source are removed.
        /// If it is null or whitespace, all entries are removed.
        /// </summary>
        /// <param name="sourceName">Optional source name filter.</param>
        public static void ClearLoggedErrors(string sourceName = null)
        {
            if (string.IsNullOrWhiteSpace(sourceName))
            {
                LoggedErrors.Clear();
                return;
            }

            var sourcePrefix = $"{sourceName}:";
            var keys = LoggedErrors.Keys
                .Where(key => key.StartsWith(sourcePrefix, StringComparison.Ordinal))
                .ToList();

            foreach (var key in keys)
            {
                LoggedErrors.TryRemove(key, out _);
            }
        }

        /// <summary>
        /// Creates a key that uniquely identifies an error context for deduplicated logging.
        /// </summary>
        /// <param name="sourceName">Logical source (for example class name).</param>
        /// <param name="methodName">Method name where the exception occurred.</param>
        /// <param name="exception">Exception to create the key from.</param>
        /// <returns>Deterministic key based on source, method and exception signature.</returns>
        private static string BuildErrorKey(string sourceName, string methodName, Exception exception)
        {
            return $"{sourceName}:{methodName}:{BuildExceptionSignature(exception)}";
        }

        /// <summary>
        /// Builds a deterministic signature from the exception chain.
        /// This includes each exception type and message, including inner exceptions.
        /// </summary>
        /// <param name="exception">Exception to convert to a signature.</param>
        /// <returns>Signature string that can be used for deduplication.</returns>
        private static string BuildExceptionSignature(Exception exception)
        {
            var builder = new StringBuilder();
            var current = exception;

            while (current != null)
            {
                builder.Append(current.GetType().FullName);
                builder.Append(':');
                builder.Append(current.Message);
                builder.Append('|');
                current = current.InnerException;
            }

            return builder.ToString();
        }
    }
}
