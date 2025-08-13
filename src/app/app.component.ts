import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';
import { version } from 'src/main';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  title = 'DSOMM';
  version: string = version || '';
  menuIsOpen: boolean = true;

  __experimental__updated: Date = new Date();

  ngOnInit(): void {
    let menuState: string | null = localStorage.getItem('state.menuIsOpen');
    if (menuState === 'false') {
      setTimeout(() => {
        this.menuIsOpen = false;
      }, 600);
    }

    if (environment?.experimental) {
      fetch('https://api.github.com/repos/vbakke/DevSecOps-MaturityModel/branches/experiment')
        .then(async (response) =>  {
          let gitinfo: any  = await response.json();
          let commitDate: string = gitinfo?.commit?.commit?.author?.date;
          let commitMsg: string = gitinfo?.commit?.commit?.message;
          if (commitDate) {
            let element = document.querySelector('.tag-subtitle');
            if (element) {
              element.textContent = `Updated: ${commitDate?.replace('T', ' ')}: ${commitMsg}`;
              if (localStorage.getItem('debugid')) {
                element.textContent += ' (id: ' + localStorage.getItem('debugid') + ')';
              }
            }
          }
      });
    }
  }

  toggleMenu(): void {
    this.menuIsOpen = !this.menuIsOpen;
    localStorage.setItem('state.menuIsOpen', this.menuIsOpen.toString());
  }
}
