using System.Collections;
using System.Collections.Generic;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Util;
using TMPro;
using UnityEngine;
using Vector3 = UnityEngine.Vector3;

public class DisplayInteractionElementBehaviour : MonoBehaviour
{
    [SerializeField] [Tooltip("Text Component to display Position of Touch Point")]
    private TMP_Text position;
    
    [SerializeField] [Tooltip("Text Component to display Id Touch Point")]
    private TMP_Text touchId;

    [SerializeField] [Tooltip("game object to visualize default interaction type (fallback)")]
    private GameObject defaultVis;
    
    [SerializeField] [Tooltip("game object to visualize push interaction type")]
    private GameObject pushVis;
    
    [SerializeField] [Tooltip("game object to visualize pull interaction type ")]
    private GameObject pullVis;
    
    [SerializeField] [Tooltip("game object to visualize undefined interaction type")]
    private GameObject undefinedVis;
    
    // Start is called before the first frame update
    void Start()
    {
        
    }

    // Update is called once per frame
    void Update()
    {
        
    }

    public void SetValues(Interaction interaction)
    {
        if (position != null)
            position.text =
                $"[ {interaction.Position.X:F2} | {interaction.Position.Y:F2} | {interaction.Position.Z:F2} ]";

        if (touchId != null)
            touchId.text = $"{interaction.TouchId}";

        var scale = 0.8f + (interaction.Confidence % 50f) * 0.04f;

        if (defaultVis != null)
        {
            defaultVis.SetActive(interaction.ExtremumDescription == null);
            defaultVis.transform.localScale = new Vector3(scale, scale, scale);
        }

        if (interaction.ExtremumDescription == null)
        {
            if (pushVis != null)
                pushVis.SetActive(false);
            
            if (pullVis != null)
                pullVis.SetActive(false);
            
            if (undefinedVis != null)
                undefinedVis.SetActive(false);
        }

        if (pushVis != null)
        {
            pushVis.SetActive(interaction.ExtremumDescription.Type == ExtremumType.Minimum);
            pushVis.transform.localScale = new Vector3(scale, scale, scale);
        }

        if (pullVis != null)
        {
            pullVis.SetActive(interaction.ExtremumDescription.Type == ExtremumType.Maximum);
            pullVis.transform.localScale = new Vector3(scale, scale, scale);
        }

        if (undefinedVis != null)
        {
            undefinedVis.SetActive(interaction.ExtremumDescription.Type == ExtremumType.Undefined);
            undefinedVis.transform.localScale = new Vector3(scale, scale, scale);
        }

    }
}
