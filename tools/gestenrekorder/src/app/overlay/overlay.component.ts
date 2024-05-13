import { Component, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsGroupComponent } from '@reflex/angular-components/dist';

@Component({
  selector: 'app-overlay',
  standalone: true,
  imports: [CommonModule,SettingsGroupComponent],
  templateUrl: './overlay.component.html',
  styleUrl: './overlay.component.scss'
})
export class OverlayComponent {
  isOverlayOpen: boolean = false;

  constructor(private elementRef: ElementRef) {}

  toggleOverlay() {
    this.isOverlayOpen = !this.isOverlayOpen;
    if (this.isOverlayOpen) {
      this.addClickOutsideListener();
    } else {
      this.removeClickOutsideListener();
    }
  }

  closeOverlay() {
    this.isOverlayOpen = false;
    this.removeClickOutsideListener();
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeOverlay();
    }
  }

  addClickOutsideListener() {
    document.addEventListener('click', this.onClickOutside.bind(this));
  }

  removeClickOutsideListener() {
    document.removeEventListener('click', this.onClickOutside.bind(this));
  }

}
