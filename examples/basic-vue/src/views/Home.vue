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
        <History/>
  </div>
</template>

<script>
import TouchPoint from '../components/TouchPoint.vue'
import Status from '../components/Status.vue';
import History from '../components/History.vue';

export default {
  name: "Home",
  inject: ["touchData", "rawData"],
  components: {
    TouchPoint,
    Status, 
    History
  }
};
</script>
