import {
  Component,
  OnInit,
  inject,
  ChangeDetectionStrategy
} from '@angular/core';
import { SettingsGroupComponent } from '@reflex/angular-components/dist';
import { BehaviorSubject } from 'rxjs';
import { DataService } from '../../services/data.service';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-introduction',
  imports: [SettingsGroupComponent, AsyncPipe],
  templateUrl: './introduction.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './introduction.component.scss'
})
export class IntroductionComponent implements OnInit {

  public angularJson: BehaviorSubject<string> = new BehaviorSubject('');
  public packageJson: BehaviorSubject<string> = new BehaviorSubject('');
  public componentImports: BehaviorSubject<string> = new BehaviorSubject('');
  private readonly dataService = inject(DataService);

  public ngOnInit(): void {
    this.dataService.loadAngularJson().subscribe({
      next: (result) => {
        this.angularJson.next(result);
      },
      error: (error) =>
        console.error('could not load angular.json text', error)
    });

    this.dataService.loadPackageJson().subscribe({
      next: (result) => {
        this.packageJson.next(result);
      },
      error: (error) =>
        console.error('could not load angular.json text', error)
    });

    this.dataService.loadComponentImports().subscribe({
      next: (result) => {
        this.componentImports.next(result);
      },
      error: (error) =>
        console.error('could not load component imports text', error)
    });
  }
}
