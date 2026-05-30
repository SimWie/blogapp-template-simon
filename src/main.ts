import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

//Test comment to trigger CI/CD pipeline Test 2
bootstrapApplication(App, appConfig).catch((err) => console.error(err));
//Test comment to trigger CI/CD pipeline Test 3
