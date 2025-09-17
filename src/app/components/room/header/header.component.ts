import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { sources } from '../../../sources';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="header">
      <div class="header-left">
        <img [src]="logoSrc" alt="Achick" class="logo" />
      </div>
      <div class="header-right">
        <div class="current-time">{{ currentTime }}</div>
        <div class="coins">
          <img [src]="coinIcon" alt="Coins" class="coin-icon" />
          <span class="coin-amount">{{ currentCoins }}</span>
        </div>
        <div class="functions">
          <button class="function-btn" (click)="openStore()">
            <img [src]="storeIcon" alt="商店" class="function-icon" />
          </button>
          <button class="function-btn" (click)="openCollection()">
            <img [src]="collectionIcon" alt="圖鑑" class="function-icon" />
          </button>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .header {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 70px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 20px;
      z-index: 1000;
      box-sizing: border-box;
    }

    .header-left .logo {
      height: 40px;
      width: auto;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .current-time {
      color: white;
      font-size: 14px;
      font-weight: 500;
      text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
    }

    .coins {
      display: flex;
      align-items: center;
      gap: 5px;
      color: white;
      font-weight: 600;
      text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
    }

    .coin-icon {
      width: 20px;
      height: 20px;
    }

    .functions {
      display: flex;
      gap: 10px;
    }

    .function-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 5px;
      border-radius: 5px;
      transition: background-color 0.3s ease;
    }

    .function-btn:hover {
      background-color: rgba(255,255,255,0.2);
    }

    .function-icon {
      width: 30px;
      height: 30px;
    }

    @media (max-width: 768px) {
      .header {
        padding: 0 10px;
      }

      .header-right {
        gap: 10px;
      }

      .current-time {
        font-size: 12px;
      }

      .function-icon {
        width: 25px;
        height: 25px;
      }

      .coin-icon {
        width: 18px;
        height: 18px;
      }
    }
  `]
})
export class HeaderComponent implements OnInit, OnDestroy {
  logoSrc = sources.logo.logoHorizonLight;
  coinIcon = sources.otherIcons.coin;
  storeIcon = sources.otherIcons.store;
  collectionIcon = sources.otherIcons.collection;

  currentTime = '';
  currentCoins = 1250;
  private timeInterval: any;

  ngOnInit() {
    this.updateTime();
    this.timeInterval = setInterval(() => {
      this.updateTime();
    }, 1000);
  }

  ngOnDestroy() {
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
  }

  private updateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    this.currentTime = `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
  }

  openStore() {
    console.log('Opening store...');
    // TODO: Implement store modal
  }

  openCollection() {
    console.log('Opening collection...');
    // TODO: Implement collection modal
  }
}