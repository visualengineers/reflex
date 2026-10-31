import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import {
  SettingsGroupComponent,
  ValueSelectionComponent,
  ValueTextComponent
} from '@reflex/angular-components/dist';
import { Subscription } from 'rxjs';
import { BackgroundSource } from '../model/BackgroundSource.model';
import { ConfigurationService, Layers, ViewPort } from '../service/configuration.service';

@Component({
  selector: 'app-gestureoptions',
  imports: [
    FormsModule,
    SettingsGroupComponent,
    ValueSelectionComponent,
    ValueTextComponent
  ],
  templateUrl: './gestureoptions.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './gestureoptions.component.scss'
})
export class GestureoptionsComponent implements OnInit, OnDestroy {

  public layers: Layers = {
    up: 0,
    down: 0,
    colorUp: '',
    colorDown: ''
  };

  public viewPort: ViewPort = {
    width: 0,
    height: 0
  };

  public backgroundType: Array<string> = [
    'no background',
    'from assets/img',
    'from internet url'
  ];

  public backgroundSources: Array<BackgroundSource> = [];
  public selectedBackgroundType: string = this.backgroundType[0];
  public selectedBackgroundImage = '';
  public backgroundUrl = '';
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly configurationService = inject(ConfigurationService);
  private layersSubscription?: Subscription;

  public ngOnInit(): void {
    this.backgroundSources = this.configurationService.getBackgroundSources();
    this.selectedBackgroundImage
      = this.configurationService.getBackgroundImage();
    this.viewPort = this.configurationService.getViewPort();
    console.log('backgroundSources', this.backgroundSources);

    this.layersSubscription = this.configurationService
      .getLayers()
      .subscribe((layers) => {
        this.layers = layers;
        this.changeDetector.markForCheck();
      });
  }

  public saveConfiguration(): void {
    if (this.layers !== undefined) {
      this.configurationService.setLayers(this.layers);
    }
    if (this.viewPort !== undefined) {
      this.configurationService.setViewPort(this.viewPort);
    }
    this.configurationService.setBackgroundImage(this.selectedBackgroundImage);
    this.configurationService.setLocalStorage();
  }

  public restoreConfiguration(): void {
    this.configurationService.getLocalStorage();
    this.ngOnInit();
  }

  public ngOnDestroy(): void {
    this.layersSubscription?.unsubscribe();
  }
}
