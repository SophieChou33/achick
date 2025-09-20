import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WhiteTransitionService {
  private fadeInSubject = new BehaviorSubject<boolean>(false);
  private fadeOutSubject = new BehaviorSubject<boolean>(false);
  private sceneReadyCallback: (() => void) | null = null;

  fadeIn$ = this.fadeInSubject.asObservable();
  fadeOut$ = this.fadeOutSubject.asObservable();

  fadeIn() {
    this.fadeInSubject.next(true);
  }

  fadeOut() {
    this.fadeOutSubject.next(true);
  }

  reset() {
    this.fadeInSubject.next(false);
    this.fadeOutSubject.next(false);
    this.sceneReadyCallback = null;
  }

  // 當白光達到最大強度時，調用場景準備回調
  onWhiteReady(callback: () => void) {
    this.sceneReadyCallback = callback;
  }

  // 由白光組件調用，觸發場景準備
  triggerScenePreparation() {
    if (this.sceneReadyCallback) {
      this.sceneReadyCallback();
    }
  }

  // 場景準備完成後調用此方法觸發fadeOut
  onSceneReady() {
    this.fadeOut();
  }
}