// <reference types="@angular/localize" />

import '@angular/localize/init';

// Import these globally to make teh typescript compiler happy by bringing in their @types
import 'angular';
import 'angular-resource';
import 'angular-route';

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app.module';

// Need to import NG 1.x module
//import './app-ajs';

platformBrowserDynamic().bootstrapModule(AppModule);