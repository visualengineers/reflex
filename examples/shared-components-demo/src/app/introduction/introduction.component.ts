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
  public angularJson: BehaviorSubject<string> = new BehaviorSubject('');
  public packageJson: BehaviorSubject<string> = new BehaviorSubject('');
  public componentImports: BehaviorSubject<string> = new BehaviorSubject('');

  public constructor(private readonly dataService: DataService) { }

  public ngOnInit(): void {
    this.dataService.loadAngularJson().subscribe({
      next: (result) => {
        this.angularJson.next(result);
      },
      error: (error) => console.error('could not load angular.json text', error)
    });

    this.dataService.loadPackageJson().subscribe({
      next: (result) => {
        this.packageJson.next(result);
      },
      error: (error) => console.error('could not load angular.json text', error)
    });

    this.dataService.loadComponentImports().subscribe({
      next: (result) => {
        this.componentImports.next(result);
      },
      error: (error) => console.error('could not load component imports text', error)
    });
  }

}
