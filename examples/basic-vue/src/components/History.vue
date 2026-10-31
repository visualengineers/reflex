<template>
  <div class="message-container">
    <div
      v-for="message in rawData.frames"
      :key="message.frameNumber"
      class="message__box"
    >
      <p class="message__id">
        {{ message.frameNumber }}
      </p>
      <div>
        [
        <p
          v-for="point in message.points"
          :key="point.TouchId"
          class="message__tp"
        >
          {{ point }}
        </p>
        ]
      </div>
    </div>
  </div>
</template>
  
  <script>
  export default {
    name: "InteractionHistory",
    inject: ["rawData"],
  };
  </script>