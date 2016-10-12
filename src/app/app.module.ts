import { NgModule } from '@angular/core';
import { IonicApp, IonicModule } from 'ionic-angular';
import { TidesApp } from './app.component';
import { HomePage } from '../pages/home/home';
import { TidesService } from '../providers/tides-service/tides-service';
import { GmapService } from '../providers/gmap-service/gmap-service';

@NgModule({
  declarations: [
    TidesApp,
    HomePage
  ],
  imports: [
    IonicModule.forRoot(TidesApp)
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    TidesApp,
    HomePage,
  ],
  providers: [
    TidesService,
    GmapService
  ]
})
export class AppModule {}
