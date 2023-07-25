using System.Collections;
using System.Collections.Generic;
using ReFlex.Core.Common.Components;
using UnityEngine;
using Vector2 = UnityEngine.Vector2;

public class UpdateInteractionVisualizationBehaviour : MonoBehaviour
{
    [SerializeField] [Tooltip("Prefab for visualizing Interaction points")]
    private GameObject visualization;

    [SerializeField] [Tooltip("canvas to place Interaction points")]
    private Canvas canvas;

    private readonly List<GameObject> createdPrefabs = new List<GameObject>();
    private readonly List<Interaction> _currentInteractions = new List<Interaction>();
    private bool _needsUpdate = false;


    // Start is called before the first frame update
    void Start()
    {
        // provider.
    }

    // Update is called once per frame
    void Update()
    {
        if (!_needsUpdate)
            return;

        UpdateVisualization();
    }

    public void UpdateInteractions(List<Interaction> interactions)
    {
        _currentInteractions.Clear();
        _currentInteractions.AddRange(interactions);
        _needsUpdate = true;
    }

    private void UpdateVisualization()
    {
        createdPrefabs.ForEach(go => Destroy(go));
        var interactions = new Interaction[_currentInteractions.Count];
        _currentInteractions.CopyTo(interactions);

        foreach (var i in interactions)
        {
            var vis = Instantiate(visualization);
            if (canvas == null || vis == null)
                return;

            vis.transform.SetParent(canvas.transform, false);
            var rTrans = vis.GetComponent<RectTransform>();
            var cTrans = canvas.GetComponent<RectTransform>();
            if (rTrans != null && cTrans != null)
            {
                var x = cTrans.rect.width * i.Position.X;
                var y = cTrans.rect.height * (1.0f -i.Position.Y);
                
                rTrans.anchoredPosition = new Vector2(x,y);
            }

            var props = vis.GetComponent<DisplayInteractionElementBehaviour>();
            if (props != null)
                props.SetValues(i);
            
            createdPrefabs.Add(vis);
        }

        _needsUpdate = false;
    }
}