<template>
  <div class="root">
    <div id="nav">
      <router-link to="/">Home</router-link> |
      <router-link to="/about">About</router-link>
    </div>
    <div class="touchpoint-list" :key="this.currentData" v-if="currentData != []">
      <p>aktuelle Touchpoints</p>
      <ul>
        <li v-for="date in this.currentData">{{date.Position}}</li>
      </ul>
    </div>
    <router-view/>
  </div>
</template>

<script>

export default {
  name: "App",

  data () {
    return {
      connection: null,
      currentData: []
    };
  },

  methods: {
    sendMessage: function (message) {
      console.log("Hello");
      console.log(this.connection);
      this.connection.send(message);
    },
    updateData(points){
      this.currentData=points
    }
  },

  provide() {
    const touchData = {};
    Object.defineProperty(touchData, "touchPoints", {
      enumerable: true,
      get: () => this.currentData,
    });
    return {
      touchData
    }
  },

  created: function () {
    const that = this
    console.log("Starting connection to WebSocket Server");
    this.connection = new WebSocket("ws://localhost:40001/ReFlex");

    this.connection.onmessage = function (event) {
      if (event.data != []) {
        //console.log("new message detected");
        //console.log(event.data);
        var points = JSON.parse(event.data);

        if (points.length <= 0) {
          return;
        }

        that.updateData(points)
      }
    };

    this.connection.onopen = function (event) {
      console.log(event);
      console.log("Successfully connected to the echo websocket server...");
    };
  },
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

#nav {
  padding: 30px;
}

#nav a {
  font-weight: bold;
  color: #2c3e50;
}

#nav a.router-link-exact-active {
  color: #42b983;
}
</style>
