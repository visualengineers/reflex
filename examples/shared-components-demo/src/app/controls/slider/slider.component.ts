import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SettingsGroupComponent, ValueSliderComponent } from '@reflex/angular-components/dist';

@Component({
  selector: 'app-slider',
  standalone: true,
  imports: [CommonModule, FormsModule, SettingsGroupComponent, ValueSliderComponent],
  templateUrl: './slider.component.html',
  styleUrl: './slider.component.scss'
})
export class SliderComponent {
  public sliderData = 0.75;
  public sliderData2 = 1.5;

  public checkSlider2(): void {
    if (this.sliderData2 < this.sliderData) {
      this.sliderData2 = this.sliderData;
    }
  }
}
