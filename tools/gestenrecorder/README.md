# Gestenrecorder


Redesign and reimplementation of an emulator tool for recording and playing back complex gestures. The aim is to facilitate the development and testing of apps for Elastic Displays. Part of the lecture `Project Seminar Summer 2024` @ University of Applied Sciences, Dresden.
This project was created with [Angular CLI](https://github.com/angular/angular-cli) version 17.2.2.


## Project initialization

* initialize / install packages in parent workspace
* need `packages/reflex-angular-components` and `packages/reflex-shared-types`, so these should be build beforehand
* use run script ```npm run start:gestenrecorder```

## Known bugs

* relocating points (x,y,z) and then build/interpolate and play gesture
* deleting points and then build/interpolate and play gesture
* tracks feature not ready yet


## Main components
### Data components
* data:
    * backgroundSources.ts:
        * Provide background resources
    * cameras.ts:
        * Provide camera options resources
    * gesture-track-frames.ts:
        * provides `gesture-track-frames-interface`
    * gesture-track.ts:
        * provides `gesture-track-interface`
    * gesture.ts:
        * provides `gesture-interface`
* shapes:
    * circle.ts:
        * provides circle-interface
        * provides class CircleRenderer with 
            * `public draw(circleDto: CircleDto): void` and 
            * `public drawOnTimeline(circleDto: CircleDto): void`

### model components
* model:
    * BackgroundSource.model.ts:
        * provides `BackgroundSource-interface`
    * BackgroundType.model.ts:
        * provides `BackgroundType-enum`
    * NormalizedPoint.model.ts:
        * provides `NormalizedPoint-interface`
    * TrackingModes.model.ts:
        * provides `TrackingModes-enum`

### service components
* service:
    * configuration.service.ts:
        * This file implements the ConfigurationService, which manages, stores, and provides various configuration data and options for an application, including settings for touch points, background images, cameras, and layers.
        * provides `Camera-interface`
        * provides `CircleSize-interface`
        * provides `Layers-interface`
        * provides `ViewOption-interface`
        * provides `ViewPort-interface`
        * exports `class ConfigurationService` with :
            *   public Variables:
                *   `public activePoint$ = new Subject<number>`
                *   `public amountTouchPoints$ = new BehaviorSubject<number>`
                *   `public background$ = new Subject();`
                *   `public backupTimestamp$ = new BehaviorSubject<Date | null>`
                *   `public layers$ = new BehaviorSubject<Layers>`
                *   `public normalizedPoints$ = new BehaviorSubject<NormalizedPoint[]>`
            * functions:
                * `getActivePoint(): Observable<number>`
                * `setActivePoint(point: number): void`
                * `getAmountProjectionLayers(): number`
                * `setAmountProjectionLayers(amountProjectionLayers: number): void`
                * `getAmountTouchPoints(): Observable<number>`
                * `setAmoutTouchPoints(amountTouchPoints: number): void`
                * `getBackgroundImage(): string`
                * `setBackgroundImage(backgroundImage: string): void`
                * `getBackgroundSources(): BackgroundSource[]`
                * `setBackgroundSources(paths: BackgroundSource[]): void`
                * `getBackupTimestamp(): Observable<Date | null>`
                * `setBackupTimestamp(): void`
                * `getCamera(): Camera`
                * `setCamera(camera: Camera): void`
                * `getCameraOptions(): Camera[]`
                * `getCircleSize(): CircleSize`
                * `setCircleSize(circleSize: CircleSize): void`
                * `getLayers(): Observable<Layers>`
                * `setLayers(layers: Layers): void`
                * `getNormalizedPoints(): Observable<NormalizedPoint[]>`
                * `setNormalizedPoints(normalizedPoints: NormalizedPoint[]): void`
                * `getSendInterval(): number`
                * `setSendInterval(sendInterval: number): void`
                * `getServerConnection(): string`
                * `setServerConnection(serverConnection: string): void`
                * `getViewOptions(): ViewOption[]`
                * `setViewOptions(viewOptions: ViewOption[]): void`
                * `getViewPort(): ViewPort`
                * `setViewPort(viewPort: ViewPort): void`
                * `getLocalStorage(): void`
                * `setLocalStorage(): void`
                * `clearLocalStorage(): void`

    * connection.service.ts:
        * This file implements the `ConnectionService`, which manages WebSocket connections for sending and receiving interaction data, including automatic reconnection and interval-based message sending.
        * exports `class ConnectionService` with :
            * public variables:
                * `public connectionSuccessful: Subject<boolean>`
                * `public doReconnect = true`
            * public functions:
                * `init(): void`
                * `destroy(): void`
                * `reconnect(): void`
                * `disconnect(triggerReconnect: boolean = true): void`
                * `sendMessage(touchPoints: Interaction[]): void`
                * `connectionState(): Observable<boolean>`

    * gesture-data.service.ts:
        * This file implements the `GestureDataService`, which manages the creation, modification, and persistence of gesture data, including interpolation of frames and handling interactions.
        * exports `class GestureDataService` with:
            * public variables:
                * `public gesturePoints$: Observable<GestureTrackFrame[]>`
                * `public gesture$: Observable<Gesture>`
                * `public connectionSuccessful: Subject<boolean>`
                * `public doReconnect = true`
            * public functions:
                * `updateGesture(id: number, name: string, numFrames: number, speed: number): void`
                * `addGestureTrackFrame(interaction: Interaction): void`
                * `deleteGestureTrackFrame(frame: GestureTrackFrame): void`
                * `updateGestureTrackFrame(index: number, x: number, y: number, z: number): void`
                * `setGesture(gesture: Gesture): void`
                * `getGesture(): Gesture`
                * `getGestureId(): number`
                * `setGestureId(id: number): void`
                * `getGestureName(): string`
                * `setGestureName(name: string): void`
                * `getGestureNumFrames(): number`
                * `setGestureNumFrames(numFrames: number): void`
                * `getGestureSpeed(): number`
                * `setGestureSpeed(speed: number): void`
                * `getGestureTracks(): GestureTrack[]`
                * `setGestureTracks(tracks: GestureTrack[]): void`
                * `setGestureTrackFrames(frames: GestureTrackFrame[]): void`
                * `getGestureTrackFrames(): GestureTrackFrame[]`
                * `interpolateGesture(): void`
                * `saveGestureToJson(): void`
                * `loadGestureFromFile(gestureFile: string): void`
                * `getGestureFileNames(): Observable<string[]>`
    * gesture-replay.service.ts:
        * This file implements the `GestureReplayService`, which manages the replay of gestures either from a file or directly from a gesture object, controlling the animation frames based on configured intervals and interaction updates.
        * exports `class GestureReplayService` with:
            * public variables:
                * `public loopGesture = true`
                * `playbackFrame$`
            * public functions:
                * `initFile(gestureFile: string): void`
                * `initGestureObject(gesture: Gesture): void`
                * `resetAnimation(gesture: Gesture): void`
                * `resetAnimationAfterOneLoop(gesture: Gesture): void`

### frontend components

* dropdown:
    * dropdown.component.html:
        * 3x dropdown overlay menus in the right upper corner
        * uses 
            * `<app-savingoptions>`
            * `<app-gestureoptions>`
            * `<app-recorderoptions>`
    * dropdown.component.ts:
        * This file defines the `DropdownComponent`, which manages the behavior of a dropdown menu with multiple options for gestures, recording settings, and saving options.
        * exports `class DropdownComponent` with:
            * public variables:
                * `isGestureDropdownOpen: boolean`
                * `isRecorderDropdownOpen: boolean`
                * `isSavingDropdownOpen: boolean`
            * public functions:
                * `closeDropdown(): void`
                * `addClickOutsideListener(): void`
                * `removeClickOutsideListener(): void`

* gestureoptions:
    * gestureoptions.component.html:
        * content of the gesture options
        * uses 
            * shared components:
                * `<app-value-selection>`
                * `<app-value-text>`
    * gestureoptions.component.ts:
        * This component manages gesture options for configuring layers, viewport dimensions, background sources, and settings storage, interacting with the `ConfigurationService`.
        * exports `class GestureoptionsComponent` with:
            * public variables:
                * `public layers: Layers`
                * `public viewPort: ViewPort`
                * `public backgroundType: string[]`
                * `public backgroundImage: string`
                * `public backgroundSources: BackgroundSource[]`
                * `public backgroundUrl: string`
            * public functions:
                * `ngOnInit(): void`
                * `saveConfiguration(): void`
                * `restoreConfiguration(): void`
                * `ngOnDestroy(): void`

* hover-menu:
    * hover-menu.component.html:
        * overlay hover info, for info about current point you hovered on
        * uses 
            * shared components:
                * `<app-value-text>`
    * hover-menu.component.ts:
        * This file defines the `HoverMenuComponent`, which is a component responsible for displaying detailed information about a hovered point, allowing users to toggle its fixation status and update its properties.
        * exports `class HoverMenuComponent` with:
            * public variables:
                * `@Input() hoveredPoint: NormalizedPoint | null`
                * `@Output() pointUpdated = new EventEmitter<NormalizedPoint>()`
                * `@Input() isFixed: boolean`
            * public functions:
                * `toggleFixed(): void`
                * `getX(): string`
                * `getY(): string`
                * `getZ(): string`
                * `getTime(): string`
                * `getIndex(): string`
                * `updatePoint(): void`

* pullup:
    * pullup.component.html:
        * overlay menu in the buttom middel
        * uses 
            * `<app-timeline>`
            * `<app-track-component>`
    * pullup.component.ts:
        * This file defines the `PullupComponent`, which manages the state of a pull-up component in an Angular application, allowing users to toggle its visibility and close it.
        * exports `class PullupComponent` with :
            * public variables:
                * `isPullupOpen: boolean = true`
            * functions:
                * `togglePullup()`
                * `closePullup()`

* recorderoptions:
    * recorderoptions.component.html:
        * content of the recorder options
        * uses 
            * shared components:
                * `<app-value-text>`
    * recorderoptions.component.ts:
        * This file implements the `RecorderoptionsComponent`, which provides user interface functionalities for configuring and managing settings related to touch points, circle size, send interval, and server connection.
        * provides `class RecorderoptionsComponent` with :
            * public variables:
                * `public amountTouchPoints: number = 0`
                * `public circleSize: CircleSize = { min: 0, max: 0 }`
                * `public sendInterval: number = 100`
                * `public serverConnection?: string`
            * public functions:
                * `saveConfiguration(): void`
                * `restoreConfiguration(): void`
                * `connectToServer(): void`

* savingoptions:
    * savingoptions.component.html:
        * content of the saving options
        * uses 
            * shared components:
                * `<app-value-selection>`
    * savingoptions.component.ts:
        * This file defines the `SavingoptionsComponent`, responsible for managing saving and loading gestures within an Angular application.
        * uses `GestureDataService` for gesture data operations
        * The component includes:
            * `gestureFileNames: string[] = [];`
            * `selectedGestureFile: string = '';`

* timeline:
    * timeline.component.html:
        * content of the timeline
        * uses 
            * `<plotly-plot>`
    * timeline.component.ts:
        * This file implements the `TimelineComponent`, which provides a graphical representation of gesture data over time using Plotly.js, including dynamic updates for frame points and horizontal position tracking.
        * exports `class TimelineComponent` with :
            *   public Variables:
                *   `public max_value_layer = 1`
                *   `public min_value_layer = -1.2`
                *   `public horizontalPosition = 0`
                *   `public segmentsCount = 0`
                *   `public segmentWidth: number = 0`
                *   `public segments: any[] = []`
                *   `public graph = {[...]}`
            * functions:
                * `updateGraph(points: GestureTrackFrame[]): void`
                * `updateHorizontalPosition(index: number): void`
                * `updateVerticalLinePosition(): void`

* touch-area:
    * touch-area.component.html:
        * main draw area for the points, big canvas
        * uses:
            * `<iframe>`
            * `<canvas>`
            * `<app-hover-menu>`
    * touch-area.component.ts:
        * This file implements the `TouchAreaComponent`, which manages the drawing and interaction handling for touch points on a canvas, including dynamic resizing, gesture tracking, and menu interaction.
        * exports `class TouchAreaComponent` with:
            * `@ViewChild('canvas', { static: true }) canvas?: ElementRef<HTMLCanvasElement>`
            * `@ViewChild(HoverMenuComponent) hoverMenu?: HoverMenuComponent`
            * `public backgroundPath = ''`
            * `hoveredPoint: NormalizedPoint | null = null`
            * `menuPosition = { x: 0, y: 0 }`
            * `isHoverMenuFixed: boolean = false`
            * functions:
                * `ngOnInit(): void`
                * `onPointUpdated(updatedPoint: NormalizedPoint): void`
                * `ngOnDestroy()`
                * `private updateMenuPosition(event: MouseEvent): void`
                * `private drawCircleDtos(): void`
                * `private drawAnimation(dto: CircleDto): void`
    * service:
        * event.service.ts:
            * This file provides the `EventService`, which facilitates the observation of mouse events on a given HTML element, including `mousedown`, `mousemove`, `mouseout`, `mouseup`, and `wheel`.
            * exports `class EventService` with:
                * public functions:
                    * `getMouseEvents(element: HTMLElement): { mouseDown$: Observable<MouseEvent>, mouseMove$: Observable<MouseEvent>, mouseOut$: Observable<MouseEvent>, mouseUp$: Observable<MouseEvent>, mouseWheel$: Observable<WheelEvent> }`
        * touch-area.service.ts:
            * This file implements the `TouchAreaService`, which provides methods for manipulating and interacting with normalized touch points on a canvas, including adding, deleting, moving, resizing, and checking interactions with circles.
            * provides `addNormalizedPoint(point: NormalizedPoint, p: NormalizedPoint[], maxAmount: number): NormalizedPoint[]`
            * provides `circleDtoFromNormalizedPoint(p: NormalizedPoint, canvasSize: { width: number; height: number }, layers?: Layers): CircleDto`
            * provides `checkIfMouseOnCircles(event: MouseEvent | PointerEvent | WheelEvent, p: NormalizedPoint[], ctx: CanvasRenderingContext2D): boolean`
            * provides `deleteNormalizedPoints(event: MouseEvent | PointerEvent, p: NormalizedPoint[], ctx: CanvasRenderingContext2D): NormalizedPoint[]`
            * provides `getHoveredCircles(event: MouseEvent | PointerEvent | WheelEvent, p: NormalizedPoint[], ctx: CanvasRenderingContext2D): number[]`
            * provides `isEventOnCircle(event: MouseEvent | PointerEvent | WheelEvent, point: NormalizedPoint, ctx: CanvasRenderingContext2D): boolean`
            * provides `movePointFromEvent(event1: MouseEvent | PointerEvent, event2: MouseEvent | PointerEvent, index: number, p: NormalizedPoint[], ctx: CanvasRenderingContext2D): NormalizedPoint[]`
            * provides `normalizedPointFromEvent({ target, offsetX, offsetY }: MouseEvent | PointerEvent, index: number): NormalizedPoint`
            * provides `resizeNormalizedPoints(event: WheelEvent, p: NormalizedPoint[], ctx: CanvasRenderingContext2D, layers?: Layers): NormalizedPoint[]`
            * provides `sliceToMax(maxAmount: number, p: NormalizedPoint[]): NormalizedPoint[]`
            * provides `touchPointFromNormalizedPoint(p: NormalizedPoint): Interaction`

* track-component:
    * track-component.component.html:
        * content of the track area
        * uses:
            * shared components:
                * `<button>`
    * track-component.component.ts:
        * This component manages the display and interaction of gesture track data, including selection, addition, deletion, and updating of gestures.
        * exports `class TrackComponentComponent` with :
            *   public Variables:
                *   `public selectedIndex: number = -1`
                *   `public selectedGesture: Gesture | null = null`
                *   `public tableData: Array<GestureData>`
            * functions:
                * `ngOnInit(): void`
                * `ngOnDestroy(): void`
                * `public saveTrack(): void`
                * `public addTrack(): void`
                * `public deleteTrack(index: number): void`
                * `updateGesture(): void`

* app.component.html:
    * content of the track area
    * uses:
        * shared components:
            * `<button>`
            * `<app-option-checkbox>`
            * `<app-dropdown>`
            * `<app-touch-area>`
            * `<app-pullup>`
            * `<router-outlet>`
* app.component.ts:
    * This file defines the `AppComponent` which serves as the root component of the application, managing gestures and their playback functionality.
    * exports `class AppComponent` with :
        * public Variables:
            * `public title = "gestenrecorder"`
            * `public toggleLoopActive = true`
        * constructor:
            * `constructor(private gestureService: GestureDataService, private gestureReplayService: GestureReplayService)`
        * functions:
            * `buildGesture(): void`
            * `playGesture(): void`
            * `resetGesture(): void`

## Contributors

* Joel Giese
* Jonas Lorenz
* Tim Müller
