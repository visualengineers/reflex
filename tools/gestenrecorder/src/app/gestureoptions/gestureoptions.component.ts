import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Layers } from '../service/configuration.service';
import { ViewPort } from '../service/configuration.service';
import { BackgroundSource } from '../model/BackgroundSource.model';
import { OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ConfigurationService } from '../service/configuration.service';
import { SettingsGroupComponent, ValueSelectionComponent, ValueTextComponent } from '@reflex/angular-components/dist';

@Component({
    selector: 'app-gestureoptions',
    imports: [FormsModule, CommonModule, SettingsGroupComponent, ValueSelectionComponent, ValueTextComponent],
    templateUrl: './gestureoptions.component.html',
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
  public backgroundType: string[] = ["no background", "from assets/img", "from internet url"];
  public backgroundSources: BackgroundSource[] = [];
  public selectedBackgroundType: string = this.backgroundType[0];
  public selectedBackgroundImage: string = '';
  public backgroundUrl: string = '';
  private layersSubscription?: Subscription;

  constructor(private configurationService: ConfigurationService) {}

  ngOnInit(): void {
    this.backgroundSources = this.configurationService.getBackgroundSources();
    this.selectedBackgroundImage = this.configurationService.getBackgroundImage();
    this.viewPort = this.configurationService.getViewPort();
    console.log("backgroundSources",this.backgroundSources);

    this.layersSubscription = this.configurationService.getLayers()
        .subscribe(layers => this.layers = layers );
  }

  saveConfiguration(): void {
    if (this.layers) {
      this.configurationService.setLayers(this.layers);
    }
    if (this.viewPort) {
      this.configurationService.setViewPort(this.viewPort);
    }
    this.configurationService.setBackgroundImage(this.selectedBackgroundImage);
    this.configurationService.setLocalStorage();
  }

  restoreConfiguration(): void {
    this.configurationService.getLocalStorage();
    this.ngOnInit();
  }

  ngOnDestroy(): void {
    this.layersSubscription?.unsubscribe();
  }
}
