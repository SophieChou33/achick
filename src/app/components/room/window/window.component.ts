import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-window',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="window-area" (click)="onWindowClick()">
      <div class="window-frame"></div>
    </div>
  `,
  styles: [`
    .window-area {
      position: fixed;
      left: calc(50% + 70px);
      top: calc(30vh - 160px);
      transform: translateX(-50%);
      width: 210px;
      height: 210px;
      cursor: pointer;
      z-index: 800;
    }

    .window-frame {
      width: 100%;
      height: 100%;
      border: 3px solid rgba(255, 255, 255, 0.3);
      border-radius: 10px;
      background: rgba(135, 206, 235, 0.2);
      transition: all 0.3s ease;
    }

    .window-frame:hover {
      background: rgba(135, 206, 235, 0.4);
      border-color: rgba(255, 255, 255, 0.6);
    }

    @media (max-width: 768px) {
      .window-area {
        width: 30px;
        height: 40px;
        left: calc(50% + 35px);
        top: calc(30vh - 80px);
      }
    }
  `]
})
export class WindowComponent {

  onWindowClick() {
    console.log('Window clicked...');
    // TODO: Implement window interaction functionality
  }
}