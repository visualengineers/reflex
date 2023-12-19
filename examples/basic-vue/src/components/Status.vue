<template>
  <div class="status__stats">
    <div class="status__stats--header">
        <div :class="statusClassName"></div>
        <p>Address</p>
    </div>
    <div class="status__stats--item">{{touchData.webSocketAddress}}</div>
    <div class="status__stats--header">FrameNumber</div>
    <div class="status__stats--item">{{touchData.frameNumber}}</div>
    <div class="status__stats--header">Touches</div>
    <div class="status__stats--item">{{touchCount}}</div>
  </div>
</template>

<script>
export default {
  name: "Status",
  inject: ["touchData"],
  computed: {
    touchCount() {
      return this.touchData?.points?.length ?? 0;
    },

    statusClassName() {
      return `status__indicator ${(this.touchData?.isConnected ?? false) ? 'connected' : 'disconnected'}`;
    }
  }
};
</script>