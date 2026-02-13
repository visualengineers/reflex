using System;
using NUnit.Framework;
using ReFlex.Core.Common.Util;

namespace ReFlex.Core.Tuio.Test
{
    [TestFixture]
    public class LogUtilitiesTest
    {
        [Test]
        public void TestNoAdditionalLogWhenKeyExists()
        {
            // Use a unique source scope so tests stay isolated even with shared static cache.
            var sourceName = CreateUniqueSourceName(nameof(TestNoAdditionalLogWhenKeyExists));
            var methodName = "SendUdp";
            var logCount = 0;

            try
            {
                // First occurrence should be logged.
                LogUtilities.LogErrorOnce(
                    new InvalidOperationException("send failed"),
                    sourceName,
                    methodName,
                    _ => logCount++,
                    (_, __) => logCount++);

                // Same exception signature in same source/method should be suppressed.
                LogUtilities.LogErrorOnce(
                    new InvalidOperationException("send failed"),
                    sourceName,
                    methodName,
                    _ => logCount++,
                    (_, __) => logCount++);

                // Exactly one log entry is expected.
                Assert.That(logCount, Is.EqualTo(1));
            }
            finally
            {
                // Cleanup test-specific cache entries.
                LogUtilities.ClearLoggedErrors(sourceName);
            }
        }

        [Test]
        public void TestClearAllowsLoggingAgain()
        {
            // Unique source keeps this test independent from other runs.
            var sourceName = CreateUniqueSourceName(nameof(TestClearAllowsLoggingAgain));
            var methodName = "SendTcp";
            var logCount = 0;

            try
            {
                // First log call should pass through.
                LogUtilities.LogErrorOnce(
                    new InvalidOperationException("connection failed"),
                    sourceName,
                    methodName,
                    _ => logCount++,
                    (_, __) => logCount++,
                    "custom message");

                // Reset deduplication state for this source.
                LogUtilities.ClearLoggedErrors(sourceName);

                // After reset, same error must be logged again.
                LogUtilities.LogErrorOnce(
                    new InvalidOperationException("connection failed"),
                    sourceName,
                    methodName,
                    _ => logCount++,
                    (_, __) => logCount++,
                    "custom message");

                // One log before and one log after clear.
                Assert.That(logCount, Is.EqualTo(2));
            }
            finally
            {
                // Cleanup test-specific cache entries.
                LogUtilities.ClearLoggedErrors(sourceName);
            }
        }

        [Test]
        public void TestDifferentMessagesAndExceptionTypesAreLoggedOnceEach()
        {
            // Unique source keeps this test independent from other runs.
            var sourceName = CreateUniqueSourceName(nameof(TestDifferentMessagesAndExceptionTypesAreLoggedOnceEach));
            var methodName = "SendOscMessageTcp";
            var logCount = 0;

            try
            {
                // Distinct signatures: message, type and inner-exception chain.
                LogUtilities.LogErrorOnce(
                    new InvalidOperationException("message A"),
                    sourceName,
                    methodName,
                    _ => logCount++,
                    (_, __) => logCount++);

                LogUtilities.LogErrorOnce(
                    new InvalidOperationException("message B"),
                    sourceName,
                    methodName,
                    _ => logCount++,
                    (_, __) => logCount++);

                LogUtilities.LogErrorOnce(
                    new ArgumentException("message A"),
                    sourceName,
                    methodName,
                    _ => logCount++,
                    (_, __) => logCount++);

                LogUtilities.LogErrorOnce(
                    new InvalidOperationException("message A", new Exception("inner A")),
                    sourceName,
                    methodName,
                    _ => logCount++,
                    (_, __) => logCount++);

                // Repeat all variants; duplicates should be suppressed.
                LogUtilities.LogErrorOnce(
                    new InvalidOperationException("message A"),
                    sourceName,
                    methodName,
                    _ => logCount++,
                    (_, __) => logCount++);

                LogUtilities.LogErrorOnce(
                    new InvalidOperationException("message B"),
                    sourceName,
                    methodName,
                    _ => logCount++,
                    (_, __) => logCount++);

                LogUtilities.LogErrorOnce(
                    new ArgumentException("message A"),
                    sourceName,
                    methodName,
                    _ => logCount++,
                    (_, __) => logCount++);

                LogUtilities.LogErrorOnce(
                    new InvalidOperationException("message A", new Exception("inner A")),
                    sourceName,
                    methodName,
                    _ => logCount++,
                    (_, __) => logCount++);

                // Four unique signatures should produce four logs total.
                Assert.That(logCount, Is.EqualTo(4));
            }
            finally
            {
                // Cleanup test-specific cache entries.
                LogUtilities.ClearLoggedErrors(sourceName);
            }
        }

        [Test]
        public void TestSameErrorIsLoggedOncePerMethod()
        {
            // Unique source keeps this test independent from other runs.
            var sourceName = CreateUniqueSourceName(nameof(TestSameErrorIsLoggedOncePerMethod));
            var firstMethod = "SendTcp";
            var secondMethod = "SendOscMessageTcp";
            var logCount = 0;

            try
            {
                // Same error in first method: only first call logs.
                LogUtilities.LogErrorOnce(
                    new InvalidOperationException("same error"),
                    sourceName,
                    firstMethod,
                    _ => logCount++,
                    (_, __) => logCount++);

                LogUtilities.LogErrorOnce(
                    new InvalidOperationException("same error"),
                    sourceName,
                    firstMethod,
                    _ => logCount++,
                    (_, __) => logCount++);

                Assert.That(logCount, Is.EqualTo(1));

                // Same error in different method should log once again (method is part of the key).
                LogUtilities.LogErrorOnce(
                    new InvalidOperationException("same error"),
                    sourceName,
                    secondMethod,
                    _ => logCount++,
                    (_, __) => logCount++);

                LogUtilities.LogErrorOnce(
                    new InvalidOperationException("same error"),
                    sourceName,
                    secondMethod,
                    _ => logCount++,
                    (_, __) => logCount++);

                // One log per method is expected.
                Assert.That(logCount, Is.EqualTo(2));
            }
            finally
            {
                // Cleanup test-specific cache entries.
                LogUtilities.ClearLoggedErrors(sourceName);
            }
        }

        private static string CreateUniqueSourceName(string testName)
        {
            // A per-test unique source avoids cross-test interference through the static cache.
            return $"{nameof(LogUtilitiesTest)}.{testName}.{Guid.NewGuid()}";
        }
    }
}
