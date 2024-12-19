import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SettingsGroupComponent, ValueSelectionComponent } from '@reflex/angular-components/dist';
import { BehaviorSubject, Subscription, filter, timer } from 'rxjs';

@Component({
    selector: 'app-select',
    imports: [CommonModule, FormsModule, SettingsGroupComponent, ValueSelectionComponent],
    templateUrl: './select.component.html',
    styleUrl: './select.component.scss'
})
export class SelectComponent implements OnInit, OnDestroy {
  public filters = [
    'Default',
    'Custom Special',
    'Moving Average',
    'SavitzyGolay',
    'None'
  ];

  public selectedFilterIdx = 0;

  public statusMessage = '';

  private readonly remainingToast: BehaviorSubject<number> = new BehaviorSubject(0);
  private readonly notification$: Subscription = new Subscription();

  public ngOnInit(): void {
    this.notification$.add(
      this.remainingToast.pipe(
        filter((value) => value === 0)
      ).subscribe({
        next: () => (this.statusMessage = '')
      })
    );
  }

  public ngOnDestroy(): void {
    this.notification$?.unsubscribe();
  }

  public saveFilterType(): void {
    this.remainingToast.next(this.remainingToast.getValue() + 1);
    this.statusMessage = `savedFilter: ${this.filters[this.selectedFilterIdx]} (x${this.remainingToast.getValue()})`;

    timer(2000).pipe(
      filter(() => this.remainingToast.getValue() > 0)
    ).subscribe({
      complete: () => this.remainingToast.next(this.remainingToast.getValue() - 1)
    });
  }
}
