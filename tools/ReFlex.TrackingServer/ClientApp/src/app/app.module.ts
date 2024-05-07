/* eslint-disable @typescript-eslint/no-extraneous-class */
import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { NavMenuComponent } from './nav-menu/nav-menu.component';
import { HomeComponent } from './home/home.component';
import { TrackingComponent } from './tracking/tracking.component';
import { NetworkComponent } from './network/network.component';
import { LogComponent } from './log/log.component';
import { ProcessingComponent } from './processing/processing.component';
import { SettingsComponent } from './settings/settings.component';
import { PointCloudComponent } from './tracking/point-cloud/point-cloud.component';
import { InteractionsComponent } from './processing/interactions/interactions.component';
import { CalibrationComponent } from './calibration/calibration.component';
import { AppRoutingModule } from './app-routing.module';
import { CustomErrorHandler } from 'src/shared/util/custom-error-handler';
import { HistoryComponent } from './processing/history/history.component';
import { HistoryVisualizationComponent } from './processing/history-visualization/history-visualization.component';
import { InteractionsVisualizationComponent } from './processing/interactions-visualization/interactions-visualization.component';
import { DepthImageComponent } from './tracking/depth-image/depth-image.component';
import { RecordingComponent } from './tracking/recording/recording.component';
import { MeasureSurfaceComponent } from './measure-surface/measure-surface.component';
import { MeasureGridComponent } from './measure-surface/measure-grid/measure-grid.component';
import { MeasureControlsComponent } from './measure-surface/measure-controls/measure-controls.component';
import { TuioComponent } from './network/tuio/tuio.component';
import { PackageDetailsComponent } from './network/tuio/package-details/package-details.component';
import { SettingsGroupComponent, ValueSliderComponent, ValueSelectionComponent, OptionCheckboxComponent, PanelHeaderComponent, ValueTextComponent } from '@reflex/angular-components/dist/@reflex/angular-components';
import { PerformanceVisualizationComponent } from './performance-visualization/performance-visualization.component';
// import { CanvasWidthDirective } from './tracking/point-cloud/canvas-width.directive';

@NgModule({
  declarations: [
    AppComponent,
    NavMenuComponent,
    HomeComponent,
    TrackingComponent,
    NetworkComponent,
    LogComponent,
    ProcessingComponent,
    SettingsComponent,
    PointCloudComponent,
    InteractionsComponent,
    CalibrationComponent,
    HistoryComponent,
    HistoryVisualizationComponent,
    InteractionsVisualizationComponent,
    DepthImageComponent,
    RecordingComponent,
    MeasureSurfaceComponent,
    MeasureGridComponent,
    MeasureControlsComponent,
    TuioComponent,
    PackageDetailsComponent,
    PerformanceVisualizationComponent
  ],
  imports: [
    BrowserModule.withServerTransition({ appId: 'ng-cli-universal' }),
    HttpClientModule,
    FormsModule,
    AppRoutingModule,
    SettingsGroupComponent,
    ValueSliderComponent,
    ValueSelectionComponent,
    OptionCheckboxComponent,
    PanelHeaderComponent,
    ValueTextComponent
  ],
  providers: [{ provide: ErrorHandler, useClass: CustomErrorHandler }],
  bootstrap: [AppComponent]
})
export class AppModule { }
