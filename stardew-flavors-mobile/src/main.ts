import { provideHttpClient } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { PreloadAllModules, provideRouter, RouteReuseStrategy, withPreloading} from '@angular/router';

import {
  IonicRouteStrategy,
  provideIonicAngular,
} from '@ionic/angular/standalone';

import { IonicStorageModule } from '@ionic/storage-angular';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';

bootstrapApplication(AppComponent, {
  providers: [
    {
    provide: RouteReuseStrategy,
    useClass: IonicRouteStrategy,
    },

    provideIonicAngular(),

    provideHttpClient(),

    importProvidersFrom(
      IonicStorageModule.forRoot()
    ),

    provideRouter(
      routes,
      withPreloading(PreloadAllModules)
    ),

    ],
});
