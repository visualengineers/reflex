import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { InteractionHistory } from '@reflex/shared-types';
import { NEVER, Subscription } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';
import { LogService } from 'src/app/log/log.service';
import { ProcessingService } from 'src/shared/services/processing.service';

@Component({
  selector: 'app-history-visualization',
  templateUrl: './history-visualization.component.html',
  styleUrls: ['./history-visualization.component.scss'],
  imports: [CommonModule]
})
export class HistoryVisualizationComponent implements OnInit, OnDestroy {

  @ViewChild('historyVis')
  public container?: ElementRef;

  public history: Array<InteractionHistory> = [];

  private historySubscription?: Subscription;

  public constructor(private readonly processingService: ProcessingService, private readonly logService: LogService) { }

  public ngOnInit(): void {

    const history$ = this.processingService.getHistory();

    this.historySubscription = this.processingService.getStatus()
      .pipe(
        switchMap((processing) => processing ? history$ : NEVER.pipe<Array<InteractionHistory>>(startWith([])))
      )
      .subscribe(
        (result) => this.updateHistory(result),
        (error) => {
          console.error(error);
          this.logService.sendErrorLog(`${error}`);
        }
      );
  }

  public ngOnDestroy(): void {
    this.historySubscription?.unsubscribe();
  }

  private updateHistory(history: Array<InteractionHistory>): void {
    history.forEach((elem) => elem.items.forEach((frame) => {
      frame.interaction.position.x = frame.interaction.position.x * (this.container?.nativeElement.clientWidth ?? 0);
      frame.interaction.position.y = frame.interaction.position.y * (this.container?.nativeElement.clientHeight ?? 0);
    }));

    this.history = history;
  }

}
