import { Component } from "@angular/core";
import { SettingsComponent } from "./settings.component";

@Component({
    selector: 'app-settings', template: ''
})
export class MockSettingsComponent implements Partial<SettingsComponent> { }
