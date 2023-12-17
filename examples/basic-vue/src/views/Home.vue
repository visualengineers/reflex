<template>
  <div class="home">
        <div class="touchpoints__panel">
         <TouchPoint  />
        </div>
  </div>
</template>

<script>
import TouchPoint from '../components/TouchPoint.vue'

export default {
  name: "Home",
  components: {
    TouchPoint,
  },
};
</script>

<style>
.touchpoints__panel {
    background-color: lightslategray;
    width: 960px;
    height: 540px;
    margin: auto;
    position: relative;
    top: 0;
    left: 0;
}
</style>
