<template>
  <div class="home">
        <div class="touchpoints__panel">
          <div v-for="touchPoint in touchData.points">
            <TouchPoint :point="touchPoint"/>
          </div>        
        </div>
  </div>
</template>

<script>
import TouchPoint from '../components/TouchPoint.vue'

export default {
  name: "Home",
  inject: ["touchData"],
  components: {
    TouchPoint
  }
};
</script>
