import { Component, OnDestroy, OnInit } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';
import { LogService } from './log.service';
import { LogLevel, LogMessageDetail } from '@reflex/shared-types';
import { ValueSelectionComponent } from '@reflex/angular-components/dist';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-log',
  templateUrl: './log.component.html',
  imports: [
    CommonModule,
    FormsModule,
    ValueSelectionComponent
  ]
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
    this.filteredMessages = this.filterLevel as LogLevel >= LogLevel.Trace && this.filterLevel as LogLevel <= LogLevel.Off
      ? this.messages.filter((msg) => LogLevel[msg.level] === LogLevel[this.filterLevel])
      : this.messages;
  }
}
