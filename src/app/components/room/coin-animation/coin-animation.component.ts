import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface CoinAnimation {
  id: string;
  amount: number;
  x: number;
  y: number;
  visible: boolean;
}

@Component({
  selector: 'app-coin-animation',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="coin-animations-container">
      <div
        *ngFor="let coin of activeAnimations"
        class="coin-animation"
        [style.left.px]="coin.x"
        [style.top.px]="coin.y"
        [class.visible]="coin.visible">
        +{{ coin.amount }}
      </div>
    </div>
  `,
  styles: [`
    .coin-animations-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 95000;
    }

    .coin-animation {
      position: absolute;
      font-size: 24px;
      font-weight: bold;
      color: #ffd700;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
      opacity: 0;
      transform: translateY(0px);
      transition: all 2s ease-out;
      pointer-events: none;
    }

    .coin-animation.visible {
      opacity: 1;
      transform: translateY(-20px);
    }

    .coin-animation.visible {
      animation: coinFloat 2s ease-out forwards;
    }

    @keyframes coinFloat {
      0% {
        opacity: 1;
        transform: translateY(0px) scale(1);
      }
      50% {
        opacity: 1;
        transform: translateY(-10px) scale(1.1);
      }
      100% {
        opacity: 0;
        transform: translateY(-20px) scale(0.8);
      }
    }

    @media (max-width: 576px) {
      .coin-animation {
        font-size: 20px;
      }
    }
  `]
})
export class CoinAnimationComponent implements OnInit {
  activeAnimations: CoinAnimation[] = [];
  private animationCounter = 0;

  ngOnInit() {}

  /**
   * 觸發金幣增加動畫
   * @param amount 增加的金幣數量
   * @param x X座標位置（可選，預設為畫面中央）
   * @param y Y座標位置（可選，預設為畫面中央）
   */
  public showCoinAnimation(amount: number, x?: number, y?: number): void {
    const coinAnimation: CoinAnimation = {
      id: `coin-${++this.animationCounter}`,
      amount,
      x: x || window.innerWidth / 2,
      y: y || window.innerHeight / 2,
      visible: false
    };

    this.activeAnimations.push(coinAnimation);

    // 立即觸發動畫
    setTimeout(() => {
      coinAnimation.visible = true;
    }, 50);

    // 動畫完成後移除
    setTimeout(() => {
      this.removeAnimation(coinAnimation.id);
    }, 2500);
  }

  /**
   * 移除動畫
   */
  private removeAnimation(id: string): void {
    this.activeAnimations = this.activeAnimations.filter(anim => anim.id !== id);
  }

  /**
   * 清理所有動畫
   */
  public clearAllAnimations(): void {
    this.activeAnimations = [];
  }
}