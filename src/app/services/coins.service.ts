import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { UserDataService } from '../data/user-data';
import { ToastrService } from '../components/shared/toastr/toastr.component';
import { LogService } from './log.service';

@Injectable({
  providedIn: 'root'
})
export class CoinsService {
  private coinsSubject = new BehaviorSubject<number>(0);
  public coins$: Observable<number> = this.coinsSubject.asObservable();

  constructor(private logService: LogService) {
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

  addCoins(amount: number, showToastr: boolean = true, reason?: string): void {
    if (amount <= 0) return;

    const userData = UserDataService.loadUserData();
    const oldCoins = userData.coins;
    const updatedData = UserDataService.addCoins(amount, userData);
    const newCoins = updatedData.coins;

    this.coinsSubject.next(newCoins);

    // 顯示 toastr
    if (showToastr) {
      const reasonText = reason ? `（${reason}）` : '';
      ToastrService.success(`獲得 ${amount} 金幣${reasonText}！`, 2000);
    }

    // 寫入日誌
    const reasonLog = reason ? ` (${reason})` : '';
    this.logService.addToastrLog(`金幣增加: +${amount}${reasonLog} (${oldCoins} → ${newCoins})`, 'success');
  }

  spendCoins(amount: number, reason?: string): boolean {
    if (amount <= 0) return false;

    const userData = UserDataService.loadUserData();
    const oldCoins = userData.coins;
    const result = UserDataService.spendCoins(amount, userData);

    if (result.success) {
      const newCoins = result.data.coins;
      this.coinsSubject.next(newCoins);

      // 寫入日誌
      const reasonLog = reason ? ` (${reason})` : '';
      this.logService.addToastrLog(`金幣減少: -${amount}${reasonLog} (${oldCoins} → ${newCoins})`, 'info');

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