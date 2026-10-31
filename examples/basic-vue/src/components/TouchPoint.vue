<template>
  <div>
    <div
      class="touchPoint"
      :style="{ transform: 'translate(' + point.posX + 'px, ' + point.posY + 'px) scale(' + scaleValue + ', ' + scaleValue + ')' }"
    >
      <div :class="className" />
      <div class="touchPoint__innerCircle">
        <p>
          {{ point.id }}
        </p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "TouchPoint",

  props: {
    point: {
      type: Object,
      required: true
    }
  },

  computed: {    
    scaleValue() {
      if (this.point.posZ) {
        return Math.abs(this.point.posZ);
      } else {
        return 0;
      }
    },

    className() {
      if (this.point.posZ) {
        return `touchPoint__outerCircle ${this.point.posZ < 0 ? ' push' : ' pull'}`;
      } else {
        return "touchPoint__outerCircle";
      }
    }
  },

  methods: {},
};
</script>