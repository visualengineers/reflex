import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { OptionCheckboxComponent, PanelHeaderComponent, SettingsGroupComponent, ValueSelectionComponent, ValueSliderComponent, ValueTextComponent } from '@reflex/angular-components/dist';
import { ColorComponent } from './color/color.component';
import { BehaviorSubject, Subscription, filter, interval, timer } from 'rxjs';
import { DataService } from '../services/data.service';
import { HttpClientModule } from '@angular/common/http';
import { AsyncPipe

 } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    HttpClientModule,
    FormsModule,
    RouterOutlet,
    SettingsGroupComponent,
    PanelHeaderComponent,
    OptionCheckboxComponent,
    ValueSelectionComponent,
    ValueSliderComponent,
    ValueTextComponent,
    ColorComponent,
    AsyncPipe
  ],
  providers: [
    DataService
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {

  public title = 'ReFlex Shared Components Demo';

  public version = '1.0.0';

  public angular_json: BehaviorSubject<string> = new BehaviorSubject('');
  public component_imports: BehaviorSubject<string> = new BehaviorSubject('');

  public toggleHeaderActive = true;
  public canToggleHeader = true;
  public toggleToast = '';

  private remainingToast: BehaviorSubject<number> = new BehaviorSubject(0);
  private notification$: Subscription = new Subscription();

  public constructor(private dataService: DataService) {

  }

  public ngOnInit(): void {
    this.dataService.loadAngularJson().subscribe({
      next: (result) => {
        this.angular_json.next(result)
      },
      error: (error) => console.error('could not load angular.json text', error)
    });

    this.dataService.loadComponentImports().subscribe({
      next: (result) => {
        this.component_imports.next(result)
      },
      error: (error) => console.error('could not load component imports text', error)
    });

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

    console.log(this.toggleHeaderActive);

    timer(2000).pipe(
      filter(() => this.remainingToast.getValue() > 0)
    ).subscribe({
      complete:() => ( this.remainingToast.next(this.remainingToast.getValue() - 1))
    })
  }
}
