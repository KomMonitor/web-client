import { Component, Input, Output, EventEmitter } from '@angular/core';
import { KommonitorToastHelperService } from 'services/kommonitor-toast-helper-service/kommonitor-toast-helper.service';

interface ToastConfig {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  position: 'default' | 'upperLeft' | 'upperRight';
}

@Component({
  selector: 'app-gsoc-demo',
  templateUrl: './gsoc-demo.component.html',
})
export class GsocDemoComponent {
  @Input() isVisible: boolean = false;
  @Output() closeRequest = new EventEmitter<void>();

  toastConfig: ToastConfig = {
    title: '',
    message: '',
    type: 'info',
    position: 'default',
  };

  constructor(
    private toastService: KommonitorToastHelperService
  ) { }

  closeModal() {
    console.log('Close modal called');
    this.closeRequest.emit();
  }

  showToast(): void {
    console.log('Attempting to show toast', this.toastConfig);

    if (!this.toastConfig.message.trim()) {
      console.warn('Toast message is empty');
      return;
    }

    try {
      // Directly call the appropriate toast method
      const methodMap = {
        default: {
          success: this.toastService.displaySuccessToast.bind(this.toastService),
          info: this.toastService.displayInfoToast.bind(this.toastService),
          warning: this.toastService.displayWarningToast.bind(this.toastService),
          error: this.toastService.displayErrorToast.bind(this.toastService)
        },
        upperLeft: {
          success: this.toastService.displaySuccessToast_upperLeft.bind(this.toastService),
          info: this.toastService.displayInfoToast_upperLeft.bind(this.toastService),
          warning: this.toastService.displayWarningToast_upperLeft.bind(this.toastService),
          error: this.toastService.displayErrorToast_upperLeft.bind(this.toastService)
        },
        upperRight: {
          success: this.toastService.displaySuccessToast_upperRight.bind(this.toastService),
          info: this.toastService.displayInfoToast_upperRight.bind(this.toastService),
          warning: this.toastService.displayWarningToast_upperRight.bind(this.toastService),
          error: this.toastService.displayErrorToast_upperRight.bind(this.toastService)
        }
      };

      // Get the correct method based on position and type
      const toastMethod = methodMap[this.toastConfig.position][this.toastConfig.type];

      // Call the method with title and message
      toastMethod(this.toastConfig.title, this.toastConfig.message);

      console.log('Toast displayed successfully');
    } catch (error) {
      console.error('Error displaying toast:', error);

      // Fallback alert
      alert(`${this.toastConfig.type.toUpperCase()}: ${this.toastConfig.title}\n${this.toastConfig.message}`);
    }
  }
}