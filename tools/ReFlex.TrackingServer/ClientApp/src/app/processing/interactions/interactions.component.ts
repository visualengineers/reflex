import { DatePipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { CompleteInteractionData, Interaction } from '@reflex/shared-types';
@Component({
    selector: 'app-interactions',
    templateUrl: './interactions.component.html',
    styleUrls: ['./interactions.component.scss'],
    standalone: false
})
export class InteractionsComponent {

  public interactions: CompleteInteractionData = { raw: [], absolute: [], normalized: [] };
  public calibratedInteractions: Array<Interaction> = [];

  private pIsProcessing = false;
  private readonly datePipe: DatePipe = new DatePipe('en-US', '+0000');

  public get isProcessing(): boolean {
    return this.pIsProcessing;
  }

  @Input()
  public set isProcessing(value: boolean) {
    this.pIsProcessing = value;
    if (!this.pIsProcessing) {
      this.interactions = { raw: [], absolute: [], normalized: [] };
    }
  }

  public getTime(ticks: number): string {
    // ticks are in nanotime; convert to microtime
    const ticksToMicrotime = Math.floor(ticks / 10000);

    // ticks are recorded from 1/1/1; get microtime difference from 1/1/1/ to 1/1/1970
    const epochMicrotimeDiff = 62135596800000;

    // new date is ticks, converted to microtime, minus difference from epoch microtime
    const tickDate = ticksToMicrotime - epochMicrotimeDiff;

    const resultDate = new Date(tickDate);

    return this.datePipe.transform(resultDate.getTime(), 'HH:mm:ss.SSS') as string;
  }

  public updateInteractions(interactions: CompleteInteractionData): void {
    const maxItems = Math.min(interactions.raw.length, 10);

    this.interactions.raw = interactions.raw.slice(0, maxItems);
    this.interactions.normalized = interactions.normalized.slice(0, maxItems);
    this.interactions.absolute = interactions.absolute.slice(0, maxItems);
  }
}
