using System;
using System.Collections;
using System.Collections.Generic;
using Newtonsoft.Json;
using ReFlex.Core.Common.Components;
using ReFlex.events;
using UnityEngine;
using UnityEngine.Events;
using WebSocketSharp;


public class WebSocketClient : MonoBehaviour
{
    #region Fields

    private WebSocket _ws;
    private int _idleCount = 0;
    private bool _isReconnecting;

    #endregion

    #region Unity Editor Fields

    [SerializeField] [Tooltip("Address of the ReFlex websocket server broadcasting interactions")]
    private string webSocketAddress = "ws://localhost:40001/ReFlex";

    [SerializeField]
    [Tooltip(
        "maximum number of updates until connection is Closed (In case, connection is broken without closing event or sensor stopped working.)")]
    private int numFramesIdle = 100;

    [SerializeField] [Tooltip("Storage for current interactions")]
    private InteractionProvider interactionProvider;

    [SerializeField]
    [Tooltip("Check this if Behaviour should automatically reconnect, if connection is not successful or closed.")]
    private bool autoConnect = true;

    #endregion

    #region Properties

    public bool IsConnected { get; private set; } = false;
    
    public string StatusMsg { get; private set; }
    
    public string Address => webSocketAddress;

    #endregion
    
    #region events
    
    public WebSocketConnectionStateChangedEvent onConnectionStateChanged;

    public UnityEvent onDisconnected;
    public UnityEvent onConnected;

    #endregion

    // Start is called before the first frame update
    void Start()
    {
        Connect();
    }

    private void Connect()
    {
        StatusMsg = $"Start connecting to {webSocketAddress}.";
        Debug.Log(StatusMsg);
        
        _ws = new WebSocket(webSocketAddress);
        _ws.OnMessage += HandleMessage;
        _ws.OnError += HandleWebSocketError;
        _ws.OnClose += CloseWebSocketConnection;
        _ws.OnOpen += OpenWebSocketConnection;

        _ws.Connect();
    }

    private void Disconnect() {
        if (_ws == null)
            return;

        StatusMsg = $"Disconnecting from {webSocketAddress}.";
        Debug.Log(StatusMsg);
        
        _ws.OnMessage -= HandleMessage;
        _ws.OnError -= HandleWebSocketError;
        _ws.OnClose -= CloseWebSocketConnection;
        _ws.OnOpen -= OpenWebSocketConnection;
        _ws.Close();
    }

    private void OpenWebSocketConnection(object sender, EventArgs e)
    {
        IsConnected = true;
        onConnectionStateChanged.Invoke(IsConnected);
        onConnected.Invoke();
        StatusMsg = $"Successfully connected to {webSocketAddress}.";
        Debug.Log(StatusMsg);
    }

    private void CloseWebSocketConnection(object sender, CloseEventArgs e)
    {
        IsConnected = false;
        onConnectionStateChanged.Invoke(IsConnected);
        onDisconnected.Invoke();
        StatusMsg = $"Websocket {webSocketAddress} closed with code: {e.Code}, Reason: {e.Reason}.";
        Debug.LogWarning(StatusMsg);

        if (autoConnect)
        {
            StartCoroutine(AttemptReconnect());
        }
    }

    private void HandleWebSocketError(object sender, ErrorEventArgs e)
    {
        IsConnected = false;
        onConnectionStateChanged.Invoke(IsConnected);
        onDisconnected.Invoke();
        StatusMsg = $"Websocket {webSocketAddress} error: {e.Message} | {e.Exception}.";
        Debug.LogError(StatusMsg);
        
        if (autoConnect)
        {
            StartCoroutine(AttemptReconnect());
        }
    }

    private void HandleMessage(object sender, MessageEventArgs e)
    {
        
        // var interactions = JsonUtility.FromJson<List<Interaction>>(e.Data);
        var interactions = JsonConvert.DeserializeObject<List<Interaction>>(e.Data);
        if (interactionProvider != null)
            interactionProvider.UpdateInteractions(interactions);
    }

    // Update is called once per frame
    void Update()
    {
        _idleCount++;
        if (_idleCount > numFramesIdle)
        {
            ResetConnectionState();
        }
    }

    private void OnDestroy()
    {
        autoConnect = false;
        
        if (_ws == null)
            return;
        _ws.OnMessage -= HandleMessage;
        _ws.OnError -= HandleWebSocketError;
        _ws.OnClose -= CloseWebSocketConnection;
        _ws.OnOpen -= OpenWebSocketConnection;
        _ws.Close();
    }

    private void ResetConnectionState()
    {
        IsConnected = false;
        if (interactionProvider != null)
            interactionProvider.ClearInteractions();
    }

    private IEnumerator AttemptReconnect()
    {
        if (_isReconnecting) 
            yield return null;

        _isReconnecting = true;

        yield return new WaitForSeconds(3);
        
        StatusMsg = "Start Reconnect.";
        Debug.Log(StatusMsg);

        _isReconnecting = false;
        Disconnect();
        Connect();
    }
}