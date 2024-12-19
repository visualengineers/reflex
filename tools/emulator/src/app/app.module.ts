import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { AppComponent } from './app.component';
import { CanvasComponent } from './canvas/canvas.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { TimelineComponent } from './timeline/timeline.component';
import { TimelineCanvasComponent } from './timeline/timeline-canvas/timeline-canvas.component';
import { GestureReplayService } from './service/gesture-replay.service';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

@NgModule({ declarations: [
        AppComponent,
        CanvasComponent,
        SidebarComponent,
        TimelineComponent,
        TimelineCanvasComponent
    ],
    bootstrap: [AppComponent], imports: [AppRoutingModule,
        BrowserModule,
        FontAwesomeModule,
        FormsModule], providers: [
        GestureReplayService,
        provideHttpClient(withInterceptorsFromDi()),
    ] })
export class AppModule { }
