import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { sources } from '../../../sources';

@Component({
  selector: 'app-bed',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bed-area" (click)="onBedClick()">
      <img [src]="bedImage" alt="Bed" class="bed-image" />
    </div>
  `,
  styles: [`
    .bed-area {
      position: absolute;
      left: 19%;
      top: 53dvh;
      width: auto;
      height: 40dvh;
      cursor: pointer;
      z-index: 600;
    }

    .bed-image {
      width: 100%;
      height: 100%;
      object-fit: contain;
      transition: all 0.3s ease;
    }
  `]
})
export class BedComponent {
  bedImage = sources.bed.bedEmptyLight;

  onBedClick() {
    console.log('Bed clicked...');
    // TODO: Implement bed interaction functionality
  }
}
