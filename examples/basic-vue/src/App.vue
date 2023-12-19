<template>
  <div class="root">
    <Home></Home>
  </div>
</template>

<script>
import Home from './views/Home.vue';


export default {
    name: "App",
    data() {
        return {
            connection: null,
            currentData: {
                points: [],
                webSocketAddress: "ws://",
                frameNumber: 0,
                isConnected: false
            },
            history: []
        };
    },
    methods: {
        sendMessage: function (message) {
            this.connection.send(message);
        },
        updateData(points, address, frameNumber, isConnected) {
          const width = window.innerWidth;
          const height = window.innerHeight;          

          const convertedPoints = points.map((p) => {
            return {
              id: p.TouchId,
              posX: p.Position.X * width,
              posY: p.Position.Y * height,
              posZ: p.Position.Z
            }
          })

          this.currentData = {
              points: convertedPoints,
              webSocketAddress: address,
              frameNumber: frameNumber,
              isConnected: isConnected
          };

          const historyItem = { frameNumber: frameNumber, points: points };

          this.history.push(historyItem);
          if (this.history.length > 100) {
            this.history.splice(0, 1);
          }
          
        }
    },
    provide() {
        const touchData = {};
        const rawData = {};
        Object.defineProperty(touchData, "points", {
            enumerable: true,
            get: () => this.currentData.points,
        });
        Object.defineProperty(touchData, "webSocketAddress", {
          get: () => this.currentData.webSocketAddress
        });
        Object.defineProperty(touchData, "frameNumber", {
          get: () => this.currentData.frameNumber
        });
        Object.defineProperty(touchData, "isConnected", {
          get: () => this.currentData.isConnected
        });

        Object.defineProperty(rawData, "frames", {
          enumerable: true,
          get: () => this.history,
        })
        return {
            touchData,
            rawData
        };
    },
    created: function () {
        const address = "ws://localhost:40001/ReFlex";
        var frameNumber = 0;
        const that = this;
        console.log("Starting connection to WebSocket Server");
        this.connection = new WebSocket("ws://localhost:40001/ReFlex");
        this.connection.onmessage = function (event) {
            if (event.data != []) {
                //console.log("new message detected");
                //console.log(event.data);
                var points = JSON.parse(event.data);
                if (points.length < 0) {
                    return;
                }
                frameNumber++;
                that.updateData(points, address, frameNumber, true);
            }
        };
        this.connection.onopen = function (event) {
            console.log(event);
            console.log("Successfully connected to the echo websocket server...");
            that.updateData([], address, frameNumber, true);
        };
        this.connection.onclose = function (event) {
            console.log(event);
            console.log("Connection closed.");
            that.updateData([], address, frameNumber, false);
        };
    },
    components: { Home }
};
</script>
