/* eslint-disable max-lines */
import { AfterViewInit, Component, ElementRef, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output, Renderer2, ViewChild } from '@angular/core';
import { animationFrameScheduler, BehaviorSubject, combineLatest, interval, NEVER, of, Subscription } from 'rxjs';
import { catchError, distinctUntilChanged, map, startWith, switchMap, tap } from 'rxjs/operators';
import { LogService } from 'src/app/log/log.service';
import { Interaction } from 'src/shared/processing/interaction';
import { ProcessingService } from 'src/shared/services/processing.service';
import { SettingsService } from 'src/shared/services/settingsService';
import { DepthCameraState } from 'src/shared/tracking/depthCameraState';
import { Point3 } from 'src/shared/tracking/point3';
import { TrackingServerAppSettings } from 'src/shared/trackingServerAppSettings';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { TrackingService } from '../../../shared/services/tracking.service';
import { PointCloudService } from '../../../shared/services/point-cloud.service';
import { HttpClient } from '@angular/common/http';
import { DEFAULT_SETTINGS } from 'src/shared/trackingServerAppSettings.default';


@Component({
  selector: 'app-point-cloud',
  templateUrl: './point-cloud.component.html',
  styleUrls: ['./point-cloud.component.scss']
})

export class PointCloudComponent implements OnInit, AfterViewInit, OnDestroy {

  public static readonly particleSize: number = 0.07;

  private static readonly fullScreenClassName = 'fullScreen';

  @Input()
  public width = 800;

  @Output()
  public fullScreenChanged = new EventEmitter<boolean>();

  @ViewChild('pointCloudRenderContainer')
  public container?: ElementRef;

  public livePreview = false;
  public numFramesReceived = 0;
  public mouseXnormalized = 0;
  public mouseYnormalized = 0;
  public isMouseOver = false;
  public hoverP?: THREE.Vector3;

  public showBoundingBox = true;
  public showDistancePlanes = true;
  public showGrid = true;
  public pointSize = 3;

  public intersectedIdx?: number;

  private readonly renderer?: THREE.WebGLRenderer;
  private readonly scene: THREE.Scene;
  private readonly camera: THREE.Camera;
  private readonly shaderMaterial: THREE.RawShaderMaterial = new THREE.ShaderMaterial({
    blending: THREE.AdditiveBlending,
    depthTest: false,
    transparent: true,
    vertexColors: true
  });

  private readonly controls?: OrbitControls;
  private readonly bbBoxCube: THREE.Mesh;

  private readonly pickingCircle: THREE.Mesh;

  private readonly minPlane1: THREE.Mesh;
  private readonly minPlane2: THREE.Mesh;
  private readonly maxPlane1: THREE.Mesh;
  private readonly maxPlane2: THREE.Mesh;
  private readonly zeroPlane: THREE.Mesh;

  private interactions: Array<THREE.Mesh> = [];

  private _fullScreen = false;

  private readonly livePreview$ = new BehaviorSubject<boolean>(false);

  private _livePreviewEnabled = false;

  private height = 600;

  private readonly aspectRatio = 0.75;

  private renderSubscription?: Subscription;
  private pointCloudSubscription?: Subscription;
  private settingsSubscription?: Subscription;
  private interactionsSubscription?: Subscription;

  private previousPointsLength = -1;
  private readonly raycaster: THREE.Raycaster;
  private points: THREE.Points = new THREE.Points();
  private isPointCloudInitialized = false;

  private settings: TrackingServerAppSettings = DEFAULT_SETTINGS;

  private readonly bbSize = new THREE.Vector3(0, 0, 0);
  private readonly bbCenter = new THREE.Vector3(0, 0, 0);

  private readonly grid: THREE.GridHelper;

  private readonly interactionsMaterial = new THREE.MeshBasicMaterial({
    color: 0xffae18,
    transparent: true,
    opacity: 0.75
  });

  private readonly minPlaneMat = new THREE.MeshBasicMaterial({
    color: 0xff0000,
    transparent: true,
    opacity: 0.1
  });

  private readonly maxPlaneMat = new THREE.MeshBasicMaterial({
    color: 0x0000ff,
    transparent: true,
    opacity: 0.1
  });

  private readonly zeroPlaneMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.1
  });

  public constructor(
    private readonly httpClient: HttpClient,
    private readonly angularRenderer: Renderer2,
    private readonly trackingService: TrackingService,
    private readonly pointCloudService: PointCloudService,
    private readonly settingsService: SettingsService,
    private readonly processingService: ProcessingService,
    private readonly logService: LogService
  ) {

    try {
      this.renderer = new THREE.WebGLRenderer({ alpha: true });
    } catch (error) {
      console.warn(`${error}`);
    }

    this.httpClient.get('assets/shader/pointcloud_vertex.txt', {
      responseType: 'text'
    }).subscribe((shader) => {
      this.shaderMaterial.vertexShader = shader.toString();
      this.shaderMaterial.needsUpdate = true;
    });

    this.httpClient.get('assets/shader/pointcloud_fragment.txt', {
      responseType: 'text'
    }).subscribe((shader) => {
      this.shaderMaterial.fragmentShader = shader.toString();
      this.shaderMaterial.needsUpdate = true;
    });

    this.scene = new THREE.Scene();
    this.scene.background = null; // transparent, for white: new THREE.Color(0xffffff);
    this.camera = new THREE.PerspectiveCamera(75, this.aspectRatio, 1, 10000);
    this.camera.position.z = 100;
    this.camera.up = new THREE.Vector3(0.0, 1.0, 0.0);

    if (this.renderer !== undefined) {
      this.controls = new OrbitControls(this.camera, this.renderer.domElement);
      this.controls.update();
    }

    this.grid = new THREE.GridHelper(100, 20, new THREE.Color(0xffffff), new THREE.Color(0x222222));
    this.scene.add(this.grid);

    this.raycaster = new THREE.Raycaster();

    // boundingBox mesh
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const mat = new THREE.MeshBasicMaterial({ color: 0x006600, wireframe: true });
    this.bbBoxCube = new THREE.Mesh(geometry, mat);
    this.scene.add(this.bbBoxCube);
    this.bbBoxCube.visible = false;

    // raycast picker sphere
    const sphereGeometry = new THREE.SphereGeometry(0.1, 32, 32);
    const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
    this.pickingCircle = new THREE.Mesh(sphereGeometry, sphereMaterial);
    this.scene.add(this.pickingCircle);

    this.pickingCircle.scale.set(0, 0, 0);

    const planeGeo = new THREE.BoxGeometry(30, 20, 0.1);

    this.zeroPlane = new THREE.Mesh(planeGeo, this.zeroPlaneMat);
    this.scene.add(this.zeroPlane);

    this.minPlane1 = new THREE.Mesh(planeGeo, this.minPlaneMat);
    this.minPlane2 = new THREE.Mesh(planeGeo, this.minPlaneMat);
    this.scene.add(this.minPlane1);
    this.scene.add(this.minPlane2);

    this.maxPlane1 = new THREE.Mesh(planeGeo, this.maxPlaneMat);
    this.maxPlane2 = new THREE.Mesh(planeGeo, this.maxPlaneMat);
    this.scene.add(this.maxPlane1);
    this.scene.add(this.maxPlane2);
  }

  public get livePreviewEnabled(): boolean {
    return this._livePreviewEnabled;
  }

  @Input()
  public set livePreviewEnabled(value: boolean) {
    this._livePreviewEnabled = value;

    if (!value) {
      this.numFramesReceived = 0;
    }

    if (!this._livePreviewEnabled && this.livePreview) {
      this.livePreview = false;
      this.livePreviewChanged();
    }
  }

  // eslint-disable-next-line @typescript-eslint/member-ordering
  public get fullScreen(): boolean {
    return this._fullScreen;
  }

  public set fullScreen(fs: boolean) {
    this._fullScreen = fs;
    this.fullScreenChanged.emit(this._fullScreen);
  }

  @HostListener('mousemove', ['$event'])
  public onmouseMove(evt: MouseEvent): void {
    // get mouse coords relative to component (offsetX, offsetY) and convert to normalized device coords needed for raycasting (top left: [0,0] --> [-1, 1], bottom right: [1,1] --> [1,-1])
    this.mouseXnormalized = ((evt.offsetX / (this.container?.nativeElement.clientWidth ?? 1)) * 2) - 1;
    this.mouseYnormalized = -((evt.offsetY / (this.container?.nativeElement.clientHeight ?? 1)) * 2) + 1;
  }

  @HostListener('mouseover', ['$event'])
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public onMouseOver(evt: MouseEvent): void {
    this.isMouseOver = true;
  }

  @HostListener('mouseleave', ['$event'])
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public onMouseLeave(evt: MouseEvent): void {
    this.isMouseOver = false;
  }

  @HostListener('window:resize', ['$event'])
  public updateSize(): void {
    if (this.container === undefined) {
      return;
    }

    if (this.fullScreen) {
      this.angularRenderer.addClass(this.container.nativeElement, PointCloudComponent.fullScreenClassName);
    } else {
      this.angularRenderer.removeClass(this.container.nativeElement, PointCloudComponent.fullScreenClassName);
    }

    this.width = this.container.nativeElement.clientWidth;
    this.height = this.width * this.aspectRatio;
    this.renderer?.setSize(this.width, this.height, false);

  }

  public ngOnInit(): void {

    // subscriptions
    this.settingsSubscription = this.settingsService.getSettings().subscribe(
      (result) => this.updateSettings(result),
      (error) => {
        console.error(error);
        this.logService.sendErrorLog(`${error}`);
      }
    );

    const isTracking$ = this.trackingService.getStatus()
      .pipe(
        map((status) => status.depthCameraStateName === DepthCameraState[DepthCameraState.Streaming]),
        distinctUntilChanged(),
        catchError((err) => {
          console.error(err);
          this.logService.sendErrorLog(`${err}`);

          return of(false);
        })
      );

    const shouldShowLiveView$ = combineLatest([isTracking$, this.livePreview$])
      .pipe(
        tap(() => this.updateSize()),
        map(([isTracking, livePreview]) => livePreview && isTracking),
        catchError((err) => {
          console.error(err);
          this.logService.sendErrorLog(`${err}`);

          return of(false);
        })
      );

    const pointCloud$ = this.pointCloudService.getPointCloud();

    this.pointCloudSubscription = shouldShowLiveView$
      .pipe(
        switchMap((showLiveView) => showLiveView ? pointCloud$ : NEVER.pipe(startWith([]))),
        tap((result) => {
          if (result.length > 0) {
            this.numFramesReceived++;
          }
        }),
        catchError((err) => {
          console.error(err);
          this.logService.sendErrorLog(`${err}`);

          return of([]);
        })
      )
      .subscribe(
        (result) => this.updatePointCloud(result),
        (error) => {
          console.error(error);
          this.logService.sendErrorLog(`${error}`);
        }
      );

    const interactions$ = this.processingService.getInteractions();

    this.interactionsSubscription = shouldShowLiveView$
      .pipe(
        switchMap((showLiveView) => showLiveView ? interactions$ : NEVER.pipe(startWith([]))),
        catchError((err) => {
          console.error(err);
          this.logService.sendErrorLog(`${err}`);

          return of([]);
        })
      )
      .subscribe(
        (result) => this.updateInteractions(result),
        (error) => {
          console.error(error);
          this.logService.sendErrorLog(`${error}`);
        }
      );
  }

  public ngAfterViewInit(): void {
    this.updateSize();
    if (this.renderer !== undefined) {
      this.container?.nativeElement.appendChild(this.renderer.domElement);

      this.renderSubscription = interval(0, animationFrameScheduler)
        .subscribe(() => {
          this.renderer?.render(this.scene, this.camera);
          this.controls?.update();
        });
    }
  }

  public ngOnDestroy(): void {
    this.settingsSubscription?.unsubscribe();
    this.interactionsSubscription?.unsubscribe();
    this.renderSubscription?.unsubscribe();
    this.pointCloudSubscription?.unsubscribe();
  }

  public updatePlanesVisibility(): void {
    this.zeroPlane.visible = this.showDistancePlanes;
    this.maxPlane1.visible = this.showDistancePlanes;
    this.maxPlane2.visible = this.showDistancePlanes;
    this.minPlane1.visible = this.showDistancePlanes;
    this.minPlane2.visible = this.showDistancePlanes;
  }

  public updateGridVisibility(): void {
    this.grid.visible = this.showGrid;
  }

  public livePreviewChanged(): void {
    this.livePreview$.next(this.livePreview);
  }

  private updateSettings(settings: TrackingServerAppSettings): void {
    this.settings = settings;

    const dist = this.settings.filterSettingValues.distanceValue;

    const defaultDist = dist.default * 10.0;

    this.zeroPlane.position.set(0, 0, defaultDist);
    this.zeroPlane.scale.set(1.2, 1.2, 1);
    this.maxPlane1.position.set(0, 0, defaultDist + (dist.max * 10.0));
    this.maxPlane2.position.set(0, 0, defaultDist - (dist.max * 10.0));
    this.minPlane1.position.set(0, 0, defaultDist + (dist.min * 10.0));
    this.minPlane2.position.set(0, 0, defaultDist - (dist.min * 10.0));
  }

  private updatePointCloud(points: Array<Point3>): void {
    if (points.length === 0) {
      if (this.isPointCloudInitialized) {
        this.points.visible = false;
      }

      return;
    }

    let positions: Float32Array = new Float32Array();
    let color: Float32Array;
    let pointsGeometry: THREE.BufferGeometry;
    let sizes: Float32Array;
    let indices: Uint16Array;

    if (!this.isPointCloudInitialized) {
      pointsGeometry = new THREE.BufferGeometry();
      this.points = new THREE.Points(pointsGeometry, this.shaderMaterial);
      this.scene.add(this.points);
      this.isPointCloudInitialized = true;
    } else {
      this.points.visible = true;
      pointsGeometry = this.points.geometry;
      positions = pointsGeometry.attributes.position.array as Float32Array;
      color = pointsGeometry.attributes.color.array as Float32Array;
      sizes = pointsGeometry.attributes.size.array as Float32Array;
      indices = pointsGeometry.attributes.index.array as Uint16Array;
    }

    if (points.length !== this.previousPointsLength) {
      positions = new Float32Array(points.length * 3);
      color = new Float32Array(points.length * 3);
      sizes = new Float32Array(points.length * 3);
      indices = new Uint16Array(points.length);
      pointsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      pointsGeometry.setAttribute('color', new THREE.BufferAttribute(color, 3));
      pointsGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
      pointsGeometry.setAttribute('index', new THREE.BufferAttribute(indices, 1));
      pointsGeometry.setDrawRange(0, points.length);

      this.previousPointsLength = points.length;
    }

    const defaultDist = this.settings !== undefined ? this.settings.filterSettingValues.distanceValue.default : 1;
    const minExt = this.settings !== undefined ? defaultDist - this.settings.filterSettingValues.distanceValue.min : 1;
    const maxExt = this.settings !== undefined ? this.settings.filterSettingValues.distanceValue.max - defaultDist : 1;

    points.forEach((point, index) => {
      const i = index * 3;
      positions[i] = point.x * 10;
      positions[i + 1] = point.y * -10;
      positions[i + 2] = point.z * 10;

      indices[index] = index;

      if (point.isFiltered) {

        color[i] = 1;
        color[i + 1] = 0;
        color[i + 2] = 0;
      } else if (point.z > defaultDist) {
        color[i] = ((point.z - defaultDist) / maxExt) - 0.5;
        color[i + 1] = ((point.z - defaultDist) / maxExt) - 0.5;
        color[i + 2] = 1.0 - ((point.z - defaultDist) / maxExt);

      } else {

        color[i] = ((defaultDist - point.z) / minExt) - 0.5;
        color[i + 1] = 1.0 - ((defaultDist - point.z) / minExt);
        color[i + 2] = ((defaultDist - point.z) / minExt) - 0.5;
      }

      if (index === this.intersectedIdx) {
        sizes[index] = PointCloudComponent.particleSize * 5;
        color[i] = 1;
        color[i + 1] = 1;
        color[i + 2] = 1;
      } else {
        sizes[index] = PointCloudComponent.particleSize * this.pointSize;
      }
    });

    (pointsGeometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (pointsGeometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;
    (pointsGeometry.attributes.size as THREE.BufferAttribute).needsUpdate = true;
    (pointsGeometry.attributes.index as THREE.BufferAttribute).needsUpdate = true;

    this.updateBoundingBox(pointsGeometry);

    if (!this.isMouseOver) {
      this.updateMouseOver(positions);
    }
  }

  private updateMouseOver(positions: Float32Array): void {
    this.camera.updateMatrixWorld();
    this.raycaster.setFromCamera(new THREE.Vector2(this.mouseXnormalized, this.mouseYnormalized), this.camera);

    const intersects = this.raycaster.intersectObject(this.points, true);
    const sorted = intersects.filter((intersection) => intersection.distanceToRay !== null).sort((intersection1, intersection2) => (intersection1.distanceToRay ?? 0) - (intersection2.distanceToRay ?? 0));

    if (sorted.length > 0) {

      const pos = sorted[0].point;
      this.hoverP = pos;
      this.pickingCircle.position.set(pos.x, pos.y, pos.z);
      this.pickingCircle.scale.set(1, 1, 1);

      if (this.intersectedIdx !== sorted[0].index) {

        const idx = sorted[0].index ?? 0;

        const x = positions[idx * 3];
        const y = positions[(idx * 3) + 1];
        const z = positions[(idx * 3) + 2];

        this.hoverP = new THREE.Vector3(x, y, z);
        this.intersectedIdx = idx;
      }
    } else {
      this.intersectedIdx = undefined;
      this.hoverP = undefined;
      this.pickingCircle.scale.set(0, 0, 0);
    }
  }

  private updateBoundingBox(pointsGeometry: THREE.BufferGeometry): void {
    pointsGeometry.computeBoundingBox();

    pointsGeometry.boundingBox?.getSize(this.bbSize);

    pointsGeometry.boundingBox?.getCenter(this.bbCenter);

    this.bbBoxCube.scale.set(this.bbSize.x, this.bbSize.y, this.bbSize.z);

    this.bbBoxCube.position.set(this.bbCenter.x, this.bbCenter.y, this.bbCenter.z);

    this.bbBoxCube.visible = this.showBoundingBox;
  }

  private updateInteractions(updatedInteractions: Array<Interaction>): void {
    this.interactions.forEach((interaction) => {
      this.scene.remove(interaction);
    });

    this.interactions = [];

    if (this.settings === undefined) {
      console.warn('Cannot access settings.');

      return;
    }

    const dist = this.settings.filterSettingValues.distanceValue;
    const defaultZ = dist.default * 10.0;

    // TODO: change to calibrated values !
    const resX = this.settings.cameraConfigurationValues.width;
    const resY = this.settings.cameraConfigurationValues.height;

    updatedInteractions.forEach((interaction) => {

      const posX = this.bbCenter.x + (interaction.position.x * (this.bbSize.x / resX)) - (0.5 * this.bbSize.x);
      const posY = this.bbCenter.y + (interaction.position.y * (this.bbSize.y / resY)) - (0.5 * this.bbSize.y);

      const posZ = (interaction.position.z * (dist.max * 10.0)) + defaultZ;
      const sphere = new THREE.SphereGeometry(0.1);
      const mesh = new THREE.Mesh(sphere, this.interactionsMaterial);
      mesh.position.set(posX, posY, posZ);
      this.scene.add(mesh);

      this.interactions.push(mesh);
    });

  }
}
