# Template: React

<!-- omit in toc -->
## Table of contents

1. [Basic example](#basic-example)
2. [Setup and configuration](#setup-and-configuration)
3. [Receiving interaction data](#receiving-interaction-data)
4. [Visualization, status and history](#visualization-status-and-history)
5. [Shared types and styling](#shared-types-and-styling)

## Basic example

* location: `examples/basic-react/`
* technology: React + TypeScript, Vite and native WebSocket communication
* preconfigured websocket address (for setup in `Server`): `ws://localhost:40001/ReFlex`
* development server: `http://localhost:5173/` by default; use the address printed by Vite if that port is already occupied
* Features:
  * automatically connects to the ReFlex server when the application starts
  * visualizes interaction points with their `touchId`; position and depth control the position and size of each circle
  * displays the connection state, websocket address, local frame counter and current number of touches
  * displays a history of up to 100 entries with interaction data as JSON

Like the [Plain HTML template]({{ site.baseurl }}/software/templates/plain_html.html) and the [Angular template]({{ site.baseurl }}/software/templates/angular.html), this example demonstrates how to connect to ReFlex and receive interaction data. It provides a starting point for a React client using class components: the root component manages the websocket and application state, and passes data to child components through props. The current implementation uses React's built-in component state and does not use Redux.

__[⬆ back to top](#table-of-contents)__

## Setup and configuration

The example is part of the repository's npm workspaces. With Node.js and npm installed, run the following commands from the **repository root** to install dependencies, build the shared type definitions and start the development server:

{% highlight shell linenos %}
npm install
npm run build:shared-types
npm run start:example-react
{% endhighlight %}

Open the local address printed by Vite, normally `http://localhost:5173/`. The current scripts use Vite; the Create React App commands and port listed in the example's older `README.md` do not describe the current setup.

To create a production build, run `npm run build:example-react` from the repository root. This checks the TypeScript code and builds the application into `examples/basic-react/dist/`. To serve that build locally, run `npm run preview --workspace examples/basic-react` and open the address printed by Vite.

Start the ReFlex server and enable websocket broadcasting with an address matching the template. The Vite development server only serves the React application; it does not provide interaction data. The configured websocket endpoint must be reachable from the browser.

The address is passed to `ReFlexApp` in `examples/basic-react/src/main.tsx`, together with the initial browser window dimensions:

{% highlight tsx linenos %}
<ReFlexApp
  wsAddress='ws://localhost:40001/ReFlex'
  width={window.innerWidth}
  height={window.innerHeight}/>
{% endhighlight %}

Change `wsAddress` here when using another server endpoint. The same value is used for development and production builds; the template does not define separate environment-specific websocket settings. The props are described by `AppProps` in `src/types/app-props.ts`.

__[⬆ back to top](#table-of-contents)__

## Receiving interaction data

The central class is `ReFlexApp` in `src/app.tsx`. Its constructor initializes the component state and creates a native `WebSocket` using `props.wsAddress`. In `componentDidMount()`, it registers handlers for `onopen`, `onmessage` and `onclose`.

For each message, the `onmessage` handler converts the first character of JSON property names to lowercase. This maps server properties such as `TouchId` and `Position` to the TypeScript fields `touchId` and `position`. It then parses the interaction array, converts the normalized horizontal and vertical positions to pixels and updates the component state. The following excerpt shows this data flow:

{% highlight ts linenos %}
// convert json from PascalCase to camelCase
const convertToLowerCase = evt.data.replace(
  /"([^"]+)":/g,
  (_$0: string, $1: string) => {
    return '"' + $1.charAt(0).toLowerCase() + $1.slice(1) + '":';
  }
);

const points: Interaction[] = JSON.parse(
  convertToLowerCase
) as Interaction[];

// Convert positions before passing them to the components.
points.forEach((p) => {
  p.position.x = p.position.x * this.props.width;
  p.position.y = p.position.y * this.props.height;
});

this.update(points, true);
{% endhighlight %}

The state is described by `TouchPointState` in `src/types/touch-point-state.ts`:

| Field | Type | Purpose |
| --- | --- | --- |
| `points` | `Interaction[]` | Current interactions with `position.x` and `position.y` converted to pixels. An empty array clears the visualization and touch count. |
| `frameNumber` | `number` | Local counter incremented by `update()`. This method runs on connection opening, incoming messages and connection closing, so the counter is not a server frame identifier or a strict count of received messages. |
| `webSocketAddress` | `string` | Configured websocket address displayed in the status panel. |
| `isConnected` | `boolean` | Connection flag set to `true` on opening and message reception, and to `false` on closing. |

`update()` calls `setState()`, which causes React to render the updated data. The root component supplies the state to `Status`, creates a `TouchPoint` for each interaction and passes the current counter and points to `History` as an `InteractionFrame`.

Connection opening and closing are logged to the browser console. The example keeps connection handling minimal: it has no reconnect control, automatic reconnection or dedicated `onerror` handler. It also does not implement websocket cleanup on component unmount. Reload the page to establish a new connection after the server becomes available again.

__[⬆ back to top](#table-of-contents)__

## Visualization, status and history

### Interaction points

`TouchPoint` in `src/components/TouchPoint.tsx` renders one circle per interaction. `ReFlexApp` uses `touchId` as the React key and forwards the interaction fields as props. The circle's transform is calculated as follows:

{% highlight ts linenos %}
transform: `translate(${this.props.position.x}px, ${this.props.position.y}px) scale(${Math.abs(this.props.position.z)}, ${Math.abs(this.props.position.z)})`
{% endhighlight %}

* `position.x` and `position.y` already contain pixel coordinates because `ReFlexApp` multiplies the received values by its `width` and `height` props before storing them.
* The dimensions are captured in `src/main.tsx` when the application starts. There is no resize listener to update them; reload the page after changing the window size to use the new dimensions.
* `Math.abs(position.z)` scales the circle, so its size represents the magnitude of the depth value. At zero depth, the circle has zero scale.
* The sign of `position.z` selects the CSS class: negative values use `push` (green), while non-negative values use `pull` (red). As in the Angular template, the visualization uses the depth sign rather than the `type` field to choose the color.
* The center of each circle displays its `touchId`.

### Connection status

`Status` in `src/components/Status.tsx` renders the websocket address, local frame counter and `points.length` as the touch count. Its indicator uses the `connected` CSS class (green) or `disconnected` class (red) according to the `isConnected` prop. These values are supplied directly by `ReFlexApp`; the component does not poll the websocket.

### Message history

`History` in `src/components/History.tsx` receives the current `frameId` and `interactions` as props and stores entries in its own `HistoryState`. During rendering, it appends an entry if the identifier is greater than zero and has not already been recorded, then removes the oldest entry when the history exceeds 100 entries. Each entry displays its identifier and serializes its interactions with `JSON.stringify`. The message container uses `flex-direction: column-reverse`, placing newer entries at the bottom.

The history displays the data passed down by `ReFlexApp`: its `x` and `y` coordinates are in pixels rather than the normalized values received from the server. Opening and closing the connection also call `update()` with an empty interaction array and can therefore create empty history entries. This is an in-memory display of state updates; the template does not send messages to the logging backend used in the extended HTML example.

__[⬆ back to top](#table-of-contents)__

## Shared types and styling

### Shared TypeScript definitions

The package `@reflex/shared-types` in `packages/reflex-shared-types/` provides reusable TypeScript definitions corresponding to the framework's data structures. The React template imports `Interaction` and `InteractionFrame` from this package, which is available through the repository's npm workspace setup. Build it with `npm run build:shared-types` before building the example. When extracting the template into a separate project, make the package available there as well; the example's own `package.json` does not currently declare it as a dependency.

`Interaction` contains `touchId`, `position` (`Point3` with `x`, `y` and `z`), `type`, `extremumDescription`, `confidence` and `time`. It also serves as the props type for `TouchPoint`. `InteractionFrame` groups an array of interactions with a `frameId` and serves as the props type for `History`. These interfaces provide consistent field names for TypeScript code; the cast after `JSON.parse` does not validate websocket payloads at runtime.

### Styling

The template uses its own React components and the stylesheet `public/css/style.css`, which is loaded by `index.html`. This stylesheet defines the circle colors, status indicator, history layout, typography and toolbar. Fonts and images are stored under `public/fonts/` and `public/img/`.

See the [style guide]({{ site.baseurl }}/design/style-guide.html) for the shared visual design. The Angular-specific package `@reflex/angular-components` is not used by the React template.

__[⬆ back to top](#table-of-contents)__
