import { Component, OnInit, OnDestroy, ViewChild, Injector } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { WelcomeComponent } from './components/welcome/welcome.component';
import { RoomComponent } from './components/room/room.component';
import { WhiteTransitionComponent } from './components/white-transition/white-transition.component';
import { WhiteTransitionService } from './services/white-transition.service';
import { HungerManagerService } from './services/hunger-manager.service';
import { AppStateService } from './services/app-state.service';
import { ItemUsageService } from './services/item-usage.service';
import { LeavingService } from './services/leaving.service';
import { LowLikabilityEventService } from './services/low-likability-event.service';

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
    private hungerManagerService: HungerManagerService,
    private appStateService: AppStateService,
    private injector: Injector,
    private leavingService: LeavingService,
    private lowLikabilityEventService: LowLikabilityEventService
  ) {
    // 設置 ItemUsageService 的依賴注入器
    ItemUsageService.setInjector(this.injector);

    // 注入離家出走相關服務以確保它們的定時器啟動
    // 這些服務在構造函數中會自動啟動定時器
    console.log('離家出走服務已初始化');
  }

  ngOnInit() {
    // 註冊場景準備回調函數
    this.whiteTransitionService.onWhiteReady(() => {
      this.prepareScene();
    });

    // 監聽應用狀態變化
    this.appStateService.showWelcome$.subscribe(show => {
      this.showWelcome = show;
    });

    this.appStateService.showRoom$.subscribe(show => {
      this.showRoom = show;
    });
  }

  ngOnDestroy() {
    // 停止飢餓系統
    this.hungerManagerService.stopHungerSystem();
  }

  private prepareScene() {
    // 在白光遮蔽畫面時準備房間場景
    this.appStateService.showRoomPage();

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
