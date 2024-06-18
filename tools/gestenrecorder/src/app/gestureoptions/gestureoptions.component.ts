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

// TODO: Background
@Component({
  selector: 'app-gestureoptions',
  standalone: true,
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
  public backgroundImage: string = '';
  public backgroundSources: BackgroundSource[] = [];
  public backgroundUrl: string = '';
  private layersSubscription?: Subscription;

  constructor(private configurationService: ConfigurationService) {}

  ngOnInit(): void {
    this.backgroundSources = this.configurationService.getBackgroundSources();
    this.viewPort = this.configurationService.getViewPort();

    this.layersSubscription = this.configurationService.getLayers()
        .subscribe(layers => this.layers = layers );
  }

  saveConfiguration(): void {
    if (this.layers !== undefined) {
      this.configurationService.setLayers(this.layers);
    }
    if (this.viewPort !== undefined) {
      this.configurationService.setViewPort(this.viewPort);
    }
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
