import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { SettingsGroupComponent } from '@reflex/angular-components/dist';

@Component({
    selector: 'app-table',
    imports: [CommonModule, SettingsGroupComponent],
    templateUrl: './table.component.html',
    styleUrl: './table.component.scss'
})
export class TableComponent {

  public tableData: Array<TestData> = [
    { id: 1,
      name: 'Max Mustermann',
      message: 'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est.',
      time: 12.567 },
    { id: 2,
      name: 'Heinz Ackermann',
      message: 'At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est.',
      time: 0.009 },
    { id: 3,
      name: 'Maria Musterfrau',
      message: 'Duis autem vel eum iriure dolor in hendrerit in vulputate velit esse molestie consequat, vel illum dolore eu feugiat nulla facilisis at vero eros et accumsan et iusto odio dignissim qui blandit praesent luptatum zzril delenit augue duis dolore te feugait nulla facilisi. ',
      time: 7 },
    { id: 4,
      name: 'Anja Allerlei',
      message: 'Ut wisi enim ad minim veniam, quis nostrud exerci tation ullamcorper suscipit lobortis nisl ut aliquip ex ea commodo consequat. ',
      time: undefined },
    { id: 5,
      name: 'Heinz-Ulrich Niemand',
      message: 'Nam liber tempor cum soluta nobis eleifend option congue nihil imperdiet doming id quod mazim placerat facer possim assum. ',
      time: 5.834 }
  ];

}

export interface TestData {
  id: number;
  name: string;
  message: string;
  time: number | undefined;
}
