import { Component, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsGroupComponent } from '@reflex/angular-components/dist';
import { GestureoptionsComponent } from '../gestureoptions/gestureoptions.component';
import { RecorderoptionsComponent } from '../recorderoptions/recorderoptions.component';
import { SavingoptionsComponent } from '../savingoptions/savingoptions.component';
@Component({
    selector: 'app-dropdown',
    imports: [CommonModule, SettingsGroupComponent, RecorderoptionsComponent, GestureoptionsComponent, SavingoptionsComponent],
    templateUrl: './dropdown.component.html',
    styleUrl: './dropdown.component.scss'
})
export class DropdownComponent {
  isGestureDropdownOpen: boolean = false;
  isRecorderDropdownOpen: boolean = false;
  isSavingDropdownOpen: boolean = false;

  constructor(
    private elementRef: ElementRef,
  ) {}

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
