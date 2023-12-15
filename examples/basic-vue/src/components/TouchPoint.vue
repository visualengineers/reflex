<template>
  <div>
    <div
      className="touchpoints__item"
      :style="{ transform: 'translate(' + positionLeft + 'px, ' + positionTop + 'px) scale(' + scaleValue + ', ' + scaleValue + ')' }"
    >
    <p>
      {{ pointId }}
    </p>
    </div>
  </div>
</template>

<script>
export default {
  name: "TouchPoint",

  data() {
    return {
      Point: {
        id: 0,
        posX: 0,
        posY: 0,
        posZ: 0,
      },
    };
  },

  inject: ["touchData"],

  computed: {
    pointId() {
        this.Point.id = this.touchData.touchPoints[0].TouchId
        return this.touchData.touchPoints[0].TouchId;
    },
    pointPosX() {
        this.Point.posX = this.touchData.touchPoints[0].Position.X
        return this.touchData.touchPoints[0].Position.X
    },
    pointPosY() {
        this.Point.posY = this.touchData.touchPoints[0].Position.Y
        return this.touchData.touchPoints[0].Position.Y;
    },
    pointPosZ() {
        this.Point.posZ = this.touchData.touchPoints[0].Position.Z
        return this.touchData.touchPoints[0].Position.Z;
    },
    positionTop() {
      if (this.touchData.touchPoints[0]) {
        return this.touchData.touchPoints[0].Position.Y * 540;
      } else {
        return -10;
      }
    },
    positionLeft() {
      if (this.touchData.touchPoints[0]) {
        return this.touchData.touchPoints[0].Position.X * 960;
      } else {
        return -10;
      }
    },    
    scaleValue() {
      if (this.touchData.touchPoints[0]) {
        return Math.abs(this.touchData.touchPoints[0].Position.Z);
      } else {
        return 0;
      }
    }
  },

  methods: {},
};
</script>

<style>
.touchpoints__item {
  border-radius: 50%;
  width: 150px;
  height: 150px;
  margin-top:-75px;
  margin-left: -75px;
  background-color: #0c5e04;
  position: relative;

  display: flex;
  justify-content: center;
  align-items: center;
}

.touchpoints__item p {
  font-weight: 600;
  font-size: 4rem;
  color: white;
}
</style>
