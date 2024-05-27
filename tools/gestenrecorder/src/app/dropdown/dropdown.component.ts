import { Component, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsGroupComponent, ValueTextComponent } from '@reflex/angular-components/dist';

@Component({
  selector: 'app-dropdown',
  standalone: true,
  imports: [CommonModule,SettingsGroupComponent,ValueTextComponent],
  templateUrl: './dropdown.component.html',
  styleUrl: './dropdown.component.scss'
})
export class DropdownComponent {
  isDropdownOpen: boolean = false;

  constructor(private elementRef: ElementRef) {}

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
    if (this.isDropdownOpen) {
      this.addClickOutsideListener();
    } else {
      this.removeClickOutsideListener();
    }
  }

  closeDropdown() {
    this.isDropdownOpen = false;
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
