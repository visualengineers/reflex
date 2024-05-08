import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { OptionCheckboxComponent, PanelHeaderComponent, SettingsGroupComponent, ValueSelectionComponent, ValueSliderComponent, ValueTextComponent } from '@reflex/angular-components/dist';
import { ColorComponent } from './color/color.component';
import { BehaviorSubject, interval } from 'rxjs';
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
export class AppComponent implements OnInit {

  public title = 'ReFlex Shared Components Demo';

  public version = '1.0.0';

  public angular_json: BehaviorSubject<string> = new BehaviorSubject('');
  public component_imports: BehaviorSubject<string> = new BehaviorSubject('');

  public toggleHeaderActive = true;
  public canToggleHeader = true;
  public toggleToast = '';

  private remainingToast = 0;

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
  }

  public toggleHeaderChanged() {
    console.warn(this.toggleToast);
    this.toggleToast = 'changed';
    this.remainingToast++;

    interval(3000).subscribe({
      next:() => {
        if (this.remainingToast <= 1) {
          this.toggleToast = '';
        }
        this.remainingToast--;
      }
    })
  }


}
