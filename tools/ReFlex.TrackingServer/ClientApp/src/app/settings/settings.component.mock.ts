import { Component } from "@angular/core";
import { SettingsComponent } from "./settings.component";

@Component({
    selector: 'app-settings', template: '',
    standalone: false
})
export class MockSettingsComponent implements Partial<SettingsComponent> { }