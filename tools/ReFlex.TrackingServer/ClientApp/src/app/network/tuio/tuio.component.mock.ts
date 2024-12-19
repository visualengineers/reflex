import { Component } from "@angular/core";
import { TuioComponent } from "./tuio.component";

@Component({
    selector: 'app-tuio', template: '',
    standalone: false
})
export class MockTuioComponent implements Partial<TuioComponent> {
  
}