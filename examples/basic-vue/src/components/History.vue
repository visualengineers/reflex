<template>
    <div class="message-container">
        <div class="message__box" v-for="message in this.rawData.frames">
            <p class="message__id">{{ message.frameNumber }}</p>
            <div>
                [
                <p v-for="point in message.points" class="message__tp">
                    {{ point }}
                </p>
                ]
            </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: "History",
    inject: ["rawData"],
  };
  </script>