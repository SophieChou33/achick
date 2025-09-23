import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WhiteTransitionService {
  private fadeInSubject = new BehaviorSubject<boolean>(false);
  private fadeOutSubject = new BehaviorSubject<boolean>(false);
  private sceneReadyCallback: (() => void) | null = null;
  private tempCallback: (() => void) | null = null;

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
    this.tempCallback = null;
  }

  // 當白光達到最大強度時，調用場景準備回調
  onWhiteReady(callback: () => void) {
    this.sceneReadyCallback = callback;
  }

  // 設置一次性回調（不會覆蓋主回調）
  setOneTimeCallback(callback: () => void) {
    this.tempCallback = callback;
  }

  // 由白光組件調用，觸發場景準備
  triggerScenePreparation() {
    // 優先執行一次性回調
    if (this.tempCallback) {
      this.tempCallback();
      this.tempCallback = null; // 執行後清除
    } else if (this.sceneReadyCallback) {
      this.sceneReadyCallback();
    }
  }

  // 場景準備完成後調用此方法觸發fadeOut
  onSceneReady() {
    this.fadeOut();
  }
}