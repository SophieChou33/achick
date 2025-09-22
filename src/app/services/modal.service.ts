import { Injectable, ComponentRef, ViewContainerRef, ApplicationRef, createComponent, EnvironmentInjector } from '@angular/core';
import { ModalComponent, ModalConfig } from '../components/shared/modal/modal.component';

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  private modalRef: ComponentRef<ModalComponent> | null = null;

  constructor(
    private appRef: ApplicationRef,
    private injector: EnvironmentInjector
  ) {}

  /**
   * 顯示 alert 型態的 modal
   */
  async alert(message: string, title?: string): Promise<void> {
    const config: ModalConfig = {
      type: 'alert',
      message,
      title,
      confirmText: '確定'
    };

    await this.showModal(config);
  }

  /**
   * 顯示 confirm 型態的 modal
   */
  async confirm(message: string, title?: string, confirmText?: string, cancelText?: string): Promise<boolean> {
    const config: ModalConfig = {
      type: 'confirm',
      message,
      title,
      confirmText: confirmText || '確認',
      cancelText: cancelText || '取消'
    };

    return await this.showModal(config);
  }

  /**
   * 顯示自定義配置的 modal
   */
  private async showModal(config: ModalConfig): Promise<boolean> {
    // 如果已有 modal 存在，先關閉它
    if (this.modalRef) {
      this.closeModal();
    }

    // 創建 modal 組件
    this.modalRef = createComponent(ModalComponent, {
      environmentInjector: this.injector
    });

    // 將組件添加到 DOM
    document.body.appendChild(this.modalRef.location.nativeElement);

    // 將組件添加到 Angular 應用程式中
    this.appRef.attachView(this.modalRef.hostView);

    // 顯示 modal 並等待結果
    const result = await this.modalRef.instance.show(config);

    // 清理
    this.closeModal();

    return result;
  }

  /**
   * 關閉當前的 modal
   */
  private closeModal(): void {
    if (this.modalRef) {
      this.appRef.detachView(this.modalRef.hostView);
      this.modalRef.destroy();
      this.modalRef = null;
    }
  }

  /**
   * 手動關閉 modal（緊急情況使用）
   */
  closeCurrentModal(): void {
    if (this.modalRef) {
      this.modalRef.instance.hide();
      this.closeModal();
    }
  }
}