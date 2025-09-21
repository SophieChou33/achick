import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { sources } from '../../../sources';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <aside class="sidebar">
      <div class="sidebar-functions">
        <button class="sidebar-btn" (click)="toggleLight()" [title]="'電燈開關'">
          <img [src]="lampIcon" alt="電燈" class="sidebar-icon" />
        </button>
        <button class="sidebar-btn" (click)="sleep()" [title]="'睡眠'">
          <img [src]="sleepIcon" alt="睡眠" class="sidebar-icon" />
        </button>
        <button class="sidebar-btn" (click)="feed()" [title]="'餵食'">
          <img [src]="feedIcon" alt="餵食" class="sidebar-icon" />
        </button>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      position: fixed;
      left: 20px;
      top: 50%;
      transform: translateY(-50%);
      z-index: 900;
    }

    .sidebar-functions {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .sidebar-btn {
      width: 60px;
      height: 60px;
      background: rgba(255, 240, 230, 0.5);
      border: 2px solid rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      justify-content: center;
      align-items: center;
      transition: all 0.3s ease;\n      backdrop-filter: blur(5px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    }

    .sidebar-btn:hover {
      background: rgba(255, 255, 255, 1);
      transform: scale(1.1);
      box-shadow: 0 6px 12px rgba(0,0,0,0.3);
    }

    .sidebar-icon {
      width: 40px;
      height: 40px;
    }

  `]
})
export class SidebarComponent {
  lampIcon = sources.otherIcons.lamp;
  sleepIcon = sources.otherIcons.sleep;
  feedIcon = sources.otherIcons.feed;

  toggleLight() {
    console.log('Toggling light...');
    // TODO: Implement light toggle functionality
  }

  sleep() {
    console.log('Sleep function...');
    // TODO: Implement sleep functionality
  }

  feed() {
    console.log('Feed function...');
    // TODO: Implement feeding functionality
  }
}