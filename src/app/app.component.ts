import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { WelcomeComponent } from './components/welcome/welcome.component';
import { RoomComponent } from './components/room/room.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, WelcomeComponent, RoomComponent],
  template: `
    <div class="app-container">
      <app-welcome *ngIf="showWelcome"></app-welcome>
      <app-room *ngIf="showRoom"></app-room>
    </div>
  `,
  styles: [`
    .app-container {
      width: 100%;
      height: 100vh;
      overflow: hidden;
    }
  `]
})
export class AppComponent implements OnInit {
  title = 'achick';
  showWelcome = true;
  showRoom = false;

  ngOnInit() {
    // Listen for welcome page completion
    setTimeout(() => {
      this.checkWelcomeCompletion();
    }, 1000);
  }

  private checkWelcomeCompletion() {
    const interval = setInterval(() => {
      const welcomeElement = document.querySelector('.welcome-overlay');
      if (!welcomeElement) {
        this.showWelcome = false;
        this.showRoom = true;
        clearInterval(interval);
      }
    }, 100);
  }
}
