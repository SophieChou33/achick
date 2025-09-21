import { Component, EventEmitter, Output, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserInventoryService } from '../../../data/user-inventory-data';
import { ShopDataService } from '../../../data/shop-data';
import { ItemUsageService } from '../../../services/item-usage.service';
import { UserInventory, InventoryCategory } from '../../../types/user-inventory.type';
import { ProductItem } from '../../../types/product-data.type';
import { sources } from '../../../sources';

interface TabItem {
  key: InventoryCategory;
  label: string;
  icon?: string;
}

interface InventoryItemDisplay {
  itemName: string;
  quantity: number;
  imagePath: string;
  productItem: ProductItem;
}

@Component({
  selector: 'app-inventory-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-backdrop" [class.show]="isVisible" (click)="onBackdropClick($event)">
      <div class="modal-dialog" (click)="$event.stopPropagation()">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">背包</h5>
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
            <!-- 物品網格 -->
            <div class="items-grid" *ngIf="currentTabItems.length > 0">
              <div
                *ngFor="let item of currentTabItems"
                class="item-card"
                (click)="onItemClick(item)">
                <div class="item-image">
                  <img [src]="item.imagePath" [alt]="item.itemName" />
                </div>
                <div class="item-info">
                  <div class="item-name">{{ item.itemName }}</div>
                  <div class="item-quantity">x{{ item.quantity }}</div>
                </div>
              </div>
            </div>

            <!-- 空狀態顯示 -->
            <div class="empty-state" *ngIf="currentTabItems.length === 0">
              <div class="empty-message">
                <span *ngIf="activeTab === 'food'">背包中沒有食物</span>
                <span *ngIf="activeTab !== 'food'">背包中沒有{{ getTabLabel(activeTab) }}</span>
              </div>
              <button
                *ngIf="activeTab === 'food'"
                class="buy-btn"
                (click)="openShop()">
                前往購買
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 確認使用彈窗 -->
    <div class="modal-backdrop confirm-modal" [class.show]="showConfirmModal" (click)="onConfirmBackdropClick($event)">
      <div class="modal-dialog small" (click)="$event.stopPropagation()">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">使用物品</h5>
            <button type="button" class="close-btn" (click)="closeConfirmModal()">
              <span>&times;</span>
            </button>
          </div>
          <div class="modal-body" *ngIf="selectedItem">
            <div class="confirm-item">
              <img [src]="selectedItem.imagePath" [alt]="selectedItem.itemName" />
              <div class="confirm-info">
                <div class="confirm-name">{{ selectedItem.itemName }}</div>
                <div class="confirm-quantity">擁有數量：{{ selectedItem.quantity }}</div>
              </div>
            </div>
            <div class="confirm-effects" *ngIf="itemPreview.length > 0">
              <h6>使用效果：</h6>
              <ul>
                <li *ngFor="let effect of itemPreview">{{ effect }}</li>
              </ul>
            </div>
            <div class="confirm-message">
              確定要使用 {{ selectedItem.itemName }} 嗎？
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeConfirmModal()">取消</button>
            <button class="btn btn-primary" (click)="confirmUseItem()">確認使用</button>
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
      max-width: 600px;
      max-height: 80vh;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
      transform: scale(0.9);
      transition: transform 0.3s ease;
    }

    .modal-dialog.small {
      max-width: 400px;
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
      color: #007bff;
      border-bottom-color: #007bff;
      background: white;
    }

    .modal-body {
      flex: 1;
      padding: 20px;
      overflow-y: auto;
    }

    .items-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 16px;
    }

    .item-card {
      border: 2px solid #e9ecef;
      border-radius: 8px;
      padding: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      text-align: center;
    }

    .item-card:hover {
      border-color: #007bff;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 123, 255, 0.2);
    }

    .item-image {
      width: 60px;
      height: 60px;
      margin: 0 auto 8px;
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
      margin-bottom: 4px;
    }

    .item-quantity {
      color: #666;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #666;
    }

    .empty-message {
      font-size: 16px;
      margin-bottom: 20px;
    }

    .buy-btn {
      background: #28a745;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      transition: background 0.2s ease;
    }

    .buy-btn:hover {
      background: #218838;
    }

    .confirm-item {
      display: flex;
      align-items: center;
      margin-bottom: 16px;
      padding: 12px;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .confirm-item img {
      width: 48px;
      height: 48px;
      object-fit: contain;
      margin-right: 12px;
    }

    .confirm-info {
      flex: 1;
    }

    .confirm-name {
      font-weight: 500;
      color: #333;
      margin-bottom: 4px;
    }

    .confirm-quantity {
      font-size: 12px;
      color: #666;
    }

    .confirm-effects {
      margin-bottom: 16px;
    }

    .confirm-effects h6 {
      margin: 0 0 8px 0;
      font-size: 14px;
      color: #333;
    }

    .confirm-effects ul {
      margin: 0;
      padding-left: 20px;
      font-size: 12px;
      color: #666;
    }

    .confirm-message {
      text-align: center;
      font-size: 14px;
      color: #333;
      margin-bottom: 16px;
    }

    .modal-footer {
      padding: 16px 20px;
      border-top: 1px solid #eee;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    .btn {
      padding: 8px 16px;
      border-radius: 6px;
      border: none;
      cursor: pointer;
      font-size: 14px;
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
      background: #007bff;
      color: white;
    }

    .btn-primary:hover {
      background: #0056b3;
    }
  `]
})
export class InventoryModalComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  @Output() openShopModal = new EventEmitter<void>();
  @Output() itemUsed = new EventEmitter<{ itemName: string; effects: string[] }>();

  isVisible = false;
  showConfirmModal = false;
  activeTab: InventoryCategory = 'food';
  currentTabItems: InventoryItemDisplay[] = [];
  selectedItem: InventoryItemDisplay | null = null;
  itemPreview: string[] = [];

  inventory: UserInventory = UserInventoryService.loadUserInventory();

  tabs: TabItem[] = [
    { key: 'food', label: '食物' },
    { key: 'health', label: '健康' },
    { key: 'gift', label: '禮物' },
    { key: 'decoration', label: '裝飾' }
  ];

  ngOnInit() {
    this.updateCurrentTabItems();
  }

  show(defaultTab: InventoryCategory = 'food') {
    this.activeTab = defaultTab;
    this.inventory = UserInventoryService.loadUserInventory();
    this.updateCurrentTabItems();
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

  switchTab(tab: InventoryCategory) {
    this.activeTab = tab;
    this.updateCurrentTabItems();
  }

  updateCurrentTabItems() {
    const categoryItems = UserInventoryService.getItemsByCategory(this.activeTab, this.inventory);
    const shopData = ShopDataService.loadShopData();

    this.currentTabItems = categoryItems.map(item => {
      const productItem = ShopDataService.getProductByName(item.itemName, shopData);
      const imagePath = productItem ? ItemUsageService.getItemImagePath(productItem) : '';

      return {
        itemName: item.itemName,
        quantity: item.quantity,
        imagePath,
        productItem: productItem!
      };
    });
  }

  onItemClick(item: InventoryItemDisplay) {
    this.selectedItem = item;

    // 獲取物品使用預覽
    const previewResult = ItemUsageService.getItemUsagePreview(item.itemName, 1);
    this.itemPreview = previewResult.success ? previewResult.preview! : [];

    this.showConfirmModal = true;
  }

  closeConfirmModal() {
    this.showConfirmModal = false;
    this.selectedItem = null;
    this.itemPreview = [];
  }

  onConfirmBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.closeConfirmModal();
    }
  }

  confirmUseItem() {
    if (!this.selectedItem) return;

    // 檢查是否可以使用
    const canUseResult = ItemUsageService.canUseItem(this.selectedItem.itemName);
    if (!canUseResult.canUse) {
      alert(canUseResult.reason);
      return;
    }

    // 使用物品
    const useResult = ItemUsageService.useItem(this.selectedItem.itemName, 1);

    if (useResult.success) {
      // 發送使用成功事件
      this.itemUsed.emit({
        itemName: this.selectedItem.itemName,
        effects: useResult.effects || []
      });

      // 更新背包資料
      this.inventory = UserInventoryService.loadUserInventory();
      this.updateCurrentTabItems();

      // 關閉確認彈窗
      this.closeConfirmModal();

      // 顯示成功訊息
      alert(`${useResult.message}${useResult.effects ? '\\n效果：' + useResult.effects.join(', ') : ''}`);
    } else {
      alert(useResult.message);
    }
  }

  openShop() {
    this.onClose();
    this.openShopModal.emit();
  }

  getTabLabel(tab: InventoryCategory): string {
    const tabItem = this.tabs.find(t => t.key === tab);
    return tabItem ? tabItem.label : tab;
  }
}