import {
  Component,
  ElementRef,
  HostListener,
  inject,
  ChangeDetectionStrategy,
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
    SavingoptionsComponent,
  ],
  templateUrl: './dropdown.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './dropdown.component.scss',
})
export class DropdownComponent {
  private elementRef = inject(ElementRef);

  isGestureDropdownOpen: boolean = false;
  isRecorderDropdownOpen: boolean = false;
  isSavingDropdownOpen: boolean = false;

  closeDropdown() {
    this.isGestureDropdownOpen = false;
    this.isRecorderDropdownOpen = false;
    this.isSavingDropdownOpen = false;
    this.removeClickOutsideListener();
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeDropdown();
    }
  }

  addClickOutsideListener() {
    document.addEventListener('click', this.onClickOutside.bind(this));
  }

  removeClickOutsideListener() {
    document.removeEventListener('click', this.onClickOutside.bind(this));
  }
}
