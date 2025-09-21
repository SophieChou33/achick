import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { WelcomeComponent } from './components/welcome/welcome.component';
import { RoomComponent } from './components/room/room.component';
import { WhiteTransitionComponent } from './components/white-transition/white-transition.component';
import { WhiteTransitionService } from './services/white-transition.service';
import { HungerManagerService } from './services/hunger-manager.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, WelcomeComponent, RoomComponent, WhiteTransitionComponent],
  template: `
    <div class="app-container">
      <app-welcome *ngIf="showWelcome"></app-welcome>
      <app-room #roomComponent *ngIf="showRoom"></app-room>
      <app-white-transition></app-white-transition>
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
export class AppComponent implements OnInit, OnDestroy {
  @ViewChild('roomComponent') roomComponent!: RoomComponent;

  title = 'achick';
  showWelcome = true;
  showRoom = false;

  constructor(
    private whiteTransitionService: WhiteTransitionService,
    private hungerManagerService: HungerManagerService
  ) {}

  ngOnInit() {
    // 註冊場景準備回調函數
    this.whiteTransitionService.onWhiteReady(() => {
      this.prepareScene();
    });
  }

  ngOnDestroy() {
    // 停止飢餓系統
    this.hungerManagerService.stopHungerSystem();
  }

  private prepareScene() {
    // 在白光遮蔽畫面時準備房間場景
    this.showWelcome = false;
    this.showRoom = true;

    // 等待房間組件渲染並執行居中
    setTimeout(() => {
      if (this.roomComponent) {
        this.roomComponent.resetToCenter();

        // 場景完全準備好後，通知Service可以fadeOut
        setTimeout(() => {
          this.whiteTransitionService.onSceneReady();
        }, 100);
      }
    }, 50);
  }

}
