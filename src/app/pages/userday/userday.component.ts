import { Component } from '@angular/core';
import { perfNow } from 'src/app/util/util';

@Component({
  selector: 'app-userday',
  templateUrl: './userday.component.html',
  styleUrls: ['./userday.component.css'],
})
export class UserdayComponent {
  constructor() {}

  ngOnInit() {
    console.log(`${perfNow()}: Page loaded: Roadmap`);
  }
}
