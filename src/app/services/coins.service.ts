import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { UserDataService } from '../data/user-data';

@Injectable({
  providedIn: 'root'
})
export class CoinsService {
  private coinsSubject = new BehaviorSubject<number>(0);
  public coins$: Observable<number> = this.coinsSubject.asObservable();

  constructor() {
    this.initializeCoins();
  }

  private initializeCoins(): void {
    const userData = UserDataService.loadUserData();
    this.coinsSubject.next(userData.coins);
  }

  getCoins(): number {
    return this.coinsSubject.value;
  }

  setCoins(amount: number): void {
    const userData = UserDataService.loadUserData();
    const updatedData = UserDataService.updateUserData({ coins: Math.max(0, amount) }, userData);
    this.coinsSubject.next(updatedData.coins);
  }

  addCoins(amount: number): void {
    const userData = UserDataService.loadUserData();
    const updatedData = UserDataService.addCoins(amount, userData);
    this.coinsSubject.next(updatedData.coins);
  }

  spendCoins(amount: number): boolean {
    const userData = UserDataService.loadUserData();
    const result = UserDataService.spendCoins(amount, userData);
    if (result.success) {
      this.coinsSubject.next(result.data.coins);
      return true;
    }
    return false;
  }

  hasEnoughCoins(amount: number): boolean {
    return this.getCoins() >= amount;
  }

  refreshCoins(): void {
    this.initializeCoins();
  }
}