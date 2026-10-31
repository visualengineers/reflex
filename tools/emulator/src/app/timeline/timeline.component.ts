import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ConfigurationService } from '../service/configuration.service';
import { ConnectionService } from '../service/connection.service';
import { TimelineCanvasComponent } from './timeline-canvas/timeline-canvas.component';

@Component({
  selector: 'app-timeline',
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.sass'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule, TimelineCanvasComponent]
})
export class TimelineComponent {

  public isCollapsed = false;
  private readonly configurationService = inject(ConfigurationService);
  private readonly connectionService = inject(ConnectionService);

  public toggleTimeline(): void {
    this.isCollapsed = !this.isCollapsed;
  }
}
