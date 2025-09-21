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
import { TouchEventService } from '../../../services/touch-event.service';

@Component({
  selector: 'app-character',
  standalone: true,
  imports: [CommonModule, BirthOverlayComponent, NamingModalComponent, CoinAnimationComponent],
  template: `
    <!-- 出生按鈕區域 -->
    <div class="character-area-wrapper" *ngIf="showBirthButton">
      <div class="character-area">
        <div class="birth-button-container">
          <button class="birth-button" (click)="onBirthClick()">
            點擊按鈕出生
          </button>
        </div>
      </div>
    </div>

    <!-- 角色顯示區域 -->
    <div class="character-area-wrapper" *ngIf="isCharacterVisible" (click)="onCharacterClick()">
      <div class="character-area">
        <div class="character-shadow"></div>
        <div class="character-container">
          <img [src]="characterImage" [alt]="characterName" class="character-image" />
          <div class="character-effects" *ngIf="hasEffects">
            <img *ngIf="isFreezing" [src]="freezingIcon" alt="Freezing" class="effect-icon" />
          </div>
        </div>
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
  `,
  styles: [`
    .character-area-wrapper{
      width: 100%;
      height: 100%;
    }
    .character-area {
      position: absolute;
      left: 40%;
      top: 35dvh;
      z-index: 700;
      display: flex;
      justify-content: center;
      align-items: center;
      animation: characterFloat 3s ease-in-out infinite;
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
      animation: shadowFloat 3s ease-in-out infinite;
      z-index: 600;
      filter: blur(0.8dvh);
    }

    @keyframes shadowFloat {
      0%, 100% {
        transform: translateX(-50%) translateY(0) scale(1.3);
        opacity: 0.9;
        filter: blur(0.5dvh);
      }
      50% {
        transform: translateX(-50%) translateY(1.5dvh) scale(0.7);
        opacity: 0.3;
        filter: blur(1.2dvh);
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

  characterImage = '';
  characterName = '';
  isFreezing = false;
  freezingIcon = sources.character.others.isFreezing;
  isCharacterVisible = false;
  showBirthButton = false;
  showNamingModal = false;

  private petStats: PetStats;
  private petStatsSubscription?: Subscription;

  constructor(
    private rareBreedService: RareBreedService,
    private touchEventService: TouchEventService
  ) {
    this.petStats = PetStatsService.loadPetStats();
  }

  ngOnInit() {
    // 設定初始圖片
    this.setCharacterImage();

    // 訂閱角色資料變化
    this.petStatsSubscription = PetStatsService.getPetStats$().subscribe(petStats => {
      this.petStats = petStats;
      this.setCharacterImage();
    });
  }

  ngOnDestroy() {
    // 清理訂閱
    if (this.petStatsSubscription) {
      this.petStatsSubscription.unsubscribe();
    }

    // 清理撫摸事件服務的計時器
    this.touchEventService.stopResetTimer();
  }

  get hasEffects(): boolean {
    return this.isFreezing;
  }

  private setCharacterImage() {
    const { lifeCycle, rare, breedName } = this.petStats;

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

    // 有lifeCycle時才顯示角色
    this.isCharacterVisible = true;

    // 根據任務四的邏輯：
    // 若rare有值且lifecycle為EGG，角色圖片顯示sources.character.egg.{{rare}}
    if (rare && lifeCycle === 'EGG') {
      this.characterImage = this.getEggImage(rare);
      this.characterName = 'Egg';
      return;
    }

    // 若lifeCycle有值且為CHILD，角色圖片顯示sources.character.child.child
    if (lifeCycle === 'CHILD') {
      this.characterImage = sources.character.child.child;
      this.characterName = 'Child';
      return;
    }

    // 若breed與lifecycle有值且lifeCycle不為EGG也不為CHILD，角色圖片顯示sources.character.{{lifeCycle}}.{{breed}}
    if (breedName && lifeCycle && (lifeCycle === 'EVOLUTION' || lifeCycle === 'COOKED')) {
      const breedData = getBreedByName(breedName);
      if (breedData) {
        const breed = breedData.breed;

        if (lifeCycle === 'EVOLUTION') {
          this.characterImage = this.getEvolutionImage(breed);
          this.characterName = breedData.breedName || `Evolution - ${breed}`;
        } else if (lifeCycle === 'COOKED') {
          this.characterImage = this.getCookedImage(breed);
          this.characterName = `Cooked - ${breedData.breedName || breed}`;
        }
        return;
      }
    }

    // 處理死亡狀態 - 使用 isDead 屬性判斷
    if (this.petStats.isDead) {
      this.characterImage = sources.character.dead.dead;
      this.characterName = 'Dead';
      return;
    }

    // 預設情況：顯示child圖片
    this.characterImage = sources.character.child.child;
    this.characterName = 'Unknown';
  }

  private getEggImage(rare: PetStats['rare']): string {
    switch (rare) {
      case 'BAD':
        return sources.character.egg.bad;
      case 'SPECIAL':
        return sources.character.egg.special;
      case 'SUPER_SPECIAL':
        return sources.character.egg.superSpecial;
      case 'NORMAL':
      default:
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
      // 顯示出生覆蓋層
      await this.birthOverlay.showBirthOverlay('出生中…', 5000);

      // 在覆蓋層遮蔽時執行稀有度 service 的函數
      // 先生成稀有度但不完成整個流程（不設定名字）
      this.rareBreedService.reset();
      const tempStats = this.rareBreedService.generateNewPetBreed('');

      // 將稀有度賦值給當前電子雞，但保持名字為 null
      const updatedStats = {
        ...tempStats,
        name: null,
        lifeCycle: 'EGG' as const
      };
      PetStatsService.savePetStats(updatedStats);

      // 添加到使用者飼養歷程
      const userData = UserDataService.loadUserData();
      const newPetRecord = {
        petName: null,
        birthTime: UserDataService.formatDateTime(new Date()),
        evolutionTime: null,
        deathTime: null
      };
      UserDataService.addPetRecord(newPetRecord, userData);

      // 隱藏出生按鈕，顯示角色圖片
      this.showBirthButton = false;
      this.setCharacterImage();

    } catch (error) {
      console.error('Birth process failed:', error);
    }
  }

  /**
   * 角色點擊事件（用於命名和撫摸）
   */
  onCharacterClick(): void {
    // 只有在蛋狀態且沒有名字時才能命名
    if (this.petStats.lifeCycle === 'EGG' && this.petStats.name === null) {
      this.namingModal.show();
      return;
    }

    // 其他狀態下觸發撫摸事件
    this.touchEventService.touchingEvent();
  }

  /**
   * 命名確認事件
   */
  async onNameConfirmed(petName: string): Promise<void> {
    try {
      // 顯示孵化覆蓋層
      await this.birthOverlay.showBirthOverlay('孵化中…', 5000);

      // 更新電子雞名字和生命週期
      const currentStats = PetStatsService.loadPetStats();
      const updatedStats = {
        ...currentStats,
        name: petName,
        lifeCycle: 'CHILD' as const
      };

      // 執行出生時數值賦值
      const finalStats = this.rareBreedService.generateNewPetBreed(petName);
      const completeStats = {
        ...finalStats,
        lifeCycle: 'CHILD' as const
      };

      PetStatsService.savePetStats(completeStats);

      // 更新使用者飼養歷程的名字
      const userData = UserDataService.loadUserData();
      const lastRecordIndex = userData.petHistory.length - 1;
      if (lastRecordIndex >= 0) {
        UserDataService.updatePetRecord(lastRecordIndex, { petName }, userData);
      }

      // 觸發金幣浮動動畫
      const coins = this.getHatchingCoins(finalStats.rare!);
      this.showCoinAnimation(coins);

      // 更新角色圖片
      this.setCharacterImage();

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
}
