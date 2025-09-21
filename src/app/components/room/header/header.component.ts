import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { sources } from '../../../sources';
import { CoinsService } from '../../../services/coins.service';

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
        <div class="header-top-row">
          <div class="current-time desktop-time">{{ currentTime }}</div>
          <div class="header-controls">
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
        </div>
        <div class="current-time mobile-time">{{ currentTime }}</div>
      </div>
    </header>
  `,
  styles: [`
    .header {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 5px 20px 0 20px;
      z-index: 1000;
      box-sizing: border-box;
    }

    .header-left .logo {
      height: 40px;
      width: auto;
    }

    .header-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 5px;
    }

    .header-top-row {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .header-controls {
      display: flex;
      align-items: center;
      gap: 15px;
      padding: 0 16px;
      background: rgba(255, 255, 255, 0.05);
      border: 2px solid rgba(255, 255, 255, 0.2);
      border-radius: 25px;
      backdrop-filter: blur(5px);
    }

    .current-time {
      color: white;
      font-size: 14px;
      font-weight: 500;
      text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
    }

    .mobile-time {
      display: none;
    }

    .desktop-time {
      display: block;
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
      width: 36px;
      height: 36px;
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
      width: 44px;
      height: 44px;
    }

    /* 響應式設計 - 小螢幕 */
    @media (max-width: 576px) {
      .header-right {
        flex-direction: column;
        align-items: flex-end;
        gap: 8px;
      }

      .header-top-row {
        gap: 15px;
      }

      .desktop-time {
        display: none;
      }

      .mobile-time {
        display: block;
        font-size: 12px;
      }

      .logo {
        height: 42px !important;
      }

      .coin-icon {
        width: 32px;
        height: 32px;
      }

      .function-icon {
        width: 38px;
        height: 38px;
      }

      .functions {
        gap: 8px;
      }
    }

  `]
})
export class HeaderComponent implements OnInit, OnDestroy {
  logoSrc = sources.logo.logoHorizonDark;
  coinIcon = sources.otherIcons.coin;
  storeIcon = sources.otherIcons.store;
  collectionIcon = sources.otherIcons.collection;

  currentTime = '';
  currentCoins = 0;
  private timeInterval: any;
  private coinsSubscription: Subscription = new Subscription();

  constructor(private coinsService: CoinsService) {}

  ngOnInit() {
    this.updateTime();
    this.timeInterval = setInterval(() => {
      this.updateTime();
    }, 1000);

    // Subscribe to coins changes
    this.coinsSubscription = this.coinsService.coins$.subscribe(coins => {
      this.currentCoins = coins;
    });

    // 初始化 logo
    this.updateLogo();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.updateLogo();
  }

  private updateLogo() {
    if (window.innerWidth <= 576) {
      this.logoSrc = sources.logo.logoSquareDark;
    } else {
      this.logoSrc = sources.logo.logoHorizonDark;
    }
  }

  ngOnDestroy() {
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
    this.coinsSubscription.unsubscribe();
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