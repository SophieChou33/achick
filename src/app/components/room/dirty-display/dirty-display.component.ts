import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DirtyTriggerService } from '../../../services/dirty-trigger.service';
import { CleaningEventService } from '../../../services/cleaning-event.service';
import { sources } from '../../../sources';
import { DirtyObject } from '../../../types/dirty-object.type';

@Component({
  selector: 'app-dirty-display',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dirty-display-container">
      <div
        *ngFor="let dirtyObj of visibleDirtyObjects"
        class="dirty-item"
        [class]="'dirty-item-' + dirtyObj.dirtyNo"
        (click)="onDirtyClick(dirtyObj.dirtyNo)"
      >
        <img
          [src]="getDirtyImageSrc(dirtyObj.dirtyNo)"
          [alt]="'髒污物件 ' + dirtyObj.dirtyNo"
          class="dirty-image"
        />
      </div>
    </div>
  `,
  styles: [`
    .dirty-display-container {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 500;
    }

    .dirty-item {
      position: absolute;
      cursor: pointer;
      pointer-events: auto;
      transition: transform 0.2s ease;
    }

    .dirty-item:hover {
      transform: scale(1.1);
    }

    .dirty-image {
      width: 50px;
      height: 50px;
      object-fit: contain;
      user-select: none;
    }

    .dirty-item-1 {
      top: 60%;
      left: 20%;
    }

    .dirty-item-2 {
      top: 70%;
      left: 60%;
    }

    .dirty-item-3 {
      top: 50%;
      left: 80%;
    }
  `]
})
export class DirtyDisplayComponent implements OnInit, OnDestroy {
  visibleDirtyObjects: DirtyObject[] = [];
  private updateInterval?: number;

  constructor(
    private dirtyTriggerService: DirtyTriggerService,
    private cleaningEventService: CleaningEventService
  ) {}

  ngOnInit(): void {
    this.updateDirtyDisplay();

    this.updateInterval = window.setInterval(() => {
      this.updateDirtyDisplay();
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = undefined;
    }
  }

  private updateDirtyDisplay(): void {
    this.visibleDirtyObjects = [...this.dirtyTriggerService.dirtyObjects];
  }

  getDirtyImageSrc(dirtyNo: number): string {
    switch (dirtyNo) {
      case 1:
        return sources.otherIcons.dirty01;
      case 2:
        return sources.otherIcons.dirty02;
      case 3:
        return sources.otherIcons.dirty03;
      default:
        return sources.otherIcons.dirty01;
    }
  }

  onDirtyClick(dirtyNo: number): void {
    this.cleaningEventService.cleanDirtyObject(dirtyNo);
    this.updateDirtyDisplay();
  }
}