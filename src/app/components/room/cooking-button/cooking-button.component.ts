import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { PetStatsService } from '../../../data/pet-stats-data';
import { UserDataService } from '../../../data/user-data';
import { getBreedByName } from '../../../data/breed-data';
import { LifecycleService } from '../../../services/lifecycle.service';
import { ToastrService } from '../../shared/toastr/toastr.component';
import { CollectionService } from '../../../data/collection-data';
import { PetStats } from '../../../types/pet-stats.type';

@Component({
  selector: 'app-cooking-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="cooking-button-wrapper" *ngIf="shouldShowButton">
      <button
        class="cooking-btn"
        [class.enabled]="canCook"
        [class.disabled]="!canCook"
        [disabled]="!canCook"
        (click)="onCookingClick()"
        [title]="buttonTooltip">
        <span class="cooking-text">可熟成</span>
        <div class="cooking-requirements" *ngIf="!canCook">
          <small>需要好感度及健康度 ≥ 90</small>
        </div>
      </button>
    </div>
  `,
  styles: [`
    .cooking-button-wrapper {
      position: absolute;
      right: 20px;
      top: 50%;
      transform: translateY(-50%);
      z-index: 800;
    }

    .cooking-btn {
      background: linear-gradient(135deg, #ff6b6b, #ff8e8e);
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 12px;
      padding: 12px 20px;
      color: white;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
      backdrop-filter: blur(5px);
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 80px;
    }

    .cooking-btn.enabled {
      background: linear-gradient(135deg, #28a745, #48c662);
      box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
      border-color: rgba(255, 255, 255, 0.4);
    }

    .cooking-btn.enabled:hover {
      background: linear-gradient(135deg, #218838, #3bb555);
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(40, 167, 69, 0.4);
    }

    .cooking-btn.disabled {
      background: linear-gradient(135deg, #6c757d, #8a919a);
      box-shadow: 0 4px 12px rgba(108, 117, 125, 0.3);
      cursor: not-allowed;
      opacity: 0.8;
    }

    .cooking-btn:disabled {
      cursor: not-allowed;
    }

    .cooking-text {
      font-size: 14px;
      margin-bottom: 2px;
    }

    .cooking-requirements {
      font-size: 10px;
      opacity: 0.9;
      text-align: center;
      line-height: 1.2;
      margin-top: 2px;
    }

    /* 響應式設計 */
    @media (max-width: 768px) {
      .cooking-button-wrapper {
        right: 15px;
      }

      .cooking-btn {
        padding: 10px 16px;
        font-size: 12px;
        min-width: 70px;
      }

      .cooking-text {
        font-size: 12px;
      }

      .cooking-requirements {
        font-size: 9px;
      }
    }

    @media (max-width: 576px) {
      .cooking-button-wrapper {
        right: 10px;
        top: 45%;
      }

      .cooking-btn {
        padding: 8px 12px;
        min-width: 60px;
      }
    }
  `]
})
export class CookingButtonComponent implements OnInit, OnDestroy {
  shouldShowButton = false;
  canCook = false;
  buttonTooltip = '';

  private petStats: PetStats = PetStatsService.loadPetStats();
  private petStatsSubscription?: Subscription;

  constructor(private lifecycleService: LifecycleService) {}

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
      this.updateTooltip();
    }
  }

  private shouldShowCookingButton(): boolean {
    // 必須是進化狀態
    if (this.petStats.lifeCycle !== 'EVOLUTION') {
      return false;
    }

    // 必須有品種名稱
    if (!this.petStats.breedName) {
      return false;
    }

    // 檢查是否已經過了240小時
    const userData = UserDataService.loadUserData();
    const currentPetRecord = UserDataService.getCurrentPetRecord(userData);

    if (!currentPetRecord || !currentPetRecord.evolutionTime) {
      return false;
    }

    const evolutionTime = new Date(currentPetRecord.evolutionTime);
    const now = new Date();
    const hoursDiff = (now.getTime() - evolutionTime.getTime()) / (1000 * 60 * 60);

    return hoursDiff >= 240; // 240小時 = 10天
  }

  private canStartCooking(): boolean {
    if (!this.shouldShowButton) {
      return false;
    }

    // 好感度及健康度都 ≥ 90
    return this.petStats.currentFriendship >= 90 && this.petStats.currentWellness >= 90;
  }

  private updateTooltip() {
    if (this.canCook) {
      this.buttonTooltip = '可以進行熟成！';
    } else {
      const friendshipNeed = Math.max(0, 90 - this.petStats.currentFriendship);
      const wellnessNeed = Math.max(0, 90 - this.petStats.currentWellness);

      let tooltip = '熟成條件不足：';
      if (friendshipNeed > 0) {
        tooltip += `好感度還需+${friendshipNeed}`;
      }
      if (wellnessNeed > 0) {
        tooltip += friendshipNeed > 0 ? `，健康度還需+${wellnessNeed}` : `健康度還需+${wellnessNeed}`;
      }

      this.buttonTooltip = tooltip;
    }
  }

  onCookingClick() {
    if (!this.canCook) {
      return;
    }

    // 二次確認
    const petName = this.petStats.name || '電子雞';
    const confirmMessage = `確定要讓 ${petName} 進行熟成嗎？\\n\\n熟成後電子雞將會變成最終形態，但也會結束其生命。`;

    if (!confirm(confirmMessage)) {
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

    // 1. 小雞改變成最終熟成型態 (lifeCycle: cooked)
    const updatedStats = {
      ...this.petStats,
      lifeCycle: 'COOKED' as const,
      timeStopping: true,  // 2. 將 timeStoping 賦值為 true
      isDead: true         // 3. 將 isDead 賦值為 true
    };

    PetStatsService.savePetStats(updatedStats);

    // 給予使用者對應的金幣
    const userData = UserDataService.loadUserData();
    const earnedCoins = breedData.cookedEarned || 0;
    UserDataService.addCoins(earnedCoins, userData);

    // 4. 寫入圖鑑
    const collectionData = CollectionService.loadCollectionData();
    const updatedCollectionData = CollectionService.unlockBreed(this.petStats.breedName!, 'COOKED', collectionData);

    // 5. 跳出 toastr
    ToastrService.show(
      `${petName}，成為了最美味的樣子，看起來很快樂也很可口`,
      'success'
    );

    console.log(`${petName} 已完成熟成，獲得 ${earnedCoins} 金幣`);
  }
}