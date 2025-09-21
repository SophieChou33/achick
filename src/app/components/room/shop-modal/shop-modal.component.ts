import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShopDataService } from '../../../data/shop-data';
import { UserDataService } from '../../../data/user-data';
import { ItemUsageService } from '../../../services/item-usage.service';
import { ShopData, ProductItem } from '../../../types/product-data.type';
import { sources } from '../../../sources';

interface TabItem {
  key: keyof ShopData;
  label: string;
}

interface ShopItemDisplay {
  itemKey: string;
  productItem: ProductItem;
  imagePath: string;
}

@Component({
  selector: 'app-shop-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-backdrop" [class.show]="isVisible" (click)="onBackdropClick($event)">
      <div class="modal-dialog" (click)="$event.stopPropagation()">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">商店</h5>
            <div class="user-coins">
              <img [src]="coinIcon" alt="金幣" class="coin-icon" />
              <span class="coin-amount">{{ currentCoins }}</span>
            </div>
            <button type="button" class="close-btn" (click)="onClose()">
              <span>&times;</span>
            </button>
          </div>

          <!-- 分頁標籤 -->
          <div class="modal-tabs">
            <button
              *ngFor="let tab of tabs"
              class="tab-btn"
              [class.active]="activeTab === tab.key"
              (click)="switchTab(tab.key)">
              {{ tab.label }}
            </button>
          </div>

          <div class="modal-body">
            <!-- 商品網格 -->
            <div class="items-grid">
              <div
                *ngFor="let item of currentTabItems"
                class="item-card"
                (click)="onItemClick(item)">
                <div class="item-image">
                  <img [src]="item.imagePath" [alt]="item.productItem.itemName" />
                </div>
                <div class="item-info">
                  <div class="item-name">{{ item.productItem.itemName }}</div>
                  <div class="item-price">
                    <img [src]="coinIcon" alt="金幣" class="price-coin-icon" />
                    <span>{{ item.productItem.price }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 購買確認彈窗 -->
    <div class="modal-backdrop confirm-modal" [class.show]="showConfirmModal" (click)="onConfirmBackdropClick($event)">
      <div class="modal-dialog small" (click)="$event.stopPropagation()">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">購買商品</h5>
            <button type="button" class="close-btn" (click)="closeConfirmModal()">
              <span>&times;</span>
            </button>
          </div>
          <div class="modal-body" *ngIf="selectedItem">
            <div class="confirm-item">
              <img [src]="selectedItem.imagePath" [alt]="selectedItem.productItem.itemName" />
              <div class="confirm-info">
                <div class="confirm-name">{{ selectedItem.productItem.itemName }}</div>
                <div class="confirm-unit-price">
                  單價：
                  <img [src]="coinIcon" alt="金幣" class="price-coin-icon" />
                  {{ selectedItem.productItem.price }}
                </div>
              </div>
            </div>

            <!-- 數量選擇 -->
            <div class="quantity-section">
              <label class="quantity-label">購買數量：</label>
              <div class="quantity-controls">
                <button class="quantity-btn" (click)="decreaseQuantity()" [disabled]="purchaseQuantity <= 1">-</button>
                <input
                  type="number"
                  class="quantity-input"
                  [(ngModel)]="purchaseQuantity"
                  (input)="onQuantityChange()"
                  min="1"
                  max="99">
                <button class="quantity-btn" (click)="increaseQuantity()" [disabled]="purchaseQuantity >= 99">+</button>
              </div>
            </div>

            <!-- 總計顯示 -->
            <div class="total-section">
              <div class="total-label">總計：</div>
              <div class="total-amount">
                <img [src]="coinIcon" alt="金幣" class="total-coin-icon" />
                <span class="total-price">{{ totalPrice }}</span>
              </div>
            </div>

            <!-- 餘額檢查 -->
            <div class="balance-check" [class.insufficient]="!canAfford">
              <div class="current-balance">
                目前餘額：
                <img [src]="coinIcon" alt="金幣" class="balance-coin-icon" />
                {{ currentCoins }}
              </div>
              <div class="after-purchase" *ngIf="canAfford">
                購買後餘額：
                <img [src]="coinIcon" alt="金幣" class="balance-coin-icon" />
                {{ currentCoins - totalPrice }}
              </div>
              <div class="insufficient-notice" *ngIf="!canAfford">
                <span class="error-text">⚠️ 金幣不足</span>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeConfirmModal()">取消</button>
            <button class="btn btn-primary" (click)="confirmPurchase()" [disabled]="!canAfford">
              確認購買
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
    }

    .modal-backdrop.show {
      opacity: 1;
      visibility: visible;
    }

    .modal-backdrop.confirm-modal {
      z-index: 1100;
    }

    .modal-dialog {
      background: white;
      border-radius: 12px;
      width: 90%;
      max-width: 700px;
      max-height: 85vh;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
      transform: scale(0.9);
      transition: transform 0.3s ease;
    }

    .modal-dialog.small {
      max-width: 450px;
    }

    .modal-backdrop.show .modal-dialog {
      transform: scale(1);
    }

    .modal-content {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .modal-header {
      padding: 20px;
      border-bottom: 1px solid #eee;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-title {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #333;
    }

    .user-coins {
      display: flex;
      align-items: center;
      gap: 6px;
      background: #f8f9fa;
      padding: 8px 12px;
      border-radius: 20px;
      border: 2px solid #e9ecef;
    }

    .coin-icon {
      width: 24px;
      height: 24px;
    }

    .coin-amount {
      font-weight: 600;
      color: #495057;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #999;
      transition: color 0.2s ease;
    }

    .close-btn:hover {
      color: #666;
    }

    .modal-tabs {
      display: flex;
      border-bottom: 1px solid #eee;
      background: #f8f9fa;
    }

    .tab-btn {
      flex: 1;
      padding: 12px 16px;
      background: none;
      border: none;
      cursor: pointer;
      font-size: 14px;
      color: #666;
      transition: all 0.2s ease;
      border-bottom: 3px solid transparent;
    }

    .tab-btn:hover {
      background: #e9ecef;
      color: #333;
    }

    .tab-btn.active {
      color: #28a745;
      border-bottom-color: #28a745;
      background: white;
    }

    .modal-body {
      flex: 1;
      padding: 20px;
      overflow-y: auto;
    }

    .items-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 16px;
    }

    .item-card {
      border: 2px solid #e9ecef;
      border-radius: 8px;
      padding: 16px;
      cursor: pointer;
      transition: all 0.2s ease;
      text-align: center;
      background: white;
    }

    .item-card:hover {
      border-color: #28a745;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(40, 167, 69, 0.2);
    }

    .item-image {
      width: 70px;
      height: 70px;
      margin: 0 auto 12px;
      border-radius: 6px;
      overflow: hidden;
      background: #f8f9fa;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .item-image img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .item-info {
      font-size: 12px;
    }

    .item-name {
      font-weight: 500;
      color: #333;
      margin-bottom: 6px;
      line-height: 1.3;
    }

    .item-price {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      color: #28a745;
      font-weight: 600;
    }

    .price-coin-icon, .balance-coin-icon {
      width: 16px;
      height: 16px;
    }

    .total-coin-icon {
      width: 20px;
      height: 20px;
    }

    .confirm-item {
      display: flex;
      align-items: center;
      margin-bottom: 20px;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .confirm-item img {
      width: 60px;
      height: 60px;
      object-fit: contain;
      margin-right: 16px;
    }

    .confirm-info {
      flex: 1;
    }

    .confirm-name {
      font-weight: 500;
      color: #333;
      margin-bottom: 6px;
      font-size: 16px;
    }

    .confirm-unit-price {
      font-size: 14px;
      color: #666;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .quantity-section {
      margin-bottom: 20px;
    }

    .quantity-label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      color: #333;
    }

    .quantity-controls {
      display: flex;
      align-items: center;
      gap: 8px;
      justify-content: center;
    }

    .quantity-btn {
      width: 40px;
      height: 40px;
      border: 2px solid #dee2e6;
      background: white;
      border-radius: 6px;
      cursor: pointer;
      font-size: 18px;
      font-weight: 600;
      color: #495057;
      transition: all 0.2s ease;
    }

    .quantity-btn:hover:not(:disabled) {
      border-color: #28a745;
      color: #28a745;
    }

    .quantity-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .quantity-input {
      width: 80px;
      height: 40px;
      text-align: center;
      border: 2px solid #dee2e6;
      border-radius: 6px;
      font-size: 16px;
      font-weight: 600;
    }

    .quantity-input:focus {
      outline: none;
      border-color: #28a745;
    }

    .total-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      background: #e8f5e8;
      border-radius: 8px;
      margin-bottom: 16px;
    }

    .total-label {
      font-size: 16px;
      font-weight: 600;
      color: #333;
    }

    .total-amount {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .total-price {
      font-size: 18px;
      font-weight: 700;
      color: #28a745;
    }

    .balance-check {
      padding: 12px;
      border-radius: 8px;
      border: 2px solid #d4edda;
      background: #d4edda;
      margin-bottom: 16px;
    }

    .balance-check.insufficient {
      border-color: #f8d7da;
      background: #f8d7da;
    }

    .current-balance, .after-purchase {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 14px;
      color: #155724;
      margin-bottom: 4px;
    }

    .insufficient .current-balance {
      color: #721c24;
    }

    .insufficient-notice {
      margin-top: 8px;
    }

    .error-text {
      color: #721c24;
      font-weight: 600;
    }

    .modal-footer {
      padding: 16px 20px;
      border-top: 1px solid #eee;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    .btn {
      padding: 10px 20px;
      border-radius: 6px;
      border: none;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s ease;
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
    }

    .btn-secondary:hover {
      background: #5a6268;
    }

    .btn-primary {
      background: #28a745;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #218838;
    }

    .btn-primary:disabled {
      background: #c3c3c3;
      cursor: not-allowed;
    }

    /* 響應式設計 */
    @media (max-width: 768px) {
      .items-grid {
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
        gap: 12px;
      }

      .item-card {
        padding: 12px;
      }

      .item-image {
        width: 60px;
        height: 60px;
      }
    }
  `]
})
export class ShopModalComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  @Output() purchaseSuccess = new EventEmitter<{ itemName: string; quantity: number; totalCost: number }>();

  isVisible = false;
  showConfirmModal = false;
  activeTab: keyof ShopData = 'food';
  currentTabItems: ShopItemDisplay[] = [];
  selectedItem: ShopItemDisplay | null = null;
  purchaseQuantity = 1;
  currentCoins = 0;

  coinIcon = sources.otherIcons.coin;

  shopData: ShopData = ShopDataService.loadShopData();

  tabs: TabItem[] = [
    { key: 'food', label: '食物' },
    { key: 'health', label: '健康' },
    { key: 'gift', label: '禮物' },
    { key: 'decoration', label: '裝飾' }
  ];

  ngOnInit() {
    this.updateCurrentTabItems();
    this.updateCoins();
  }

  show() {
    this.shopData = ShopDataService.loadShopData();
    this.updateCurrentTabItems();
    this.updateCoins();
    this.isVisible = true;
  }

  onClose() {
    this.isVisible = false;
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  switchTab(tab: keyof ShopData) {
    this.activeTab = tab;
    this.updateCurrentTabItems();
  }

  updateCurrentTabItems() {
    const categoryItems = this.shopData[this.activeTab] || [];

    this.currentTabItems = categoryItems.map((productItem, index) => {
      const imagePath = ItemUsageService.getItemImagePath(productItem);

      // 為每個商品生成唯一的鍵值
      const itemKey = `${this.activeTab}_${index}_${productItem.itemName}`;

      return {
        itemKey,
        productItem,
        imagePath
      };
    });
  }

  onItemClick(item: ShopItemDisplay) {
    this.selectedItem = item;
    this.purchaseQuantity = 1;
    this.showConfirmModal = true;
  }

  closeConfirmModal() {
    this.showConfirmModal = false;
    this.selectedItem = null;
    this.purchaseQuantity = 1;
  }

  onConfirmBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.closeConfirmModal();
    }
  }

  increaseQuantity() {
    if (this.purchaseQuantity < 99) {
      this.purchaseQuantity++;
    }
  }

  decreaseQuantity() {
    if (this.purchaseQuantity > 1) {
      this.purchaseQuantity--;
    }
  }

  onQuantityChange() {
    // 確保數量在有效範圍內
    if (this.purchaseQuantity < 1) {
      this.purchaseQuantity = 1;
    } else if (this.purchaseQuantity > 99) {
      this.purchaseQuantity = 99;
    }
  }

  get totalPrice(): number {
    return this.selectedItem ? this.selectedItem.productItem.price * this.purchaseQuantity : 0;
  }

  get canAfford(): boolean {
    return this.currentCoins >= this.totalPrice;
  }

  confirmPurchase() {
    if (!this.selectedItem || !this.canAfford) {
      return;
    }

    // 執行購買邏輯
    const purchaseResult = ShopDataService.purchaseProduct(
      this.selectedItem.productItem,
      this.purchaseQuantity
    );

    if (purchaseResult.success) {
      // 發送購買成功事件
      this.purchaseSuccess.emit({
        itemName: this.selectedItem.productItem.itemName,
        quantity: this.purchaseQuantity,
        totalCost: this.totalPrice
      });

      // 更新金幣顯示
      this.updateCoins();

      // 關閉確認彈窗
      this.closeConfirmModal();

      // 顯示成功訊息
      alert(purchaseResult.message);
    } else {
      // 顯示錯誤訊息
      alert(purchaseResult.message);
    }
  }

  private updateCoins() {
    const userData = UserDataService.loadUserData();
    this.currentCoins = userData.coins;
  }
}