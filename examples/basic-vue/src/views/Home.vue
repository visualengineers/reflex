<template>
  <div class="home">
        <div class="touchpoints__panel">
          <div v-for="touchPoint in touchData.points">
            <TouchPoint :point="touchPoint"/>
          </div>        
        </div>
        <div class="status__panel">
          <Status/>
        </div>
  </div>
</template>

<script>
import TouchPoint from '../components/TouchPoint.vue'
import Status from '../components/Status.vue';

export default {
  name: "Home",
  inject: ["touchData"],
  components: {
    TouchPoint,
    Status
  }
};
</script>
