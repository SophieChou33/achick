import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { sources } from '../../sources';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="welcome-overlay" [class.animate-out]="animateOut">
      <div class="background-animation" [style.background-image]="backgroundImage"></div>
      <div class="content-container">
        <div class="logo-container">
          <img [src]="logoSrc" alt="Achick Logo" class="logo" />
        </div>
        <button class="start-button" (click)="onStartGame()">START!</button>
      </div>
    </div>
  `,
  styles: [`
    .welcome-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      cursor: pointer;
      transition: transform 0.8s ease-in;
      overflow: hidden;
    }

    .welcome-overlay.animate-out {
      transform: translateY(-100vh);
    }

    .background-animation {
      position: absolute;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background-size: 1920px 100dvh;
      background-repeat: repeat-x;
      animation: scrollRight 15s linear infinite;
      z-index: 1;
    }

    @keyframes scrollRight {
      from {
        background-position: -1920px 0;
      }
      to {
        background-position: 0 0;
      }
    }

    .content-container {
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 2;
      gap: 40px;
    }

    .logo-container {
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .logo {
      width: 200px;
      height: 200px;
      object-fit: contain;
      filter: drop-shadow(0 10px 20px rgba(0,0,0,0.3));
    }

    .start-button {
      background: rgba(255, 255, 255, 0.1);
      border: 2px solid rgba(255, 255, 255, 0.2);
      border-radius: 50px;
      padding: 15px 40px;
      color: white;
      font-size: 24px;
      font-weight: bold;
      cursor: pointer;
      backdrop-filter: blur(10px);
      transition: all 0.3s ease;
      animation: float 3s ease-in-out infinite;
      text-shadow: 0 2px 4px rgba(0,0,0,0.5);
      letter-spacing: 2px;
    }

    .start-button:hover {
      animation-play-state: paused;
      box-shadow: 0 15px 30px rgba(0,0,0,0.4);
      transform: translateY(-5px);
      background: rgba(255, 255, 255, 0.2);
    }

    @keyframes float {
      0%, 100% {
        transform: translateY(0px);
      }
      50% {
        transform: translateY(-15px);
      }
    }

  `]
})
export class WelcomeComponent implements OnInit, OnDestroy {
  logoSrc: string = '';
  animateOut: boolean = false;
  backgroundImage = "url('assets/images/scene/welcome-bg.png')";

  ngOnInit() {
    this.setLogoBasedOnBackground();
  }

  ngOnDestroy() {
    // Clean up if needed
  }

  private setLogoBasedOnBackground() {
    // For the gradient background (light), use dark logo
    this.logoSrc = sources.logo.logoSquareDark;
  }

  onStartGame() {
    this.animateOut = true;

    // Remove component from DOM after animation completes
    setTimeout(() => {
      const element = document.querySelector('.welcome-overlay');
      if (element && element.parentNode) {
        element.parentNode.removeChild(element);
      }
    }, 800); // Animation duration
  }
}