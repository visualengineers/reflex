import { HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { SettingsGroupComponent } from '@reflex/angular-components/dist';
import { BehaviorSubject } from 'rxjs';
import { DataService } from '../../services/data.service';
import { AsyncPipe } from '@angular/common';


@Component({
  selector: 'app-introduction',
  standalone: true,
  imports: [
    HttpClientModule,
    SettingsGroupComponent,
    AsyncPipe
  ],
  templateUrl: './introduction.component.html',
  styleUrl: './introduction.component.scss'
})
export class IntroductionComponent implements OnInit {
  public angular_json: BehaviorSubject<string> = new BehaviorSubject('');
  public component_imports: BehaviorSubject<string> = new BehaviorSubject('');

  public constructor(private dataService: DataService) { }

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
