# How to configure Angular to use shared components

## angular.json

* in `projects/{{your_project}}/architect/build/options` add :

``` json

  "options": {
    // ... 
    "assets": [
    // keep local assets
    // add copy from exteternal location  (path to node_modules folder of package)
      {
        "glob": "**/*",
        "input": "../../node_modules/@reflex/angular-components/src/assets",
        "output": "assets"
      }
    ],
    "stylePreprocessorOptions": {
      // path to exported styes directory
      "includePaths": [
        "../../node_modules/@reflex/angular-components/src/scss"
      ]
    },
    // ...
  }

```

## add imports in component

``` TypeScript

  import { SettingsGroupComponent, ValueSliderComponent, ValueSelectionComponent, OptionCheckboxComponent, PanelHeaderComponent, ValueTextComponent } from '@reflex/angular-components/dist';

  @Component({
    selector: 'your-component-selector',
    standalone: true,
    imports: [
      RouterOutlet,
      SettingsGroupComponent,
      ValueSliderComponent,
      ValueSelectionComponent,
      OptionCheckboxComponent,
      PanelHeaderComponent,
      ValueTextComponent
    ],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss'
  })

```
