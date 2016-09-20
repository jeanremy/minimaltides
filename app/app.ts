import { Component } from '@angular/core';
import { Platform, ionicBootstrap } from 'ionic-angular';
import {HomePage} from './pages/home/home';

@Component({
  template: '<ion-nav [root]="rootPage"></ion-nav>'
})
export class TidesApp {

  public rootPage: any;

  constructor(private platform: Platform) {
    this.rootPage = HomePage;

    platform.ready().then(() => {
    });
  }
}

ionicBootstrap(TidesApp);
