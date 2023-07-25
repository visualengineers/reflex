// update function when touch points arrive
export function setPoint(touchId, touchPositionX, touchPositionY, touchPositionZ) {
    return {
      type: "UPDATE",
      payload: {
        updatedPoint: {            
                id: touchId,
                posX: touchPositionX,
                posY: touchPositionY,
                posZ: touchPositionZ
            }
        }
    }
}