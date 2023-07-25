<template>
  <div>
    <div
      className="touchpoints__item"
      :style="{ left: positionLeft + 'px', top: positionTop + 'px' }"
    ></div>
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
  },

  methods: {},
};
</script>

<style>
.touchpoints__item {
  border-radius: 50%;
  width: 20px;
  height: 20px;
  background-color: lime;
  position: relative;
}
</style>
