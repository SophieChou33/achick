import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { PetStatsService } from '../../../data/pet-stats-data';
import { UserDataService } from '../../../data/user-data';
import { getBreedByName } from '../../../data/breed-data';
import { LifecycleService } from '../../../services/lifecycle.service';
import { ToastrService } from '../../shared/toastr/toastr.component';
import { ModalService } from '../../../services/modal.service';
import { CollectionService } from '../../../data/collection-data';
import { CustomTimeService } from '../../../services/custom-time.service';
import { PetStats } from '../../../types/pet-stats.type';
import { sources } from '../../../sources';

@Component({
  selector: 'app-cooking-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="cooking-icon-wrapper" *ngIf="shouldShowButton">
      <div
        class="cooking-icon"
        [class.enabled]="canCook"
        [class.disabled]="!canCook"
        (click)="onCookingClick()">
        <img [src]="cookedIcon" alt="可熟成" class="cooked-image" />
      </div>

      <!-- Hover 提示框 -->
      <div class="tooltip">
        <div class="tooltip-content">
          <h4>熟成條件</h4>
          <ul>
            <li>好感度 ≥ 90 (當前: {{ petStats.currentFriendship }})</li>
            <li>健康度 ≥ 90 (當前: {{ petStats.currentWellness }})</li>
            <li>進化後經過 240 小時 ({{ getTimeProgress() }})</li>
          </ul>
          <div class="tooltip-status" [class.ready]="canCook" [class.not-ready]="!canCook">
            {{ canCook ? '可以熟成！' : '條件未滿足' }}
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .cooking-icon-wrapper {
      position: fixed;
      left: 20px;
      top: 120px;
      z-index: 800;
    }

    .cooking-icon {
      display: inline-block;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .cooking-icon:hover {
      transform: translateY(-2px);
    }

    .cooking-icon.disabled {
      cursor: not-allowed;
      opacity: 0.7;
    }

    .cooked-image {
      height: 10dvh;
      width: auto;
      object-fit: contain;
    }

    /* Tooltip 樣式 */
    .tooltip {
      position: absolute;
      left: calc(10dvh + 10px);
      top: 0;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 12px;
      border-radius: 8px;
      font-size: 12px;
      white-space: normal;
      opacity: 0;
      visibility: hidden;
      transform: translateX(-10px);
      transition: all 0.3s ease;
      z-index: 1000;
      min-width: 280px;
    }

    .cooking-icon:hover + .tooltip,
    .tooltip:hover {
      opacity: 1;
      visibility: visible;
      transform: translateX(0);
    }

    .tooltip-content h4 {
      margin: 0 0 8px 0;
      font-size: 14px;
      color: #ffd700;
      border-bottom: 1px solid rgba(255, 255, 255, 0.3);
      padding-bottom: 4px;
    }

    .tooltip-content ul {
      margin: 8px 0;
      padding: 0 0 0 16px;
      list-style: none;
    }

    .tooltip-content li {
      margin: 4px 0;
      position: relative;
      padding-left: 8px;
    }

    .tooltip-content li:before {
      content: "•";
      position: absolute;
      left: 0;
      color: #ffd700;
    }

    .tooltip-status {
      margin-top: 8px;
      padding: 4px 8px;
      border-radius: 4px;
      text-align: center;
      font-weight: bold;
    }

    .tooltip-status.ready {
      color: #90ee90;
    }

    .tooltip-status.not-ready {
      background: rgba(220, 53, 69, 0.3);
      color: #ffb6c1;
    }

    /* 響應式設計 */
    @media (max-width: 768px) {
      .cooking-icon-wrapper {
        left: 15px;
        top: 100px;
      }

      .tooltip {
        left: calc(10dvh + 10px);
        min-width: 250px;
        font-size: 11px;
      }
    }

    @media (max-width: 576px) {
      .cooking-icon-wrapper {
        left: 10px;
        top: 90px;
      }

      .tooltip {
        left: calc(10dvh + 10px);
        min-width: 220px;
        font-size: 10px;
      }
    }
  `]
})
export class CookingButtonComponent implements OnInit, OnDestroy {
  shouldShowButton = false;
  canCook = false;
  cookedIcon = sources.otherIcons.cooked;

  petStats: PetStats = PetStatsService.loadPetStats();
  private petStatsSubscription?: Subscription;

  constructor(
    private lifecycleService: LifecycleService,
    private modalService: ModalService,
    private customTimeService: CustomTimeService
  ) {}

  ngOnInit() {
    this.updateButtonState();

    // 訂閱角色資料變化
    this.petStatsSubscription = PetStatsService.getPetStats$().subscribe(petStats => {
      this.petStats = petStats;
      this.updateButtonState();
    });
  }

  ngOnDestroy() {
    if (this.petStatsSubscription) {
      this.petStatsSubscription.unsubscribe();
    }
  }

  private updateButtonState() {
    // 檢查是否應該顯示按鈕
    this.shouldShowButton = this.shouldShowCookingButton();

    if (this.shouldShowButton) {
      // 檢查是否可以熟成
      this.canCook = this.canStartCooking();
    }
  }

  private shouldShowCookingButton(): boolean {
    console.log('熟成按鈕顯示檢查開始:', {
      lifeCycle: this.petStats.lifeCycle,
      breedName: this.petStats.breedName,
      isDead: this.petStats.isDead,
      isCooked: this.petStats.isCooked
    });

    // 如果已經熟成或死亡，隱藏按鈕
    if (this.petStats.isCooked || this.petStats.isDead) {
      console.log('熟成按鈕檢查失敗: 已經是熟成狀態或死亡狀態');
      return false;
    }

    // 必須是進化狀態
    if (this.petStats.lifeCycle !== 'EVOLUTION') {
      console.log('熟成按鈕檢查失敗: lifeCycle不是EVOLUTION');
      return false;
    }

    // 必須有品種名稱
    if (!this.petStats.breedName) {
      console.log('熟成按鈕檢查失敗: 沒有品種名稱');
      return false;
    }

    // 檢查是否已經過了240小時
    const userData = UserDataService.loadUserData();
    const currentPetRecord = UserDataService.getCurrentPetRecord(userData);

    console.log('用戶數據檢查:', {
      currentPetRecord: currentPetRecord,
      evolutionTime: currentPetRecord?.evolutionTime
    });

    if (!currentPetRecord || !currentPetRecord.evolutionTime) {
      console.log('熟成按鈕檢查失敗: 沒有寵物記錄或進化時間');
      return false;
    }

    // 使用自定義時間服務來獲取當前時間，確保時間一致性
    const evolutionTime = new Date(currentPetRecord.evolutionTime);
    const now = this.customTimeService.getCurrentTime();
    const hoursDiff = (now.getTime() - evolutionTime.getTime()) / (1000 * 60 * 60);

    console.log('時間檢查:', {
      evolutionTime: currentPetRecord.evolutionTime,
      now: now.toISOString(),
      currentTimeString: this.customTimeService.formatTime(),
      isCustomTimeEnabled: this.customTimeService.isCustomTimeEnabled(),
      hoursDiff: hoursDiff,
      required: 240, // 240小時 = 10天
      canShow: hoursDiff >= 240
    });

    // 需要240小時（10天）才能熟成
    return hoursDiff >= 240;
  }

  private canStartCooking(): boolean {
    if (!this.shouldShowButton) {
      return false;
    }

    // 好感度及健康度都 ≥ 90
    return this.petStats.currentFriendship >= 90 && this.petStats.currentWellness >= 90;
  }


  getTimeProgress(): string {
    const userData = UserDataService.loadUserData();
    const currentPetRecord = UserDataService.getCurrentPetRecord(userData);

    if (!currentPetRecord || !currentPetRecord.evolutionTime) {
      return '無進化記錄';
    }

    const evolutionTime = new Date(currentPetRecord.evolutionTime);
    const now = this.customTimeService.getCurrentTime();
    const hoursPassed = (now.getTime() - evolutionTime.getTime()) / (1000 * 60 * 60);
    const hoursNeeded = 240;

    if (hoursPassed >= hoursNeeded) {
      return '已滿足時間條件';
    } else {
      const remaining = Math.ceil(hoursNeeded - hoursPassed);
      return `還需 ${remaining} 小時`;
    }
  }

  async onCookingClick() {
    if (!this.canCook) {
      return;
    }

    // 二次確認
    const petName = this.petStats.name || '電子雞';
    const confirmMessage = `確定要讓 ${petName} 進行熟成嗎？\n\n熟成後電子雞將會變成最終形態，但也會結束其生命。`;

    const confirmed = await this.modalService.confirm(confirmMessage, '熟成確認');
    if (!confirmed) {
      return;
    }

    this.performCooking();
  }

  private performCooking() {
    const petName = this.petStats.name || '電子雞';
    const breedData = getBreedByName(this.petStats.breedName!);

    if (!breedData) {
      console.error('無法找到品種資料');
      return;
    }

    // 1. 小雞改變成最終熟成型態
    const updatedStats = {
      ...this.petStats,
      isCooked: true,      // 設為熟成狀態
      isDead: true,        // 熟成狀態也算是死亡狀態
      timeStopping: true,  // 2. 將 timeStoping 賦值為 true
    };

    PetStatsService.savePetStats(updatedStats);

    // 給予使用者對應的金幣
    const userData = UserDataService.loadUserData();
    const earnedCoins = breedData.cookedEarned || 0;
    UserDataService.addCoins(earnedCoins, userData);

    // 4. 寫入圖鑑
    const collectionData = CollectionService.loadCollectionData();
    CollectionService.unlockBreed(this.petStats.breedName!, 'COOKED', collectionData);

    // 5. 跳出 toastr
    ToastrService.show(
      `${petName}，成為了最美味的樣子，看起來很快樂也很可口`,
      'success'
    );

    console.log(`${petName} 已完成熟成，獲得 ${earnedCoins} 金幣`);
  }
}