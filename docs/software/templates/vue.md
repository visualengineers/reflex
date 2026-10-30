# Template: Vue.js

<!-- omit in toc -->
## Table of contents

1. [Basic example](#basic-example)
2. [Setup and configuration](#setup-and-configuration)
3. [Receiving interaction data](#receiving-interaction-data)
4. [Visualization, status and history](#visualization-status-and-history)
5. [Shared types and styling](#shared-types-and-styling)

## Basic example

* location: `examples/basic-vue/`
* technology: Vue 3 + JavaScript, Vue CLI and native WebSocket communication
* preconfigured websocket address (for setup in `Server`): `ws://localhost:40001/ReFlex`
* development server: `http://localhost:8080/` by default; use the address printed by Vue CLI if that port is already occupied
* Features:
  * automatically connects to the ReFlex server when the application starts
  * visualizes interaction points with their touch identifiers; position and depth control the position and size of each circle
  * displays the connection state, websocket address, received frame count and current number of touches
  * displays a history of up to 100 entries containing the original interaction objects

Like the [Plain HTML template]({{ site.baseurl }}/software/templates/plain_html.html), the [Angular template]({{ site.baseurl }}/software/templates/angular.html) and the [React template]({{ site.baseurl }}/software/templates/react.html), this example demonstrates how to connect to ReFlex and receive interaction data. It provides a starting point for a Vue client using single-file components and the Options API. The root component manages the websocket and application data, while descendant components access the current state through `provide` and `inject`.

__[⬆ back to top](#table-of-contents)__

## Setup and configuration

The example is part of the repository's npm workspaces. With Node.js and npm installed, run the following commands from the **repository root** to install dependencies and start the development server:

{% highlight shell linenos %}
npm install
npm run start:example-vue
{% endhighlight %}

Open the local address printed by Vue CLI, normally `http://localhost:8080/`. To create a production build, run `npm run build:example-vue` from the repository root. The output is written to `examples/basic-vue/dist/`.

The `serve` and `build` scripts use `vue-cli-service`. The separate `vite.config.js` configures the Vue plugin and the Vitest test environment; it is not the configuration used by these development and production build commands.

Start the ReFlex server and enable websocket broadcasting with an address matching the template. The development server only serves the Vue application; it does not provide interaction data. The configured websocket endpoint must be reachable from the browser. The current source uses port `40001`, whereas the example's older `README.md` still refers to port `50001`.

The address is configured in the `created()` hook in `examples/basic-vue/src/App.vue`. It appears twice: in the `address` constant used for the status display and in the `WebSocket` constructor:

{% highlight js linenos %}
const address = "ws://localhost:40001/ReFlex";
var frameNumber = 0;
const that = this;
console.log("Starting connection to WebSocket Server");
this.connection = new WebSocket("ws://localhost:40001/ReFlex");
{% endhighlight %}

Change both address strings when using another endpoint. The same values are used for development and production builds; the template does not define separate environment-specific websocket settings.

`src/main.js` creates the Vue application, installs the router and mounts `App` on `#app`. The router in `src/router/index.js` defines a home route with hash history. The current `App.vue` template renders `Home` directly rather than using a `router-view`.

__[⬆ back to top](#table-of-contents)__

## Receiving interaction data

`App.vue` creates a native `WebSocket` and registers handlers for `onopen`, `onmessage` and `onclose` in its `created()` hook. Incoming messages are parsed with `JSON.parse` and passed to `updateData()` together with the address, an incremented local frame counter and the connection flag.

Unlike the Angular and React examples, the Vue template reads the server's PascalCase property names directly. `updateData()` creates a separate array for visualization, mapping `TouchId` and `Position` to a smaller object with pixel coordinates:

{% highlight js linenos %}
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
{% endhighlight %}

The method replaces `currentData` with the converted points and status values, then appends the original points to the history. Its data structures are:

| Field | Content | Purpose |
| --- | --- | --- |
| `connection` | Native `WebSocket` instance | Connection to the ReFlex server. |
| `currentData.points` | Objects with `id`, `posX`, `posY` and `posZ` | Current visualization data. Horizontal and vertical coordinates are in pixels; depth is unchanged. |
| `currentData.webSocketAddress` | Configured address | Address displayed in the status panel after a connection event or message. |
| `currentData.frameNumber` | Local message counter | Incremented for each parsed incoming interaction array, including an empty array. This is not a server frame identifier. |
| `currentData.isConnected` | Connection flag | Set to `true` on opening and message reception, and to `false` on closing. |
| `history` | Entries with `frameNumber` and `points` | Up to 100 entries containing the original parsed interaction arrays. |

The `provide()` function exposes two objects, `touchData` and `rawData`. Their properties use getters to read the current component data: `touchData` exposes the visualization and status fields, and `rawData.frames` exposes the history. `Home` and its child components use `inject` to access these objects without forwarding every field through intermediate component props. `Home` passes each converted point to `TouchPoint` through its `point` prop.

Connection opening and closing are logged to the browser console. Both events call `updateData()` with an empty interaction array, which clears the displayed points. The example keeps connection handling minimal: it has no reconnect control, automatic reconnection or dedicated `onerror` handler, and does not close the websocket in an unmount hook. Reload the page to establish a new connection after the server becomes available again.

__[⬆ back to top](#table-of-contents)__

## Visualization, status and history

### Interaction points

`Home` in `src/views/Home.vue` iterates over `touchData.points` with `v-for` and creates one `TouchPoint` per interaction. `TouchPoint` in `src/components/TouchPoint.vue` binds the position and scale through an inline style:

{% highlight html linenos %}{% raw %}
:style="{ transform: 'translate(' + point.posX + 'px, ' + point.posY + 'px) scale(' + scaleValue + ', ' + scaleValue + ')' }"
{% endraw %}{% endhighlight %}

* `posX` and `posY` already contain pixel coordinates because `updateData()` multiplies the normalized server coordinates by `window.innerWidth` and `window.innerHeight`.
* The window dimensions are read on each call to `updateData()`. A subsequent incoming frame therefore uses the current dimensions after resizing; there is no separate resize listener to reposition existing points immediately.
* The computed property `scaleValue` returns `Math.abs(point.posZ)` for a non-zero depth and zero otherwise. The circle's size therefore represents the magnitude of the depth value, with zero scale at zero depth.
* The computed property `className` selects `push` (green) for negative depth and `pull` (red) for positive depth. At zero depth it returns only the base `touchPoint__outerCircle` class. The color is derived from the depth sign rather than the server's `Type` field.
* The center of each circle displays `point.id`, taken from the server's `TouchId`.

### Connection status

`Status` in `src/components/Status.vue` injects `touchData` and displays its websocket address, frame counter and current number of points. The computed property `touchCount` reads `touchData.points.length`, while `statusClassName` selects the `connected` CSS class (green) or `disconnected` class (red). These values come from the root component's state; the component does not poll the websocket.

### Message history

`History` in `src/components/History.vue` injects `rawData` and iterates over `rawData.frames`. Each entry displays its local `frameNumber` and the original interaction objects through Vue's text interpolation:

{% highlight html linenos %}{% raw %}
<p class="message__id">{{ message.frameNumber }}</p>
<div>
  [
  <p v-for="point in message.points" class="message__tp">
    {{ point }}
  </p>
  ]
</div>
{% endraw %}{% endhighlight %}

The history retains the PascalCase fields and normalized coordinates received from the server; the conversion for visualization creates new objects and leaves these original values unchanged. Every call to `updateData()` appends an entry and removes the oldest entry if the history exceeds 100 entries. Opening and closing the connection also append empty entries without incrementing the message counter, so multiple entries can share a frame number.

The message container uses `flex-direction: column-reverse`, placing newer entries at the bottom. This is an in-memory display of incoming data and connection events; the template does not send messages to the logging backend used in the extended HTML example.

__[⬆ back to top](#table-of-contents)__

## Shared types and styling

### Data structures and shared TypeScript definitions

The current Vue template is written in JavaScript and does not import `@reflex/shared-types`. It can therefore be started and built without first building the shared type package. It expects incoming messages to contain arrays of objects with the server's PascalCase fields, particularly `TouchId` and `Position.X`, `Position.Y` and `Position.Z`. The parsed payload is not validated against a schema at runtime.

For a TypeScript-based extension, the package in `packages/reflex-shared-types/` provides reusable definitions such as `Interaction` and `InteractionFrame`, as used by the Angular and React examples. Its fields use camelCase, so using these definitions with the Vue template's incoming data requires a corresponding property-name conversion. The Vue history's current shape, `{ frameNumber, points }`, also differs from `InteractionFrame`, which uses `{ frameId, interactions }`.

### Styling

The template uses its own Vue components and the stylesheet `public/css/style.css`, which is loaded by `public/index.html`. This stylesheet defines the circle colors, status indicator, history layout, typography and toolbar. Fonts and images are stored under `public/fonts/` and `public/img/`.

See the [style guide]({{ site.baseurl }}/design/style-guide.html) for the shared visual design. The Angular-specific package `@reflex/angular-components` is not used by the Vue template.

__[⬆ back to top](#table-of-contents)__
