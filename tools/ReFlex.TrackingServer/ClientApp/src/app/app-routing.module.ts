/* eslint-disable @typescript-eslint/no-extraneous-class */
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CalibrationComponent } from './calibration/calibration.component';
import { HomeComponent } from './home/home.component';
import { LogComponent } from './log/log.component';
import { MeasureSurfaceComponent } from './measure-surface/measure-surface.component';
import { NetworkComponent } from './network/network.component';
import { ProcessingComponent } from './processing/processing.component';
import { SettingsComponent } from './settings/settings.component';
import { TrackingComponent } from './tracking/tracking.component';

const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'calibration', component: CalibrationComponent },
  { path: 'log', component: LogComponent },
  { path: 'network', component: NetworkComponent },
  { path: 'processing', component: ProcessingComponent, pathMatch: 'full' },
  { path: 'settings', component: SettingsComponent, pathMatch: 'full' },
  { path: 'tracking', component: TrackingComponent, pathMatch: 'full' },
  { path: 'measure-surface', component: MeasureSurfaceComponent, pathMatch: 'full' }
  // { path: '**', component: PageNotFoundComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {})],
  exports: [RouterModule]
})
export class AppRoutingModule { }
