using System;
using NLog;
using NLog.Config;
using NLog.Targets;
using NUnit.Framework;
using ReFlex.Core.Common.Util;

namespace ReFlex.Core.Tuio.Test
{
    [TestFixture]
    public class LogUtilitiesTest
    {
        private LoggingConfiguration _previousConfiguration;
        private MemoryTarget _memoryTarget;

        [SetUp]
        public void Setup()
        {
            // Store current configuration to restore it after each test.
            _previousConfiguration = LogManager.Configuration;

            // Capture all log entries in memory so assertions can validate deduplication behavior.
            _memoryTarget = new MemoryTarget("LogUtilitiesMemoryTarget")
            {
                Layout = "${level}|${message}|${exception:format=Type,Message}"
            };

            var config = new LoggingConfiguration();
            config.AddRuleForAllLevels(_memoryTarget);
            LogManager.Configuration = config;
            LogManager.ReconfigExistingLoggers();
        }

        [TearDown]
        public void TearDown()
        {
            // Ensure static deduplication state does not leak into the next test.
            LogUtilities.ClearLoggedErrors();

            // Restore original logging configuration for the rest of the test suite.
            LogManager.Configuration = _previousConfiguration;
            LogManager.ReconfigExistingLoggers();

            _memoryTarget?.Dispose();
        }

        [Test]
        public void TestNoAdditionalLogWhenKeyExists()
        {
            // Use a unique source scope so tests stay isolated even with shared static cache.
            var sourceName = CreateUniqueSourceName(nameof(TestNoAdditionalLogWhenKeyExists));
            var methodName = "SendUdp";

            // First occurrence should be logged.
            LogUtilities.LogErrorOnce(
                new InvalidOperationException("send failed"),
                sourceName,
                methodName);

            // Same exception signature in same source/method should be suppressed.
            LogUtilities.LogErrorOnce(
                new InvalidOperationException("send failed"),
                sourceName,
                methodName);

            // Exactly one log entry is expected.
            Assert.That(_memoryTarget.Logs.Count, Is.EqualTo(1));
        }

        [Test]
        public void TestClearAllowsLoggingAgain()
        {
            // Unique source keeps this test independent from other runs.
            var sourceName = CreateUniqueSourceName(nameof(TestClearAllowsLoggingAgain));
            var methodName = "SendTcp";

            // First log call should pass through.
            LogUtilities.LogErrorOnce(
                new InvalidOperationException("connection failed"),
                sourceName,
                methodName,
                "custom message");

            // Reset deduplication state for this source.
            LogUtilities.ClearLoggedErrors(sourceName);

            // After reset, same error must be logged again.
            LogUtilities.LogErrorOnce(
                new InvalidOperationException("connection failed"),
                sourceName,
                methodName,
                "custom message");

            // One log before and one log after clear.
            Assert.That(_memoryTarget.Logs.Count, Is.EqualTo(2));
            Assert.That(_memoryTarget.Logs[0], Does.Contain("custom message"));
            Assert.That(_memoryTarget.Logs[1], Does.Contain("custom message"));
        }

        [Test]
        public void TestDifferentMessagesAndExceptionTypesAreLoggedOnceEach()
        {
            // Unique source keeps this test independent from other runs.
            var sourceName = CreateUniqueSourceName(nameof(TestDifferentMessagesAndExceptionTypesAreLoggedOnceEach));
            var methodName = "SendOscMessageTcp";

            // Distinct signatures: message, type and inner-exception chain.
            LogUtilities.LogErrorOnce(
                new InvalidOperationException("message A"),
                sourceName,
                methodName);

            LogUtilities.LogErrorOnce(
                new InvalidOperationException("message B"),
                sourceName,
                methodName);

            LogUtilities.LogErrorOnce(
                new ArgumentException("message A"),
                sourceName,
                methodName);

            LogUtilities.LogErrorOnce(
                new InvalidOperationException("message A", new Exception("inner A")),
                sourceName,
                methodName);

            // Repeat all variants; duplicates should be suppressed.
            LogUtilities.LogErrorOnce(
                new InvalidOperationException("message A"),
                sourceName,
                methodName);

            LogUtilities.LogErrorOnce(
                new InvalidOperationException("message B"),
                sourceName,
                methodName);

            LogUtilities.LogErrorOnce(
                new ArgumentException("message A"),
                sourceName,
                methodName);

            LogUtilities.LogErrorOnce(
                new InvalidOperationException("message A", new Exception("inner A")),
                sourceName,
                methodName);

            // Four unique signatures should produce four logs total.
            Assert.That(_memoryTarget.Logs.Count, Is.EqualTo(4));
        }

        [Test]
        public void TestSameErrorIsLoggedOncePerMethod()
        {
            // Unique source keeps this test independent from other runs.
            var sourceName = CreateUniqueSourceName(nameof(TestSameErrorIsLoggedOncePerMethod));
            var firstMethod = "SendTcp";
            var secondMethod = "SendOscMessageTcp";

            // Same error in first method: only first call logs.
            LogUtilities.LogErrorOnce(
                new InvalidOperationException("same error"),
                sourceName,
                firstMethod);

            LogUtilities.LogErrorOnce(
                new InvalidOperationException("same error"),
                sourceName,
                firstMethod);

            // Same error in different method should log once again (method is part of the key).
            LogUtilities.LogErrorOnce(
                new InvalidOperationException("same error"),
                sourceName,
                secondMethod);

            LogUtilities.LogErrorOnce(
                new InvalidOperationException("same error"),
                sourceName,
                secondMethod);

            // One log per method is expected.
            Assert.That(_memoryTarget.Logs.Count, Is.EqualTo(2));
        }

        private static string CreateUniqueSourceName(string testName)
        {
            // A per-test unique source avoids cross-test interference through the static cache.
            return $"{nameof(LogUtilitiesTest)}.{testName}.{Guid.NewGuid()}";
        }
    }
}
