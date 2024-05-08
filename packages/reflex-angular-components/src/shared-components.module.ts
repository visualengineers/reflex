import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { OptionCheckboxComponent } from "./components/option-checkbox/option-checkbox.component";
import { PanelHeaderComponent } from "./components/panel-header/panel-header.component";
import { SettingsGroupComponent } from "./components/settings-group/settings-group.component";
import { ValueSelectionComponent } from "./components/value-selection/value-selection.component";
import { ValueSliderComponent } from "./components/value-slider/value-slider.component";
import { ValueTextComponent } from "./components/value-text/value-text.component";

@NgModule(
  {
     imports: [
      CommonModule,
      FormsModule,
      OptionCheckboxComponent,
      PanelHeaderComponent,
      SettingsGroupComponent,
      ValueSelectionComponent,
      ValueSliderComponent,
      ValueTextComponent
     ],
     exports: [
      OptionCheckboxComponent,
      PanelHeaderComponent,
      SettingsGroupComponent,
      ValueSelectionComponent,
      ValueSliderComponent,
      ValueTextComponent
     ]
  }
)
export class ReFlexSharedComponentsModule { }
