import { Component, OnDestroy, OnInit } from '@angular/core';
import { LogMessageDetail } from 'src/shared/log/logMessageDetail';
import { interval, Subscription } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';
import { LogService } from './log.service';
import { LogLevel } from 'src/shared/log/logLevel';

@Component({
  selector: 'app-log',
  templateUrl: './log.component.html'
})
export class LogComponent implements OnInit, OnDestroy {

  public messages = new Array<LogMessageDetail>();
  public filteredMessages = new Array<LogMessageDetail>();

  public filterLevel = -1;

  private logSubscription?: Subscription;

  public constructor(private readonly logService: LogService) { }

  public ngOnInit(): void {
    this.logService.reset();

    this.logSubscription = interval(500)
      .pipe(
        startWith(0),
        switchMap(() => this.logService.getLogs())
      )
      .subscribe((result) => {
        this.messages = [...this.messages, result];
        this.filter();
      }, (error) => {
        console.log(error);
        this.logService.sendErrorLog(`${error}`);
      });
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
    this.filteredMessages = this.filterLevel >= 0 && this.filterLevel <= LogLevel.Off
      ? this.messages.filter((msg) => LogLevel[msg.level] === LogLevel[this.filterLevel])
      : this.messages;
  }
}
