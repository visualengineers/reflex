import { ElementRef } from "@angular/core";
import { OnDestroy } from "@angular/core";
import { ViewChild } from "@angular/core";
import { Component, OnInit } from "@angular/core";
import { combineLatest, fromEvent, Subscription } from "rxjs";
import {
  debounceTime,
  distinctUntilChanged,
  map,
  publishBehavior,
  refCount,
} from "rxjs/operators";
import {
  ConfigurationService,
  Layers,
} from "../../service/configuration.service";
import { ConnectionService } from "../../service/connection.service";
import { NormalizedPoint } from "../../model/NormalizedPoint.model";
import { CircleDto, CircleRenderer } from "../../shapes/Circle";

@Component({
  selector: "app-timeline-canvas",
  standalone: true,
  imports: [],
  templateUrl: "./timeline-canvas.component.html",
  styleUrl: "./timeline-canvas.component.scss",
})
export class TimelineCanvasComponent {}
