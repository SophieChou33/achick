import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { sources } from '../../../sources';
import { PetStatsService } from '../../../data/pet-stats-data';
import { PetStats } from '../../../types/pet-stats.type';
import { getBreedByName } from '../../../data/breed-data';
import { RareBreedService } from '../../../services/rare-breed.service';
import { UserDataService } from '../../../data/user-data';
import { BirthOverlayComponent } from '../birth-overlay/birth-overlay.component';
import { NamingModalComponent } from '../naming-modal/naming-modal.component';
import { CoinAnimationComponent } from '../coin-animation/coin-animation.component';
import { UnfreezeModalComponent } from '../unfreeze-modal/unfreeze-modal.component';
import { MoodStatusComponent } from '../mood-status/mood-status.component';
import { TouchEventService } from '../../../services/touch-event.service';
import { LifecycleService } from '../../../services/lifecycle.service';
import { SleepService } from '../../../services/sleep.service';
import { ModalService } from '../../../services/modal.service';
import { WhiteTransitionService } from '../../../services/white-transition.service';
import { StateDataService } from '../../../data/state-data';
import { CollectionService } from '../../../data/collection-data';

@Component({
  selector: 'app-character',
  standalone: true,
  imports: [CommonModule, BirthOverlayComponent, NamingModalComponent, CoinAnimationComponent, UnfreezeModalComponent, MoodStatusComponent],
  template: `
    <!-- 出生按鈕區域 -->
    <div class="character-area-wrapper" *ngIf="showBirthButton">
      <div class="birth-area-centered">
        <div class="birth-button-container">
          <button class="birth-button" (click)="onBirthClick()">
            點擊按鈕出生
          </button>
        </div>
      </div>
    </div>

    <!-- 角色顯示區域 -->
    <div class="character-area-wrapper" *ngIf="isCharacterVisible && !isSleeping">
      <!-- 不移動的定位框 -->
      <div class="character-positioning-frame"
           [style.left]="characterPosition.left"
           [style.top]="characterPosition.top"
           (mousedown)="onDragStart($event)"
           (touchstart)="onDragStart($event)">
        <!-- 可浮動的角色區域 -->
        <div class="character-area">
          <div class="character-shadow"></div>
          <div class="character-container">
            <img [src]="characterImage" [alt]="characterName" class="character-image" />
            <div class="character-effects" *ngIf="hasEffects">
              <img *ngIf="isFreezing" [src]="freezingIcon" alt="Freezing" class="effect-icon" />
            </div>
          </div>
        </div>
        <!-- 心情狀態組件 -->
        <app-mood-status></app-mood-status>
      </div>
    </div>

    <!-- 出生覆蓋層 -->
    <app-birth-overlay #birthOverlay></app-birth-overlay>

    <!-- 命名彈窗 -->
    <app-naming-modal
      #namingModal
      (confirm)="onNameConfirmed($event)"
      (close)="onNamingModalClose()">
    </app-naming-modal>

    <!-- 金幣動畫 -->
    <app-coin-animation #coinAnimation></app-coin-animation>

    <!-- 解凍確認彈窗 -->
    <app-unfreeze-modal
      #unfreezeModal
      (confirm)="onUnfreezeConfirm()"
      (close)="onUnfreezeModalClose()">
    </app-unfreeze-modal>
  `,
  styles: [`
    .character-area-wrapper{
      width: 100%;
      height: 100%;
    }

    .character-positioning-frame {
      position: absolute;
      z-index: 700;
      transition: none;
    }

    .character-positioning-frame.dragging {
      cursor: grabbing;
    }

    .character-area {
      display: flex;
      justify-content: center;
      align-items: center;
      transition: none;
    }

    .character-area:not(.dragging) {
      animation: characterFloat 3s ease-in-out infinite;
    }

    .character-area.dragging {
      animation: none;
    }


    .birth-area-centered {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      z-index: 700;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    @keyframes characterFloat {
      0%, 100% {
        transform: translate(0px, 0px);
      }
      50% {
        transform: translate(0px, -15px);
      }
    }

    .birth-button-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 50dvh;
      width: auto;
    }

    .birth-button {
      background: rgba(255, 255, 255, 0.9);
      border: 2px solid rgba(132, 113, 112, 0.6);
      border-radius: 12px;
      padding: 16px 32px;
      font-size: 18px;
      font-weight: 600;
      color: #847170;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      backdrop-filter: blur(5px);
      text-shadow: none;
    }

    .birth-button:hover {
      background: rgba(255, 255, 255, 1);
      border-color: rgba(132, 113, 112, 0.8);
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
    }

    .birth-button:active {
      transform: translateY(0);
    }

    .character-shadow {
      position: absolute;
      bottom: 0dvh;
      left: 50%;
      transform: translateX(-50%);
      width: 12dvh;
      height: 3dvh;
      background: radial-gradient(ellipse, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.5) 50%, transparent 100%);
      border-radius: 50%;
      z-index: 600;
      filter: blur(0.8dvh);
    }

    .character-area:not(.dragging) .character-shadow {
      animation: shadowFloat 3s ease-in-out infinite;
    }

    @keyframes shadowFloat {
      0%, 100% {
        transform: translateX(-50%) translateY(0) scale(1.0);
        opacity: 0.7;
        filter: blur(0.8dvh);
      }
      50% {
        transform: translateX(-50%) translateY(0.8dvh) scale(0.8);
        opacity: 0.4;
        filter: blur(1.0dvh);
      }
    }

    .character-container {
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .character-image {
      width: auto;
      height: 50dvh;
      object-fit: contain;
      cursor: pointer;
    }

    .character-effects {
      position: absolute;
      top: -10px;
      right: -10px;
    }

    .effect-icon {
      width: 1.5dvh;
      height: 1.5dvh;
    }

  `]
})
export class CharacterComponent implements OnInit, OnDestroy {
  @ViewChild('birthOverlay') birthOverlay!: BirthOverlayComponent;
  @ViewChild('namingModal') namingModal!: NamingModalComponent;
  @ViewChild('coinAnimation') coinAnimation!: CoinAnimationComponent;
  @ViewChild('unfreezeModal') unfreezeModal!: UnfreezeModalComponent;

  characterImage = '';
  characterName = '';
  isFreezing = false;
  freezingIcon = sources.character.others.isFreezing;
  isCharacterVisible = false;
  showBirthButton = false;
  showNamingModal = false;
  isSleeping = false;
  characterPosition = { left: '40%', top: '35dvh' };

  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private startLeft = 0;
  private startTop = 0;
  private hasMoved = false;
  private dragThreshold = 5; // 像素閾值，超過此距離視為拖動
  private petStats: PetStats;
  private petStatsSubscription?: Subscription;

  constructor(
    private rareBreedService: RareBreedService,
    private touchEventService: TouchEventService,
    private lifecycleService: LifecycleService,
    private sleepService: SleepService,
    private modalService: ModalService,
    private whiteTransitionService: WhiteTransitionService
  ) {
    this.petStats = PetStatsService.loadPetStats();
  }

  ngOnInit() {
    // 載入位置資料
    this.loadCharacterPosition();

    // 設定初始圖片和狀態
    this.setCharacterImage();
    this.updateSleepingState();

    // 訂閱角色資料變化
    this.petStatsSubscription = PetStatsService.getPetStats$().subscribe(petStats => {
      const previousStats = this.petStats;
      this.petStats = petStats;

      // 檢查是否狀態變為 DEAD 或 COOKED，如果是則重置角色位置
      if (previousStats && !previousStats.isDead && petStats.isDead) {
        this.resetCharacterPositionToDefault();
      }
      if (previousStats && !previousStats.isCooked && petStats.isCooked) {
        this.resetCharacterPositionToDefault();
      }

      this.setCharacterImage();
      this.updateSleepingState();
    });

    // 每秒檢查睡眠狀態變化
    setInterval(() => {
      this.updateSleepingState();
    }, 1000);

    // 添加全域拖曳事件監聽器
    document.addEventListener('mousemove', this.onDragMove.bind(this), { passive: false });
    document.addEventListener('mouseup', this.onDragEnd.bind(this));
    document.addEventListener('touchmove', this.onDragMove.bind(this), { passive: false });
    document.addEventListener('touchend', this.onDragEnd.bind(this));
  }

  ngOnDestroy() {
    // 清理訂閱
    if (this.petStatsSubscription) {
      this.petStatsSubscription.unsubscribe();
    }

    // 清理撫摸事件服務的計時器
    this.touchEventService.stopResetTimer();

    // 清理拖曳事件監聽器
    document.removeEventListener('mousemove', this.onDragMove.bind(this), { passive: false } as any);
    document.removeEventListener('mouseup', this.onDragEnd.bind(this));
    document.removeEventListener('touchmove', this.onDragMove.bind(this), { passive: false } as any);
    document.removeEventListener('touchend', this.onDragEnd.bind(this));
  }

  get hasEffects(): boolean {
    return this.isFreezing;
  }

  private setCharacterImage() {
    const { lifeCycle, rare, breedName } = this.petStats;

    // 調試信息：檢查稀有度和生命週期
    console.log('setCharacterImage - rare:', rare, 'lifeCycle:', lifeCycle);

    // 任務需求：當 rare 為 null 時，顯示出生按鈕
    if (rare === null) {
      this.isCharacterVisible = false;
      this.showBirthButton = true;
      return;
    }

    // 有 rare 時隱藏出生按鈕
    this.showBirthButton = false;

    // 若lifeCycle為null，隱藏角色區塊
    if (lifeCycle === null) {
      this.isCharacterVisible = false;
      return;
    }

    // 有lifeCycle時才顯示角色，但如果isLeaving為true則隱藏
    this.isCharacterVisible = !this.petStats.isLeaving;

    // 處理死亡狀態 - 最高優先級
    if (this.petStats.isDead) {
      this.characterImage = sources.character.dead.dead;
      this.characterName = 'Dead';
      return;
    }

    // 處理冰凍狀態 - 高優先級，但低於死亡狀態
    if (this.petStats.isFreezing) {
      this.characterImage = sources.character.others.isFreezing;
      this.characterName = 'Frozen';
      return;
    }

    // 根據任務四的邏輯：
    // 若rare有值且lifecycle為EGG，角色圖片顯示sources.character.egg.{{rare}}
    if (rare && lifeCycle === 'EGG') {
      console.log('Setting egg image for rare:', rare);
      this.characterImage = this.getEggImage(rare);
      this.characterName = 'Egg';
      console.log('Egg image set to:', this.characterImage);
      return;
    }

    // 若lifeCycle有值且為CHILD，角色圖片顯示sources.character.child.child
    if (lifeCycle === 'CHILD') {
      this.characterImage = sources.character.child.child;
      this.characterName = 'Child';
      return;
    }

    // 若breed與lifecycle有值且lifeCycle不為EGG也不為CHILD，角色圖片顯示sources.character.{{lifeCycle}}.{{breed}}
    // 對於熟成狀態，使用 EVOLUTION 作為圖片路徑
    if (breedName && ((lifeCycle === 'EVOLUTION') || (this.petStats.isCooked && lifeCycle))) {
      const breedData = getBreedByName(breedName);
      if (breedData) {
        const breed = breedData.breed;

        if (lifeCycle === 'EVOLUTION') {
          this.characterImage = this.getEvolutionImage(breed);
          this.characterName = breedData.breedName || `Evolution - ${breed}`;
        } else if (this.petStats.isCooked) {
          this.characterImage = this.getCookedImage(breed);
          this.characterName = `Cooked - ${breedData.breedName || breed}`;
        }
        return;
      }
    }


    // 預設情況：顯示child圖片
    this.characterImage = sources.character.child.child;
    this.characterName = 'Unknown';
  }

  private getEggImage(rare: PetStats['rare']): string {
    console.log('getEggImage called with rare:', rare);
    switch (rare) {
      case 'BAD':
        console.log('Returning bad egg image');
        return sources.character.egg.bad;
      case 'SPECIAL':
        console.log('Returning special egg image');
        return sources.character.egg.special;
      case 'SUPER_SPECIAL':
        console.log('Returning super special egg image');
        return sources.character.egg.superSpecial;
      case 'NORMAL':
      default:
        console.log('Returning normal egg image (default)');
        return sources.character.egg.normal;
    }
  }

  private getEvolutionImage(breed: string): string {
    const evolutionSources = sources.character.evolution as any;
    return evolutionSources[breed] || evolutionSources.cute;
  }

  private getCookedImage(breed: string): string {
    const cookedSources = sources.character.cooked as any;
    return cookedSources[breed] || cookedSources.cute;
  }

  /**
   * 出生按鈕點擊事件
   */
  async onBirthClick(): Promise<void> {
    try {
      // 先重置 rare breed service，但不立即生成數據
      this.rareBreedService.reset();

      // 僅計算稀有度用於顯示蛋名稱，不保存任何數據
      const randomValue = Math.random() * 100;
      let rare: 'BAD' | 'NORMAL' | 'SPECIAL' | 'SUPER_SPECIAL';
      if (randomValue < 15) {
        rare = 'BAD';
      } else if (randomValue < 85) {
        rare = 'NORMAL';
      } else if (randomValue < 95) {
        rare = 'SPECIAL';
      } else {
        rare = 'SUPER_SPECIAL';
      }

      // 顯示成功出生確認modal
      const eggName = this.getEggName(rare);
      await this.modalService.info(`你獲得了 ${eggName}`, '成功出生');

      // 觸發白光過渡
      this.whiteTransitionService.fadeIn();

      // 0.5秒後切換角色狀態和圖片，然後開始fadeOut
      setTimeout(() => {
        // 在fadeOut開始前切換角色狀態和圖片
        // 使用彈窗顯示的稀有度生成完整的寵物數據，確保一致性
        const tempStats = this.rareBreedService.generateNewPetBreed('', rare);

        // 將稀有度賦值給當前電子雞，但保持名字為 null
        const updatedStats = {
          ...tempStats,
          name: null,
          lifeCycle: 'EGG' as const
        };
        PetStatsService.savePetStats(updatedStats);

        // 記錄蛋到圖鑑
        const currentCollection = CollectionService.loadCollectionData();
        CollectionService.unlockEgg(rare, currentCollection);

        // 添加到使用者飼養歷程
        const userData = UserDataService.loadUserData();
        const newPetRecord = {
          petName: null,
          birthTime: UserDataService.formatDateTime(new Date()),
          evolutionTime: null,
          deathTime: null
        };
        UserDataService.addPetRecord(newPetRecord, userData);

        // 隱藏出生按鈕（圖片會通過訂閱自動更新）
        this.showBirthButton = false;

        // 立即開始fadeOut
        this.whiteTransitionService.fadeOut();
      }, 500);

    } catch (error) {
      console.error('Birth process failed:', error);
    }
  }


  /**
   * 命名確認事件
   */
  async onNameConfirmed(petName: string): Promise<void> {
    try {
      // 顯示成功孵化確認modal
      await this.modalService.info(`啾啾～${petName}出生了！`, '成功孵化');

      // 觸發白光過渡
      this.whiteTransitionService.fadeIn();

      // 0.5秒後切換角色狀態和圖片，然後開始fadeOut
      setTimeout(() => {
        // 在fadeOut開始前切換角色狀態和圖片
        // 使用現有電子雞數據，只更新名字和生命週期
        const currentStats = PetStatsService.loadPetStats();
        const completeStats = {
          ...currentStats,
          name: petName,
          lifeCycle: 'CHILD' as const,
          timeStopping: false  // 從蛋變成幼體時開始計時
        };

        PetStatsService.savePetStats(completeStats);

        // 記錄幼年到圖鑑
        const currentCollection = CollectionService.loadCollectionData();
        CollectionService.unlockChild('normal', currentCollection);

        // 更新使用者飼養歷程的名字
        const userData = UserDataService.loadUserData();
        const lastRecordIndex = userData.petHistory.length - 1;
        if (lastRecordIndex >= 0) {
          UserDataService.updatePetRecord(lastRecordIndex, { petName }, userData);
        }

        // 觸發金幣浮動動畫
        const coins = this.getHatchingCoins(completeStats.rare!);
        this.showCoinAnimation(coins);

        // 立即開始fadeOut
        this.whiteTransitionService.fadeOut();
      }, 500);

    } catch (error) {
      console.error('Hatching process failed:', error);
    }
  }

  /**
   * 命名彈窗關閉事件
   */
  onNamingModalClose(): void {
    // 彈窗關閉時不做任何事
  }

  /**
   * 顯示金幣增加動畫
   */
  private showCoinAnimation(coins: number): void {
    // 在畫面上方中央顯示金幣動畫
    const x = window.innerWidth / 2;
    const y = window.innerHeight * 0.3;
    this.coinAnimation.showCoinAnimation(coins, x, y);
  }

  /**
   * 獲取稀有度對應的孵化獎勵金幣
   */
  private getHatchingCoins(rare: 'BAD' | 'NORMAL' | 'SPECIAL' | 'SUPER_SPECIAL'): number {
    switch (rare) {
      case 'BAD': return 5;
      case 'NORMAL': return 10;
      case 'SPECIAL': return 30;
      case 'SUPER_SPECIAL': return 80;
      default: return 0;
    }
  }

  /**
   * 獲取稀有度對應的蛋名稱
   */
  private getEggName(rare: 'BAD' | 'NORMAL' | 'SPECIAL' | 'SUPER_SPECIAL'): string {
    switch (rare) {
      case 'BAD': return '奇怪的蛋';
      case 'NORMAL': return '平凡的蛋';
      case 'SPECIAL': return '特別的蛋';
      case 'SUPER_SPECIAL': return '發光的蛋';
      default: return '未知的蛋';
    }
  }

  /**
   * 更新睡眠狀態
   */
  private updateSleepingState(): void {
    const currentStateData = StateDataService.loadStateData();
    this.isSleeping = currentStateData.isSleeping.isActive === 1;
  }

  /**
   * 解凍確認事件
   */
  onUnfreezeConfirm(): void {
    // 將『電子雞當前數值』的 isFreezing 和 timeStopping 都賦值為 false
    const updatedStats = {
      ...this.petStats,
      isFreezing: false,
      timeStopping: false
    };

    PetStatsService.savePetStats(updatedStats);

    // 更新角色圖片
    this.petStats = updatedStats;
    this.setCharacterImage();
  }

  /**
   * 解凍彈窗關閉事件
   */
  onUnfreezeModalClose(): void {
    // 彈窗關閉時不做任何事
  }

  /**
   * 載入角色位置
   */
  private loadCharacterPosition(): void {
    const stateData = StateDataService.loadStateData();
    this.characterPosition = stateData.characterPosition;
  }

  /**
   * 重置位置到預設值
   */
  private resetCharacterPositionToDefault(): void {
    // 重置資料中的角色位置
    StateDataService.resetCharacterPositionToDefault();

    // 重新載入位置到組件
    this.loadCharacterPosition();
  }

  /**
   * 拖曳開始事件
   */
  onDragStart(event: MouseEvent | TouchEvent): void {
    this.isDragging = true;
    this.hasMoved = false;

    // 如果是熟成狀態，不允許拖曳操作，但仍要設置 isDragging 以便點擊檢測
    if (this.petStats.isCooked) {
      return;
    }
    const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
    const clientY = event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;

    this.dragStartX = clientX;
    this.dragStartY = clientY;

    // 將百分比轉換為像素進行計算
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    this.startLeft = parseFloat(this.characterPosition.left) * viewportWidth / 100;
    this.startTop = parseFloat(this.characterPosition.top) * viewportHeight / 100;

    event.preventDefault();
    event.stopPropagation();
  }

  /**
   * 拖曳移動事件
   */
  onDragMove(event: MouseEvent | TouchEvent): void {
    if (!this.isDragging) return;

    const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
    const clientY = event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;

    const deltaX = clientX - this.dragStartX;
    const deltaY = clientY - this.dragStartY;

    // 檢查是否超過拖動閾值
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    if (!this.hasMoved && distance > this.dragThreshold) {
      this.hasMoved = true;
      // 添加拖曳樣式和重置動畫
      const positioningFrame = document.querySelector('.character-positioning-frame');
      const characterArea = document.querySelector('.character-area');
      positioningFrame?.classList.add('dragging');
      characterArea?.classList.add('dragging');
    }

    // 只有確認為拖動時才更新位置
    if (this.hasMoved) {
      const newLeft = this.startLeft + deltaX;
      const newTop = this.startTop + deltaY;

      // 限制在螢幕範圍內
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const boundedLeft = Math.max(0, Math.min(newLeft, viewportWidth - 100)); // 預留100px邊距
      const boundedTop = Math.max(0, Math.min(newTop, viewportHeight - 100));

      // 轉換回百分比
      const leftPercent = (boundedLeft / viewportWidth) * 100;
      const topPercent = (boundedTop / viewportHeight) * 100;

      this.characterPosition = {
        left: `${leftPercent}%`,
        top: `${topPercent}%`
      };
    }

    event.preventDefault();
    event.stopPropagation();
  }

  /**
   * 拖曳結束事件
   */
  onDragEnd(_event: MouseEvent | TouchEvent): void {
    if (!this.isDragging) return;

    this.isDragging = false;

    if (this.hasMoved) {
      // 這是拖動操作：移除拖曳樣式並儲存位置
      const positioningFrame = document.querySelector('.character-positioning-frame');
      const characterArea = document.querySelector('.character-area');
      positioningFrame?.classList.remove('dragging');
      characterArea?.classList.remove('dragging');

      // 儲存新位置
      StateDataService.updateCharacterPosition(this.characterPosition);
    } else {
      // 這是點擊操作：觸發撫摸事件
      this.handleCharacterClick();
    }

    // 重置狀態
    this.hasMoved = false;
  }

  /**
   * 處理角色點擊事件（撫摸、命名、喚醒和解凍）
   */
  private handleCharacterClick(): void {
    // 處理死亡或熟成狀態的點擊
    if (this.petStats.isDead || this.petStats.isCooked) {
      this.lifecycleService.showDeathConfirmDialog();
      return;
    }

    // 處理冷凍狀態的點擊
    if (this.petStats.isFreezing) {
      this.unfreezeModal.show();
      return;
    }

    // 嘗試喚醒（如果在睡眠中，此函數會處理喚醒邏輯）
    this.sleepService.wakeUp();

    // 只有在蛋狀態且沒有名字時才能命名
    if (this.petStats.lifeCycle === 'EGG' && this.petStats.name === null) {
      this.namingModal.show();
      return;
    }

    // 其他狀態下觸發撫摸事件
    this.touchEventService.touchingEvent();
  }
}
