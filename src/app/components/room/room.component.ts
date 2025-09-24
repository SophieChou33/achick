import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { HeaderComponent } from './header/header.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { WindowComponent } from './window/window.component';
import { StatusBarComponent } from './status-bar/status-bar.component';
import { CharacterComponent } from './character/character.component';
import { BedComponent } from './bed/bed.component';
import { ToastrComponent } from '../shared/toastr/toastr.component';
import { DirtyDisplayComponent } from './dirty-display/dirty-display.component';
import { InventoryModalComponent } from './inventory-modal/inventory-modal.component';
import { ShopModalComponent } from './shop-modal/shop-modal.component';
import { CollectionModalComponent } from './collection-modal/collection-modal.component';
import { CookingButtonComponent } from './cooking-button/cooking-button.component';
import { LogPanelComponent } from '../shared/log-panel/log-panel.component';
import { LogService } from '../../services/log.service';
import { sources } from '../../sources';
import { LightService } from '../../services/light.service';
import { PetStatsService } from '../../data/pet-stats-data';
import { PetStats } from '../../types/pet-stats.type';

@Component({
  selector: 'app-room',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    SidebarComponent,
    WindowComponent,
    StatusBarComponent,
    CharacterComponent,
    BedComponent,
    ToastrComponent,
    DirtyDisplayComponent,
    InventoryModalComponent,
    ShopModalComponent,
    CollectionModalComponent,
    CookingButtonComponent,
    LogPanelComponent
  ],
  template: `
    <div class="room-wrapper" #roomWrapper>
      <div class="room-container">
        <img [src]="backgroundImageSrc" alt="Room Background" class="room-background"
             (mousedown)="onDragStart($event)"
             (touchstart)="onDragStart($event)" />
        <app-window></app-window>
        <app-bed></app-bed>
        <app-character></app-character>
        <app-dirty-display></app-dirty-display>
        <app-cooking-button></app-cooking-button>
      </div>
      <app-header (openShopModal)="openShopModal()" (openCollectionModal)="openCollectionModal()"></app-header>
      <app-sidebar (openInventory)="openInventoryModal()"></app-sidebar>
      <app-status-bar *ngIf="!shouldHideUIComponents()"></app-status-bar>
      <app-toastr></app-toastr>
      <app-log-panel *ngIf="!shouldHideUIComponents()"></app-log-panel>

      <!-- 背包彈窗 -->
      <app-inventory-modal
        #inventoryModal
        (close)="onInventoryModalClose()"
        (openShopModal)="openShopModal()"
        (itemUsed)="onItemUsed($event)">
      </app-inventory-modal>

      <!-- 商店彈窗 -->
      <app-shop-modal
        #shopModal
        (close)="onShopModalClose()"
        (purchaseSuccess)="onPurchaseSuccess($event)">
      </app-shop-modal>

      <!-- 圖鑑彈窗 -->
      <app-collection-modal
        #collectionModal
        (close)="onCollectionModalClose()">
      </app-collection-modal>
    </div>
  `,
  styles: [`
    .room-wrapper {
      width: 100%;
      height: 100vh;
      overflow-x: auto;
      overflow-y: hidden;
      scrollbar-width: none; /* Firefox */
      -ms-overflow-style: none; /* Internet Explorer 10+ */
      scroll-behavior: auto; /* 改為 auto，避免拖動時的過渡動畫 */
    }

    .room-background {
      cursor: grab;
      user-select: none;
      touch-action: pan-x;
    }

    .room-background.dragging {
      cursor: grabbing;
    }

    /* 禁用所有圖片的選取功能 */
    img {
      user-select: none;
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      -webkit-user-drag: none;
      -khtml-user-drag: none;
      -moz-user-drag: none;
      -o-user-drag: none;
      user-drag: none;
    }

    /* 確保子組件不會被背景拖拽影響 */
    app-window, app-bed, app-character {
      pointer-events: auto;
      z-index: 600;
    }

    .room-wrapper::-webkit-scrollbar {
      display: none; /* WebKit */
    }

    .room-container {
      position: relative;
      display: inline-block;
      height: 100dvh;
    }

    .room-background {
      top: 0;
      left: 0;
      width: auto;
      height: 100dvh;
      z-index: -1;
      object-fit: contain;
    }

  `]
})
export class RoomComponent implements OnInit, OnDestroy {
  @ViewChild('roomWrapper', { static: true }) roomWrapper!: ElementRef<HTMLDivElement>;
  @ViewChild('inventoryModal') inventoryModal!: InventoryModalComponent;
  @ViewChild('shopModal') shopModal!: ShopModalComponent;
  @ViewChild('collectionModal') collectionModal!: CollectionModalComponent;

  backgroundImageSrc = sources.scene.roomDayLightOn;

  private isDragging = false;
  private startX = 0;
  private scrollLeft = 0;
  private stateSubscription?: Subscription;
  private petStatsSubscription?: Subscription;

  petStats: PetStats = PetStatsService.loadPetStats();

  constructor(
    private lightService: LightService,
    private logService: LogService
  ) {}

  ngOnInit() {
    // Initialize room state
    // 添加全域事件監聽器
    document.addEventListener('mousemove', this.onDragMove.bind(this));
    document.addEventListener('mouseup', this.onDragEnd.bind(this));
    document.addEventListener('touchmove', this.onDragMove.bind(this));
    document.addEventListener('touchend', this.onDragEnd.bind(this));

    // 重置畫面位置到場景正中間
    this.centerRoom();

    // 初始設定場景圖片
    this.updateBackgroundImage();

    // 開始監控狀態變化
    this.startStateMonitoring();

    // 訂閱寵物狀態變化
    this.petStatsSubscription = PetStatsService.getPetStats$().subscribe(petStats => {
      this.petStats = petStats;
    });
  }

  ngOnDestroy() {
    if (this.stateSubscription) {
      this.stateSubscription.unsubscribe();
    }
    if (this.petStatsSubscription) {
      this.petStatsSubscription.unsubscribe();
    }
  }

  private centerRoom() {
    // 立即嘗試居中，然後在圖片載入後再次確認
    const roomWrapper = this.roomWrapper.nativeElement;
    const roomContainer = roomWrapper.querySelector('.room-container') as HTMLElement;
    const backgroundImage = roomWrapper.querySelector('.room-background') as HTMLImageElement;

    if (roomContainer && backgroundImage) {
      // 立即執行一次居中（基於當前尺寸）
      this.performCentering(roomWrapper, roomContainer);

      // 如果圖片還沒載入完成，等待載入後再次居中
      if (!backgroundImage.complete) {
        backgroundImage.onload = () => {
          this.performCentering(roomWrapper, roomContainer);
        };
      }
    }
  }

  private performCentering(roomWrapper: HTMLElement, roomContainer: HTMLElement) {
    const containerWidth = roomContainer.scrollWidth;
    const wrapperWidth = roomWrapper.clientWidth;

    // 計算居中位置：容器寬度減去可視寬度，再除以2
    const centerPosition = Math.max(0, (containerWidth - wrapperWidth) / 2);

    // 直接設置滾動位置到居中（無需切換行為，因為已經是 auto）
    roomWrapper.scrollLeft = centerPosition;
  }

  /**
   * 公開方法：重新將房間畫面置中
   * 可供外部組件調用
   */
  public resetToCenter() {
    this.centerRoom();
  }

  onDragStart(event: MouseEvent | TouchEvent) {
    // 只有在點擊背景圖片時才啟用拖拽
    const target = event.target as HTMLElement;
    if (!target.classList.contains('room-background')) {
      return;
    }

    this.isDragging = true;

    const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
    this.startX = clientX;
    this.scrollLeft = this.roomWrapper.nativeElement.scrollLeft;

    target.classList.add('dragging');

    event.preventDefault();
    event.stopPropagation();
  }

  onDragMove(event: MouseEvent | TouchEvent) {
    if (!this.isDragging) return;

    const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
    const walk = (this.startX - clientX) * 1; // 改為 1:1 移動比例，更直觀
    const newScrollLeft = this.scrollLeft + walk;

    // 確保滾動位置在有效範圍內
    const maxScrollLeft = this.roomWrapper.nativeElement.scrollWidth - this.roomWrapper.nativeElement.clientWidth;
    this.roomWrapper.nativeElement.scrollLeft = Math.max(0, Math.min(newScrollLeft, maxScrollLeft));

    event.preventDefault();
    event.stopPropagation();
  }

  onDragEnd(event: MouseEvent | TouchEvent) {
    if (!this.isDragging) return;
    this.isDragging = false;

    const background = this.roomWrapper.nativeElement.querySelector('.room-background');
    background?.classList.remove('dragging');
  }

  private startStateMonitoring() {
    // 每1秒檢查一次狀態變化
    this.stateSubscription = new Subscription();
    const interval = setInterval(() => {
      this.updateBackgroundImage();
    }, 1000);

    this.stateSubscription.add(() => clearInterval(interval));
  }

  private updateBackgroundImage() {
    const isLightOn = this.lightService.isLightOn;
    const isDay = this.lightService.isDay;

    // 根據光線和日夜狀態決定場景圖片
    if (isLightOn === 1 && isDay === 1) {
      // 若 LightService 的 isLightOn = 1 且 isDay = 1
      this.backgroundImageSrc = sources.scene.roomDayLightOn;
    } else if (isLightOn === 0 && isDay === 1) {
      // 若 LightService 的 isLightOn = 0 且 isDay = 1
      this.backgroundImageSrc = sources.scene.roomDayLightOff;
    } else if (isLightOn === 1 && isDay === 0) {
      // 若 LightService 的 isLightOn = 1 且 isDay = 0
      this.backgroundImageSrc = sources.scene.roomNightLightOn;
    } else if (isLightOn === 0 && isDay === 0) {
      // 若 LightService 的 isLightOn = 0 且 isDay = 0
      this.backgroundImageSrc = sources.scene.roomNightLightOff;
    }
  }

  /**
   * 打開背包彈窗
   */
  openInventoryModal() {
    this.inventoryModal.show('food');
  }

  /**
   * 背包彈窗關閉事件
   */
  onInventoryModalClose() {
    // 彈窗關閉時不做任何事
  }

  /**
   * 打開商店彈窗
   */
  openShopModal() {
    this.shopModal.show();
  }

  /**
   * 商店彈窗關閉事件
   */
  onShopModalClose() {
    // 彈窗關閉時不做任何事
  }

  /**
   * 打開圖鑑彈窗
   */
  openCollectionModal() {
    this.collectionModal.show();
  }

  /**
   * 圖鑑彈窗關閉事件
   */
  onCollectionModalClose() {
    // 彈窗關閉時不做任何事
  }

  /**
   * 購買成功事件
   */
  onPurchaseSuccess(event: { itemName: string; quantity: number; totalCost: number }) {
    // 購買成功後，可能需要更新金幣顯示等
  }

  /**
   * 物品使用事件
   */
  onItemUsed(event: { itemName: string; effects: string[] }) {
    // 物品使用後，可能需要更新角色顯示等
  }

  /**
   * 判斷是否應該隱藏UI組件（狀態欄和日誌）
   */
  shouldHideUIComponents(): boolean {
    return this.petStats.isDead ||
           this.petStats.isFreezing ||
           this.petStats.isLeaving ||
           this.petStats.isCooked;
  }
}
