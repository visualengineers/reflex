import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { SettingsGroupComponent, PanelHeaderComponent, OptionCheckboxComponent, ValueSelectionComponent, ValueSliderComponent, ValueTextComponent } from '@reflex/angular-components/dist';
import { BehaviorSubject, Subscription, filter, timer } from 'rxjs';
import { ColorComponent } from '../../color/color.component';

@Component({
    selector: 'app-panel',
    imports: [
        CommonModule,
        FormsModule,
        RouterOutlet,
        SettingsGroupComponent,
        PanelHeaderComponent,
        OptionCheckboxComponent,
        ValueSelectionComponent,
        ValueSliderComponent,
        ValueTextComponent,
        ColorComponent
    ],
    templateUrl: './panel.component.html',
    styleUrl: './panel.component.scss'
})
export class PanelComponent implements OnInit, OnDestroy {
  public toggleHeaderActive = true;
  public canToggleHeader = true;
  public toggleToast = '';

  private readonly remainingToast: BehaviorSubject<number> = new BehaviorSubject(0);
  private readonly notification$: Subscription = new Subscription();

  public ngOnInit(): void {
    this.notification$.add(
      this.remainingToast.pipe(
        filter((value) => value === 0)
      ).subscribe({
        next: () => (this.toggleToast = '')
      })
    );
  }

  public ngOnDestroy(): void {
    this.notification$?.unsubscribe();
  }

  public toggleHeaderChanged(): void {
    this.remainingToast.next(this.remainingToast.getValue() + 1);
    this.toggleToast = `changed (x${this.remainingToast.getValue()})`;

    timer(2000).pipe(
      filter(() => this.remainingToast.getValue() > 0)
    ).subscribe({
      complete: () => this.remainingToast.next(this.remainingToast.getValue() - 1)
    });
  }

  public update(event: boolean): void {
    this.toggleHeaderActive = event;
    console.log(this.toggleHeaderActive);
  }

}
