<template>
  <div class="home">
    <div class="touchpoints__panel">
      <div
        v-for="touchPoint in touchData.points"
        :key="touchPoint.id"
      >
        <TouchPoint :point="touchPoint" />
      </div>
    </div>
    <div class="status__panel">
      <Status />
    </div>
    <History />
  </div>
</template>

<script>
import TouchPoint from '../components/TouchPoint.vue'
import Status from '../components/Status.vue';
import History from '../components/History.vue';

export default {
  name: "HomeView",
  components: {
    TouchPoint,
    Status,
    History
  },
  inject: ["touchData", "rawData"]
};
</script>
