import { bootstrapApplication } from '@angular/platform-browser';

import { appConfig } from './app.config';
import { MainComponent } from './mainComponent/main/main.component';

bootstrapApplication(MainComponent, appConfig).catch((err) => console.error(err));
