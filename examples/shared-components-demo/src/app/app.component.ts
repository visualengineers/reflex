import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SettingsGroupComponent, ValueSliderComponent, ValueSelectionComponent, OptionCheckboxComponent, PanelHeaderComponent, ValueTextComponent } from '@reflex/angular-components/dist';
import { ColorComponent } from './color/color.component';
import { BehaviorSubject } from 'rxjs';
import { DataService } from '../services/data.service';
import { HttpClientModule } from '@angular/common/http';
import { AsyncPipe, JsonPipe } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    HttpClientModule,
    RouterOutlet,
    SettingsGroupComponent,
    ValueSliderComponent,
    ValueSelectionComponent,
    OptionCheckboxComponent,
    PanelHeaderComponent,
    ValueTextComponent,
    ColorComponent, JsonPipe, AsyncPipe
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


}
