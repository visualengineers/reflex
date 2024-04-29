import { Component } from '@angular/core';
import { OptionCheckboxComponent } from '../../../lib/src/public-api';

@Component({
  selector: 'app-test-component',
  standalone: true,
  imports: [OptionCheckboxComponent],
  templateUrl: './test-component.component.html',
  styleUrl: './test-component.component.scss'
})
export class TestComponentComponent {

}

