import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CollectionService, CollectionData, CollectionItem, EggCollectionItem, ChildCollectionItem } from '../../../data/collection-data';
import { getBreedByName } from '../../../data/breed-data';
import { sources } from '../../../sources';

interface TabItem {
  key: keyof CollectionData;
  label: string;
}

@Component({
  selector: 'app-collection-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-backdrop" [class.show]="isVisible" (click)="onBackdropClick($event)">
      <div class="modal-dialog" (click)="$event.stopPropagation()">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">圖鑑</h5>
            <div class="collection-stats">
              <span class="stats-text">收集進度: {{ collectionStats.unlockedBreeds }}/{{ collectionStats.totalBreeds }} ({{ collectionStats.completionRate }}%)</span>
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

          <!-- 內容區域 -->
          <div class="modal-body">
            <!-- 蛋分頁 -->
            <div *ngIf="activeTab === 'EGG'" class="collection-grid">
              <div *ngFor="let item of collectionData.EGG" class="collection-item">
                <div class="item-image-container">
                  <img [src]="item.imageSource" [alt]="item.rareName" class="item-image" />
                  <div *ngIf="item.isUnlocked === 0" class="locked-overlay">
                    <img [src]="unlockedIcon" alt="未解鎖" class="locked-icon" />
                  </div>
                </div>
                <div class="item-info">
                  <div class="item-name">{{ item.isUnlocked === 1 ? item.rareName : '???' }}</div>
                  <div class="item-count" *ngIf="item.isUnlocked === 1">收集次數: {{ item.collectedCount }}</div>
                  <div class="item-locked" *ngIf="item.isUnlocked === 0">未解鎖</div>
                </div>
              </div>
            </div>

            <!-- 幼年分頁 -->
            <div *ngIf="activeTab === 'CHILD'" class="collection-grid">
              <div *ngFor="let item of collectionData.CHILD" class="collection-item">
                <div class="item-image-container">
                  <img [src]="item.imageSource" alt="幼年小雞" class="item-image" />
                  <div *ngIf="item.isUnlocked === 0" class="locked-overlay">
                    <img [src]="unlockedIcon" alt="未解鎖" class="locked-icon" />
                  </div>
                </div>
                <div class="item-info">
                  <div class="item-name">{{ item.isUnlocked === 1 ? '幼年小雞' : '???' }}</div>
                  <div class="item-count" *ngIf="item.isUnlocked === 1">收集次數: {{ item.collectedCount }}</div>
                  <div class="item-locked" *ngIf="item.isUnlocked === 0">未解鎖</div>
                </div>
              </div>
            </div>

            <!-- 進化分頁 -->
            <div *ngIf="activeTab === 'EVOLUTION'" class="collection-grid">
              <div *ngFor="let item of collectionData.EVOLUTION" class="collection-item">
                <div class="item-image-container">
                  <img [src]="item.imageSource" [alt]="item.breedName" class="item-image" />
                  <div *ngIf="item.isUnlocked === 0" class="locked-overlay">
                    <img [src]="unlockedIcon" alt="未解鎖" class="locked-icon" />
                  </div>
                </div>
                <div class="item-info">
                  <div class="item-name">{{ item.isUnlocked === 1 ? getBreedDisplayName(item.breedName) : '???' }}</div>
                  <div class="item-count" *ngIf="item.isUnlocked === 1">收集次數: {{ item.collectedCount }}</div>
                  <div class="item-locked" *ngIf="item.isUnlocked === 0">未解鎖</div>
                </div>
              </div>
            </div>

            <!-- 熟成分頁 -->
            <div *ngIf="activeTab === 'COOKED'" class="collection-grid">
              <div *ngFor="let item of collectionData.COOKED" class="collection-item">
                <div class="item-image-container">
                  <img [src]="item.imageSource" [alt]="item.breedName" class="item-image" />
                  <div *ngIf="item.isUnlocked === 0" class="locked-overlay">
                    <img [src]="unlockedIcon" alt="未解鎖" class="locked-icon" />
                  </div>
                </div>
                <div class="item-info">
                  <div class="item-name">{{ item.isUnlocked === 1 ? getBreedDisplayName(item.breedName) : '???' }}</div>
                  <div class="item-count" *ngIf="item.isUnlocked === 1">收集次數: {{ item.collectedCount }}</div>
                  <div class="item-locked" *ngIf="item.isUnlocked === 0">未解鎖</div>
                </div>
              </div>
            </div>
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
      background-color: rgba(0, 0, 0, 0.7);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 2000;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
    }

    .modal-backdrop.show {
      opacity: 1;
      visibility: visible;
    }

    .modal-dialog {
      background-color: white;
      border-radius: 12px;
      width: 90%;
      max-width: 800px;
      max-height: 85vh;
      overflow: hidden;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
      transform: scale(0.9);
      transition: transform 0.3s ease;
    }

    .modal-backdrop.show .modal-dialog {
      transform: scale(1);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid #e9ecef;
      background-color: #f8f9fa;
    }

    .modal-title {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #333;
    }

    .collection-stats {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .stats-text {
      font-size: 14px;
      color: #666;
      font-weight: 500;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #999;
      padding: 0;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .close-btn:hover {
      color: #666;
    }

    .modal-tabs {
      display: flex;
      border-bottom: 1px solid #e9ecef;
      background-color: #f8f9fa;
    }

    .tab-btn {
      flex: 1;
      padding: 12px 16px;
      border: none;
      background: none;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      color: #666;
      border-bottom: 2px solid transparent;
      transition: all 0.2s ease;
    }

    .tab-btn:hover {
      background-color: rgba(0, 0, 0, 0.05);
      color: #333;
    }

    .tab-btn.active {
      color: #007bff;
      border-bottom-color: #007bff;
      background-color: white;
    }

    .modal-body {
      padding: 20px;
      max-height: 60vh;
      overflow-y: auto;
    }

    .collection-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 16px;
    }

    .collection-item {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 12px;
      text-align: center;
      border: 2px solid transparent;
      transition: all 0.2s ease;
    }

    .collection-item:hover {
      border-color: #007bff;
      background: #fff;
    }

    .item-image-container {
      position: relative;
      margin-bottom: 8px;
    }

    .item-image {
      width: 80px;
      height: 80px;
      object-fit: contain;
      border-radius: 4px;
    }

    .locked-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
    }

    .locked-icon {
      width: 32px;
      height: 32px;
      opacity: 0.8;
    }

    .item-info {
      text-align: center;
    }

    .item-name {
      font-size: 14px;
      font-weight: 600;
      color: #333;
      margin-bottom: 4px;
    }

    .item-count {
      font-size: 12px;
      color: #666;
    }

    .item-locked {
      font-size: 12px;
      color: #999;
      font-style: italic;
    }

    /* 響應式設計 */
    @media (max-width: 576px) {
      .modal-dialog {
        width: 95%;
        max-height: 90vh;
      }

      .collection-grid {
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
        gap: 12px;
      }

      .item-image {
        width: 60px;
        height: 60px;
      }

      .modal-header {
        padding: 12px 16px;
      }

      .modal-title {
        font-size: 16px;
      }

      .stats-text {
        font-size: 12px;
      }

      .tab-btn {
        padding: 10px 8px;
        font-size: 12px;
      }
    }
  `]
})
export class CollectionModalComponent implements OnInit {
  @Output() close = new EventEmitter<void>();

  isVisible = false;
  activeTab: keyof CollectionData = 'EGG';
  collectionData: CollectionData = CollectionService.loadCollectionData();
  collectionStats = CollectionService.getCollectionStats(this.collectionData);
  unlockedIcon = sources.character.others.unlocked;

  tabs: TabItem[] = [
    { key: 'EGG', label: '蛋' },
    { key: 'CHILD', label: '幼年' },
    { key: 'EVOLUTION', label: '進化' },
    { key: 'COOKED', label: '熟成' }
  ];

  ngOnInit() {
    this.loadCollectionData();
  }

  show() {
    this.loadCollectionData();
    this.isVisible = true;
  }

  onClose() {
    this.isVisible = false;
    this.close.emit();
  }

  onBackdropClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  switchTab(tab: keyof CollectionData) {
    this.activeTab = tab;
  }

  loadCollectionData() {
    this.collectionData = CollectionService.loadCollectionData();
    this.collectionStats = CollectionService.getCollectionStats(this.collectionData);
  }

  getBreedDisplayName(breedKey: string): string {
    const breedData = getBreedByName(breedKey);
    return breedData?.breedName || breedKey;
  }

}