using System;
using System.Collections.Generic;
using System.Net;
using System.Runtime.CompilerServices;
using System.Threading.Tasks;
using CoreOSC;
using NLog;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Tuio.Components;
using ReFlex.Core.Tuio.Interfaces;
using ReFlex.Core.Tuio.Util;

[assembly: InternalsVisibleTo("ReFlex.Tuio.Test")]
namespace ReFlex.Core.Tuio
{
    public class TuioBroadcast : ITuioBroadcast, IDisposable
    {
        #region Fields

        private static readonly Logger Log = LogManager.GetCurrentClassLogger();

        private readonly ITuioMessageBuilder _builder;
        private readonly ITuioSender _sender;

        private string _localAddress = "Localhost";

        #endregion

        #region Properties

        /// <summary>
        /// Specify whether the instance has a valid configuration
        /// </summary>
        public bool IsConfigured { get; private set; }

        /// <summary>
        /// Specifies whether the service is currently sending data.
        /// </summary>
        public bool IsSending { get; private set; }

        /// <summary>
        /// Current Configuration for sending
        /// </summary>
        public TuioConfiguration Configuration { get; private set; }

        /// <summary>
        /// Storage for Frame Id. Is incremented when <see cref="Broadcast"/> was successful.
        /// </summary>
        public int FrameId { get; private set; }

        #endregion

        #region Constructor

        /// <summary>
        /// internal Constructor for Testing purposes
        /// </summary>
        /// <param name="messageBuilder">constructs the TUIO messages</param>
        /// <param name="sender">sends the data to TUIO server</param>
        internal TuioBroadcast(ITuioMessageBuilder messageBuilder, ITuioSender sender)
        {
            _builder = messageBuilder;
            _sender = sender;
        }

        /// <summary>
        /// initializes the Broadcast service.
        /// Creates a <see cref="TuioMessageBuilder"/> for generating messages according to TUIO specification.
        /// Creates a <see cref="TuioSender"/> for sending the data.
        /// Needs to call <see cref="Configure"/> before sending is enabled.
        /// </summary>
        public TuioBroadcast() : this(new TuioMessageBuilder(), new TuioSender())
        {
        }

        #endregion

        #region public Methods

        /// <summary>
        /// Initializes the service with the provided configuration.
        /// First, all open connections are closed on <see cref="TuioSender"/>
        /// then current hostname is retrieved and stored as local Address for TUIO identification
        /// <see cref="Configuration"/> is set
        /// <see cref="IsConfigured"/> is set to true, if <see cref="Configuration"/> is not null and <see cref="TuioSender.IsInitialized"/>
        /// </summary>
        /// <param name="config">Configuration containing (at least) server address, port and <see cref="TransportProtocol"/></param>
        /// <returns>completed Task</returns>
        public async Task Configure(TuioConfiguration config)
        {
            await _sender.StopAllConnections();

            _sender.Initialize(config);

            // Get the Name of HOST
            var hostName = Dns.GetHostName();

            // Get the IP from GetHostByName method of dns class.
            var entry = await Dns.GetHostEntryAsync(hostName);

            _localAddress = entry.AddressList[0].ToString();

            Configuration = config;

            IsConfigured = Configuration != null && _sender.IsInitialized;

            Log.Info($"Sucessfully configured {nameof(TuioBroadcast)}: {config?.GetTuioConfigurationString() ?? "No configuration"}");
        }

        /// <summary>
        /// Broadcast data according to the current configuration to TUIO server
        /// If <see cref="Configuration"/> is null or  <see cref="IsConfigured"/> is false, nothing is sent.
        /// Also checks, if <see cref="IsSending"/> is true and only send if this is not the case.
        /// Constructs <see cref="TuioParameters"/> from <see cref="interactions"/>, current <see cref="Configuration"/>, frame id and local address.
        /// Sends data based on specified <see cref="TransportProtocol"/> in <see cref="Configuration"/> and increases frame i afterwards.
        /// </summary>
        /// <param name="interactions">interactions that are transformed into TUIO packages</param>
        /// <returns>completed Task</returns>
        public async Task<string> Broadcast(List<Interaction> interactions)
        {
            if (Configuration == null || !IsConfigured)
            {
                Log.Warn(
                    $"Cannot {nameof(Broadcast)} interactions, because {nameof(TuioBroadcast)} is has no valid configuration.");
                return "";
            }

            // skip if last message is still being sent
            if (IsSending)
                return "";

            var tuioParams = new TuioParameters(_localAddress, Configuration, interactions, FrameId);

            var bndl = CreateOscBundle(tuioParams);

            IsSending = true;

            switch (Configuration.Transport)
            {
                case TransportProtocol.Udp:
                    await _sender.SendUdp(bndl);
                    break;
                case TransportProtocol.Tcp:
                    await _sender.SendTcp(bndl);
                    break;
                case TransportProtocol.WebSocket:
                    await _sender.SendWebSocket(bndl);
                    break;
                default:
                    IsSending = false;
                    throw new ArgumentOutOfRangeException();
            }

            FrameId++;

            IsSending = false;

            return _builder.GenerateStringRepresentation(bndl);
        }

        /// <summary>
        /// resets <see cref="IsConfigured"/>, <see cref="IsSending"/>, frame Id.
        /// Also stops all connections on <see cref="TuioSender"/>
        /// </summary>
        public async void Dispose()
        {
            IsConfigured = false;
            FrameId = 0;
            IsSending = false;
            IsConfigured = false;
            await _sender.StopAllConnections();
        }

        #endregion

        #region private Methods

        private OscBundle CreateOscBundle(TuioParameters parameters)
        {
            return new OscBundle(parameters.Time, CreateOscMessages(Configuration.Protocol, parameters));
        }

        private IEnumerable<OscMessage> CreateOscMessages(ProtocolVersion tuioVersion, TuioParameters parameters)
        {
            return tuioVersion == ProtocolVersion.TUIO_VERSION_1_1
                ? _builder.CreateTuio11Messages(parameters, Configuration.Interpretation)
                : _builder.CreateTuio20Messages(parameters, Configuration.Interpretation);
        }

        #endregion
    }
}
