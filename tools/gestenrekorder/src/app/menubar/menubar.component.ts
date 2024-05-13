import { Component } from '@angular/core';

@Component({
  selector: 'app-menubar',
  standalone: true,
  templateUrl: './menubar.component.html',
  styleUrls: ['./menubar.component.scss']
})
export class MenubarComponent {
  isDropdownOpen: boolean = false;

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }
}
