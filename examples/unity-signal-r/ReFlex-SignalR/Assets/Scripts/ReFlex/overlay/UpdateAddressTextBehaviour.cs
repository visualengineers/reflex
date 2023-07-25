using System.Collections;
using System.Collections.Generic;
using TMPro;
using UnityEngine;

public class UpdateAddressScript : MonoBehaviour
{
    [SerializeField] [Tooltip("Websocket behaviour")]
    private WebSocketClient client;
    
    // Start is called before the first frame update
    void Start()
    {
        var text = gameObject.GetComponent<TMP_Text>();
        if (text != null)
            text.text = client.Address;
    }

    // Update is called once per frame
    void Update()
    {
        
    }
}
