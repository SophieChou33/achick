import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { sources } from '../../sources';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="welcome-overlay" [class.animate-out]="animateOut" (click)="onLogoClick()">
      <div class="logo-container">
        <img [src]="logoSrc" alt="Achick Logo" class="logo" />
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
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      cursor: pointer;
      transition: transform 0.8s ease-in;
    }

    .welcome-overlay.animate-out {
      transform: translateY(-100vh);
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
      transition: transform 0.3s ease;
    }

    .logo:hover {
      transform: scale(1.05);
    }

    @media (max-width: 768px) {
      .logo {
        width: 150px;
        height: 150px;
      }
    }
  `]
})
export class WelcomeComponent implements OnInit, OnDestroy {
  logoSrc: string = '';
  animateOut: boolean = false;

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

  onLogoClick() {
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