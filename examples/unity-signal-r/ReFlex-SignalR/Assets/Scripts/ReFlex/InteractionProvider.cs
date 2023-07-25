using System.Collections.Generic;
using ReFlex.Core.Common.Components;
using ReFlex.events;
using UnityEngine;

public class InteractionProvider : MonoBehaviour
{
    #region Properties

    public List<Interaction> CurrentInteractions { get; } = new List<Interaction>();

    public InteractionsUpdatedEvent onInteractionsUpdated;

    #endregion

    // Start is called before the first frame update
    void Start()
    {
    }

    // Update is called once per frame
    void Update()
    {
    }

    public void UpdateInteractions(List<Interaction> newInteractions)
    {
        ClearInteractions();
        CurrentInteractions.AddRange(newInteractions);
        
        onInteractionsUpdated?.Invoke(CurrentInteractions);
    }

    public void ClearInteractions(bool propagateUpdate = false)
    {
        CurrentInteractions.Clear();

        if (propagateUpdate)
        {
            onInteractionsUpdated?.Invoke(CurrentInteractions);
        }
    }
}