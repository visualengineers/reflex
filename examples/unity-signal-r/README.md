# ReFlex: Unity

Unity Plugin for communication with ReFlex using WebSockets and SignalR

## Requirements

| Component     | Name                                                  | Version     | Remark       |
| ------------- | ----------------------------------------------------- | ----------- | ------------ |
| Editor        | Unity                                                 | 6000.0.53f1 |              |
| IDE           | JetBrains Rider                                       | 2025.1.3    | recommended  |
| Nuget package | Microsoft.AspNetCore.SignalR.Client                   | 7.0.5       |              |
| Nuget package | Microsoft.Extensions.DependencyInjection.Abstractions | 7.0.0       |              |
| Nuget package | Newtonsoft.Json                                       | 13.0.3      |              |
| Nuget package | System.Configuration.ConfigurationManager             | 7.0.0       |              |
| Nuget package | WebSocketSharp-netstandard                            | 1.0.1       |              |
| Library       | ReFlex.Core.Common                                    | 0.9.9       | VCS: Assets/ |

- **recommended:**
  - Nuget Package Manager for Unity [github Repo](https://github.com/GlitchEnzo/NuGetForUnity)
    - can be installed via Unity Package Manager:
      - Open Package Manager window (Window | Package Manager)
      - Click `+` button on the upper-left of a window, and select `Add package from git URL...`
      - Enter the following URL and click `Add` button:
        `https://github.com/GlitchEnzo/NuGetForUnity.git?path=/src/NuGetForUnity`

## Updating the library

Unity currently does not support the newer .NET versions, but instead relies on .NET Standard 2.1. Therefore, the library needs to be build with .NET Standard as TargetFramework.

- ``ReFlex:Core.Common` currently is configured as multi-target library, and creates dlls for both .NET and .NET Standard
- if other parts of the library needs to be included into Unity, building for multiple targets can be done by editing the `.csproj` file of the associated library project by setting:

  ```XML
    <TargetFrameworks>net8.0;netstandard2.1</TargetFrameworks>
  ```

## Content

Example Scene: `Scenes\Reflex-Sample-WebSockets`

- configure Websocket address and play in Component `ReFlex/WebSocketClient`
- should automatically connect / reconnect (3s Timeout)

GameObjects:

- `ReFlex`
  - Contains Components to connect to WebSocket Server and retrieve Interactions
- `DebugCanvas`:
  - used to Display connection state and position of received Interactions on the screen (full screen canvas)

Prefabs:

- `ReFlex`
  - connecting to Websocket Server and retrieve / store Interactions (same as in scene `Reflex-Sample-WebSockets`)
- `overlay\DebugCanvas`: equivalent to Component in `Reflex-Sample-WebSockets` - contains state and interaction visualization
- `overlay\InteractionPoint`: prefab for visualizing interaction on canvas

Scripts:

- `WebSocketClient`:
  - connects to Websocket and subcribes to Messages and Websocket events
  - Events:
    - `onConnectionChanged(bool)`: if connection state is changed, event argument is the updated state (true: connected, false: disconnected)
    - `onConnected`: when connection was successfully established
    - `onDisconnected`: when an error occurs or the connection is closed
  - Properties:
    - `IsConnected`: bool - whether websocket connection is currently active or not
    - `StatusMessage`: Description of current Status, especially if there was an error
- `InteractionProvider`:
  - stores interactions received from WebSocket locally
  - Interactions can be retrieved by Property `CurrentInteractions`
  - Events:
    - `onInteractionsUpdated`: broadcasts current interactions received from websocket

## How to Retrieve Interactions from Websocket

- Add Component `WebSocketClient` and `InteractionProvider` to any GameObject in the scene
- or: drag Prefab `ReFlex` into your scene
- Specify address, and whether reconnection should be done automatically
- To handle updated interactions add event Handler to `onInteractionsUpdated` event of `InteractionProvider` component

- **REMARK:** instantiating game objects is only possible in main thread of Unity, that means within the `Start` or `Update` methods of a `MonoBehaviour`. Therefore, when listening to `onInteractionsUpdated` event, Instantiating game objects in the event handler causes an exception. Two possible solutions:
  1. regularly update game objects by checking `CurrentInteractions` of `InteractionProvider` (not recommended for "heavy work")
  2. just set a `needsUpdate` flag when receiving teh event and update game object in the next run of `update` (cf. `scripts/overlay/UpdateInteractionsVisualizationBehaviour`)
