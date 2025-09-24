import { Component, OnInit, OnDestroy, ViewChild, Injector } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WelcomeComponent } from './components/welcome/welcome.component';
import { RoomComponent } from './components/room/room.component';
import { WhiteTransitionComponent } from './components/white-transition/white-transition.component';
import { WhiteTransitionService } from './services/white-transition.service';
import { HungerManagerService } from './services/hunger-manager.service';
import { AppStateService } from './services/app-state.service';
import { ItemUsageService } from './services/item-usage.service';
import { UnifiedStatsCheckerService } from './services/unified-stats-checker.service';
import { PetStatsService } from './data/pet-stats-data';
import { RealTimeStateMonitorService } from './services/real-time-state-monitor.service';
import { LogService } from './services/log.service';
import { ToastrService } from './components/shared/toastr/toastr.component';
import { ModalService } from './services/modal.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, WelcomeComponent, RoomComponent, WhiteTransitionComponent],
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
    private unifiedStatsCheckerService: UnifiedStatsCheckerService,
    private realTimeStateMonitorService: RealTimeStateMonitorService,
    private logService: LogService
  ) {
    // 設置 ItemUsageService 的依賴注入器
    ItemUsageService.setInjector(this.injector);

    // 設置日誌服務給 ToastrService 和 ModalService
    ToastrService.setLogService(this.logService);
    ModalService.setLogService(this.logService);

    // 注入離家出走相關服務以確保它們的定時器啟動
    // 這些服務在構造函數中會自動啟動定時器

    // 啟動統一的數值檢查系統
    this.unifiedStatsCheckerService.startUnifiedCheck();

    // 即時狀態監控服務會自動在構造函數中啟動監控
    // 無需手動啟動，但我們可以確保它已經初始化
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

    // 停止統一檢查系統
    this.unifiedStatsCheckerService.stopUnifiedCheck();

    // 停止即時狀態監控
    this.realTimeStateMonitorService.stopMonitoring();
  }

  private prepareScene() {
    // 在白光遮蔽畫面時準備房間場景
    this.appStateService.showRoomPage();

    // 等待房間組件渲染並執行居中
    setTimeout(() => {
      if (this.roomComponent) {
        this.roomComponent.resetToCenter();

        // 在場景載入時執行一次完整的數值檢查（如果 rare 有值）
        const currentPetStats = PetStatsService.loadPetStats();
        if (currentPetStats.rare !== null) {
          this.unifiedStatsCheckerService.executeAllChecks();
        }

        // 場景完全準備好後，通知Service可以fadeOut
        setTimeout(() => {
          this.whiteTransitionService.onSceneReady();
        }, 100);
      }
    }, 50);
  }

}
