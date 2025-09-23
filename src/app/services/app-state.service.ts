import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AppStateService {
  private showWelcomeSubject = new BehaviorSubject<boolean>(true);
  private showRoomSubject = new BehaviorSubject<boolean>(false);

  showWelcome$ = this.showWelcomeSubject.asObservable();
  showRoom$ = this.showRoomSubject.asObservable();

  constructor() {}

  showWelcomePage(): void {
    this.showWelcomeSubject.next(true);
    this.showRoomSubject.next(false);
  }

  showRoomPage(): void {
    this.showWelcomeSubject.next(false);
    this.showRoomSubject.next(true);
  }

  getCurrentState(): { showWelcome: boolean; showRoom: boolean } {
    return {
      showWelcome: this.showWelcomeSubject.value,
      showRoom: this.showRoomSubject.value
    };
  }
}