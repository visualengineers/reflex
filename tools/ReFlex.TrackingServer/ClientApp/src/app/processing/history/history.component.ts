import { Component, OnDestroy, OnInit } from '@angular/core';
import { InteractionFrame, InteractionHistory } from '@reflex/shared-types';
import { NEVER, Subscription } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';
import { LogService } from 'src/app/log/log.service';
import { ProcessingService } from 'src/shared/services/processing.service';

@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss']
})
export class HistoryComponent implements OnInit, OnDestroy {

  public frames: Array<InteractionFrame> = [];

  public history: Array<InteractionHistory> = [];

  private framesSubscription?: Subscription;
  private historySubscription?: Subscription;

  public constructor(private readonly processingService: ProcessingService, private readonly logService: LogService) { }

  public ngOnInit(): void {
    const frames$ = this.processingService.getFrames();
    const history$ = this.processingService.getHistory();

    this.framesSubscription = this.processingService.getStatus()
      .pipe(
        switchMap((processing) => processing ? frames$ : NEVER.pipe<Array<InteractionFrame>>(startWith([])))
      )
      .subscribe(
        (result) => this.updateFrames(result),
        (error) => {
          console.error(error);
          this.logService.sendErrorLog(`${error}`);
        }
      );

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
    this.framesSubscription?.unsubscribe();
    this.historySubscription?.unsubscribe();
  }

  private updateFrames(frames: Array<InteractionFrame>): void {
    this.frames = frames;
  }

  private updateHistory(history: Array<InteractionHistory>): void {
    this.history = history;
  }
}
