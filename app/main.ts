
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app.module';

import * as jQuery from 'jquery';
(window as any).$ = jQuery;
(window as any).jQuery = jQuery;

platformBrowserDynamic().bootstrapModule(AppModule);