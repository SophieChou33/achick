import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './header/header.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { WindowComponent } from './window/window.component';
import { StatusBarComponent } from './status-bar/status-bar.component';
import { CharacterComponent } from './character/character.component';
import { sources } from '../../sources';

@Component({
  selector: 'app-room',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    SidebarComponent,
    WindowComponent,
    StatusBarComponent,
    CharacterComponent
  ],
  template: `
    <div class="room-container" [style.background-image]="backgroundImage">
      <app-header></app-header>
      <app-sidebar></app-sidebar>
      <app-window></app-window>
      <app-character></app-character>
      <app-status-bar></app-status-bar>
    </div>
  `,
  styles: [`
    .room-container {
      position: relative;
      min-width: 1400px;
      width: 100%;
      height: 100vh;
      background-size: cover;
      background-repeat: no-repeat;
      background-position: center;
      overflow: hidden;
    }

    @media (max-width: 768px) {
      .room-container {
        min-width: 100vw;
      }
    }
  `]
})
export class RoomComponent implements OnInit {
  backgroundImage = `url('${sources.scene.roomDayLightOn}')`;

  ngOnInit() {
    // Initialize room state
  }
}