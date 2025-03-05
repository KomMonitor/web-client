import { Inject, Injectable } from "@angular/core";

@Injectable({
    providedIn: 'root'
})
export class KommonitorToastHelperService {
    private angularJsToastService: any;

    constructor(@Inject('$injector') private $injector: any) {
        // Lazy load the service to ensure it's available
        try {
            this.angularJsToastService = this.$injector.get('kommonitorToastHelperService');
        } catch (error) {
            console.error('Failed to inject AngularJS toast service:', error);
        }
    }

    // Utility method to safely call AngularJS service methods
    private safeServiceCall(methodName: string, ...args: any[]): void {
        console.log(`Attempting to call ${methodName}`, args);

        // Ensure service is loaded
        if (!this.angularJsToastService) {
            console.warn('AngularJS toast service not loaded. Falling back to console log.');
            this.fallbackToast(methodName, ...args);
            return;
        }

        try {
            if (args.length === 2) {
                const [title, content] = args;
                this.angularJsToastService[methodName](title, content);
            } else {
                this.angularJsToastService[methodName](...args);
            }
        } catch (error) {
            console.error(`Error calling ${methodName}:`, error);
            this.fallbackToast(methodName, ...args);
        }
    }

    // Fallback method for toast display
    private fallbackToast(methodName: string, ...args: any[]): void {
        // Determine toast type from method name
        const getToastType = (method: string) => {
            if (method.includes('Success')) return 'success';
            if (method.includes('Info')) return 'info';
            if (method.includes('Warning')) return 'warning';
            if (method.includes('Error')) return 'error';
            return 'info';
        };

        // Use browser toastr if available
        if (window['toastr']) {
            const toastr = window['toastr'];
            const type = getToastType(methodName);
            const [content, title] = args;

            switch (type) {
                case 'success':
                    toastr.success(content, title);
                    break;
                case 'info':
                    toastr.info(content, title);
                    break;
                case 'warning':
                    toastr.warning(content, title);
                    break;
                case 'error':
                    toastr.error(content, title);
                    break;
            }
        } else {
            // Ultimate fallback to console and alert
            console.log(`Fallback Toast (${methodName}):`, args);
            alert(args.join(' '));
        }
    }

    // Standard toast methods
    displaySuccessToast(toastTitle: string, toastContent: string): void {
        this.safeServiceCall('displaySuccessToast', toastTitle, toastContent);
    }

    displayInfoToast(toastTitle: string, toastContent: string): void {
        this.safeServiceCall('displayInfoToast', toastTitle, toastContent);
    }

    displayWarningToast(toastTitle: string, toastContent: string): void {
        this.safeServiceCall('displayWarningToast', toastTitle, toastContent);
    }

    displayErrorToast(toastTitle: string, toastContent: string): void {
        this.safeServiceCall('displayErrorToast', toastTitle, toastContent);
    }

    // Upper left positioned toasts
    displaySuccessToast_upperLeft(toastTitle: string, toastContent: string): void {
        this.safeServiceCall('displaySuccessToast_upperLeft', toastTitle, toastContent);
    }

    displayInfoToast_upperLeft(toastTitle: string, toastContent: string): void {
        this.safeServiceCall('displayInfoToast_upperLeft', toastTitle, toastContent);
    }

    displayWarningToast_upperLeft(toastTitle: string, toastContent: string): void {
        this.safeServiceCall('displayWarningToast_upperLeft', toastTitle, toastContent);
    }

    displayErrorToast_upperLeft(toastTitle: string, toastContent: string): void {
        this.safeServiceCall('displayErrorToast_upperLeft', toastTitle, toastContent);
    }

    // Upper right positioned toasts
    displaySuccessToast_upperRight(toastTitle: string, toastContent: string): void {
        this.safeServiceCall('displaySuccessToast_upperRight', toastTitle, toastContent);
    }

    displayInfoToast_upperRight(toastTitle: string, toastContent: string): void {
        this.safeServiceCall('displayInfoToast_upperRight', toastTitle, toastContent);
    }

    displayWarningToast_upperRight(toastTitle: string, toastContent: string): void {
        this.safeServiceCall('displayWarningToast_upperRight', toastTitle, toastContent);
    }

    displayErrorToast_upperRight(toastTitle: string, toastContent: string): void {
        this.safeServiceCall('displayErrorToast_upperRight', toastTitle, toastContent);
    }
}