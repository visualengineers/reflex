import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PanelHeaderComponent, SettingsGroupComponent } from '@reflex/angular-components/dist';
import { ColorComponent } from './color/color.component';
import { CommonModule } from '@angular/common';
import { IntroductionComponent } from './introduction/introduction.component';
import { PanelComponent } from './controls/panel/panel.component';
import { ToggleComponent } from './controls/toggle/toggle.component';
import { TextBoxComponent } from './controls/text-box/text-box.component';
import { SelectComponent } from './controls/select/select.component';
import { SliderComponent } from './controls/slider/slider.component';
import { TableComponent } from './controls/table/table.component';
import { ButtonsComponent } from './controls/buttons/buttons.component';

@Component({
    selector: 'app-root',
    imports: [
        IntroductionComponent,
        PanelComponent,
        ToggleComponent,
        TextBoxComponent,
        SelectComponent,
        SliderComponent,
        TableComponent,
        ButtonsComponent,
        CommonModule,
        RouterOutlet,
        SettingsGroupComponent,
        PanelHeaderComponent,
        ColorComponent
    ],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss'
})
export class AppComponent {

  public title = 'ReFlex Shared Components Demo';

  public version = '1.0.0';


}
