import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ValueSelectionComponent } from '@reflex/angular-components/dist';
import { LogLevel, LogMessageDetail } from '@reflex/shared-types';
import { interval, Subscription } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';
import { markViewForCheck } from 'src/shared/util/mark-view-for-check';
import { LogService } from './log.service';

@Component({
  selector: 'app-log',
  templateUrl: './log.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [FormsModule, ValueSelectionComponent]
})
export class LogComponent implements OnInit, OnDestroy {
  public messages = new Array<LogMessageDetail>();
  public filteredMessages = new Array<LogMessageDetail>();

  public filterLevel: LogLevel | -1 = -1;
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly logService = inject(LogService);

  private logSubscription?: Subscription;

  public ngOnInit(): void {
    this.logService.reset();

    this.logSubscription = interval(500)
      .pipe(
        startWith(0),
        switchMap(() => this.logService.getLogs())
      )
      .pipe(markViewForCheck(this.changeDetector))
      .subscribe(
        (result) => {
          this.messages = [...this.messages, result];
          this.filter();
        },
        (error) => {
          console.log(error);
          this.logService.sendErrorLog(`${error}`);
        }
      );
  }

  public ngOnDestroy(): void {
    this.logSubscription?.unsubscribe();
  }

  public refresh(): void {
    this.messages = [];
    this.filteredMessages = [];
    this.logService.reset();
  }

  public getLogLevel(level: LogLevel): string {
    return LogLevel[level];
  }

  public getClass(level: LogLevel): string {
    switch (level) {
      case LogLevel.Trace:
      case LogLevel.Info:
        return 'table-dark';
      case LogLevel.Debug:
        return 'table-info';
      case LogLevel.Warn:
        return 'table-warning';
      case LogLevel.Error:
      case LogLevel.Fatal:
        return 'table-danger';
      case LogLevel.Off:
      default:
        return 'table-light';
    }
  }

  public filter(): void {
    this.filteredMessages
      = this.filterLevel >= LogLevel.Trace && this.filterLevel <= LogLevel.Off
        ? this.messages.filter(
          (msg) => LogLevel[msg.level] === LogLevel[this.filterLevel]
        )
        : this.messages;
  }
}
