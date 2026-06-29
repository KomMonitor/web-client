import { Injectable, TemplateRef } from '@angular/core';

export interface NotificationOptions {
  header?: string;
  classname?: string;
  autohide?: boolean;
  delay?: number;
}

interface Notification {
  content: string | TemplateRef<any>;
  options: Partial<NotificationOptions>;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  notifications: Notification[] = [];

  show(message: string, options: Partial<NotificationOptions> = {}): void {
    this.notifications.push({
      content: message,
      options,
    });
  }

  showSuccess(message: string, options: Partial<NotificationOptions> = {}): void {
    this.notifications.push({
      content: message,
      options: {
        classname: 'bg-success text-light',
        ...options,
      },
    });
  }

  showError(errorText: string, options: Partial<NotificationOptions> = {}): void {
    this.notifications.push({
      content: errorText,
      options: {
        classname: 'bg-danger text-light',
        ...options,
      },
    });
  }

  showTemplate(template: TemplateRef<any>, options: Partial<NotificationOptions> = {}): void {
    this.notifications.push({
      content: template,
      options,
    });
  }

  remove(notification: Notification): void {
    this.notifications = this.notifications.filter((t) => t !== notification);
  }

  clear(): void {
    this.notifications.splice(0, this.notifications.length);
  }
}
