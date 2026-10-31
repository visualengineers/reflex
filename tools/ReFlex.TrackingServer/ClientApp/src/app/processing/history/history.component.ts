import { markViewForCheck } from 'src/shared/util/mark-view-for-check';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { SettingsGroupComponent } from '@reflex/angular-components/dist';
import { InteractionFrame, InteractionHistory } from '@reflex/shared-types';
import { NEVER, Subscription } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';
import { LogService } from 'src/app/log/log.service';
import { ProcessingService } from 'src/shared/services/processing.service';

@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule, SettingsGroupComponent],
})
export class HistoryComponent implements OnInit, OnDestroy {
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly processingService = inject(ProcessingService);
  private readonly logService = inject(LogService);

  public frames: Array<InteractionFrame> = [];

  public history: Array<InteractionHistory> = [];

  private framesSubscription?: Subscription;
  private historySubscription?: Subscription;

  public ngOnInit(): void {
    const frames$ = this.processingService.getFrames();
    const history$ = this.processingService.getHistory();

    this.framesSubscription = this.processingService
      .getStatus()
      .pipe(
        switchMap((processing) =>
          processing
            ? frames$
            : NEVER.pipe<Array<InteractionFrame>>(startWith([]))
        )
      )
      .pipe(markViewForCheck(this.changeDetector))
      .subscribe(
        (result) => this.updateFrames(result),
        (error) => {
          console.error(error);
          this.logService.sendErrorLog(`${error}`);
        }
      );

    this.historySubscription = this.processingService
      .getStatus()
      .pipe(
        switchMap((processing) =>
          processing
            ? history$
            : NEVER.pipe<Array<InteractionHistory>>(startWith([]))
        )
      )
      .pipe(markViewForCheck(this.changeDetector))
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
