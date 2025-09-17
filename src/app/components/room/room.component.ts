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
    <div class="room-wrapper">
      <div class="room-container">
        <img [src]="backgroundImageSrc" alt="Room Background" class="room-background" />
        <app-window></app-window>
        <app-character></app-character>
      </div>
      <app-header></app-header>
      <app-sidebar></app-sidebar>
      <app-status-bar></app-status-bar>
    </div>
  `,
  styles: [`
    .room-wrapper {
      position: relative;
      width: 100%;
      height: 100vh;
      overflow-x: auto;
      overflow-y: hidden;
    }

    .room-container {
      position: relative;
      width: 1920px;
      height: 100vh;
    }

    .room-background {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: -1;
      object-fit: cover;
    }

  `]
})
export class RoomComponent implements OnInit {
  backgroundImageSrc = sources.scene.roomDayLightOn;

  ngOnInit() {
    // Initialize room state
  }
}
