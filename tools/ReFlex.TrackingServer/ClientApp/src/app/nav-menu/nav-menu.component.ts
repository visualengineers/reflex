/* eslint-disable @typescript-eslint/no-extraneous-class */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-nav-menu',
  templateUrl: './nav-menu.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [RouterModule]
})
export class NavMenuComponent {}
