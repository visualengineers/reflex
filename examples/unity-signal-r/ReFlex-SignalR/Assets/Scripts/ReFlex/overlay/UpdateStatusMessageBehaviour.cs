using System.Collections;
using System.Collections.Generic;
using TMPro;
using UnityEngine;

public class UpdateStatusMessageBehaviour : MonoBehaviour
{
    [SerializeField] [Tooltip("Websocket behaviour")]
    private WebSocketClient client;

    private TMP_Text _text;

    private bool _skipUpdates = false;
    
    // Start is called before the first frame update
    void Start()
    {
        _text = gameObject.GetComponent<TMP_Text>();
    }

    // Update is called once per frame
    void Update()
    {
        StartCoroutine(UpdateStatus());
    }

    private IEnumerator UpdateStatus()
    {
        if (_skipUpdates)
            yield return null;

        _skipUpdates = true;

        yield return new WaitForSeconds(0.5f);

        _skipUpdates = false;
        
        if (_text != null)
            _text.text = client.StatusMsg;
    }
}
