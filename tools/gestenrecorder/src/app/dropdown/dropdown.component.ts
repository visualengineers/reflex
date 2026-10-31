import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject
} from '@angular/core';

import { SettingsGroupComponent } from '@reflex/angular-components/dist';
import { GestureoptionsComponent } from '../gestureoptions/gestureoptions.component';
import { RecorderoptionsComponent } from '../recorderoptions/recorderoptions.component';
import { SavingoptionsComponent } from '../savingoptions/savingoptions.component';
@Component({
  selector: 'app-dropdown',
  imports: [
    SettingsGroupComponent,
    RecorderoptionsComponent,
    GestureoptionsComponent,
    SavingoptionsComponent
  ],
  templateUrl: './dropdown.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './dropdown.component.scss'
})
export class DropdownComponent {

  public isGestureDropdownOpen = false;
  public isRecorderDropdownOpen = false;
  public isSavingDropdownOpen = false;
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  @HostListener('document:click', ['$event'])
  public onClickOutside(event: Event): void {
    if (event.target instanceof Node && !this.elementRef.nativeElement.contains(event.target)) {
      this.closeDropdown();
    }
  }

  public closeDropdown(): void {
    this.isGestureDropdownOpen = false;
    this.isRecorderDropdownOpen = false;
    this.isSavingDropdownOpen = false;
    this.removeClickOutsideListener();
  }

  public addClickOutsideListener(): void {
    document.addEventListener('click', this.onClickOutside.bind(this));
  }

  public removeClickOutsideListener(): void {
    document.removeEventListener('click', this.onClickOutside.bind(this));
  }
}
