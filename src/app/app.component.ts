import { Component } from '@angular/core';
import { Platform } from 'ionic-angular';
import { StatusBar } from 'ionic-native';

import { HomePage } from '../pages/home/home';


@Component({
  template: `<ion-nav [root]="rootPage"></ion-nav>`
})
export class TidesApp {
  rootPage = HomePage;

  constructor(platform: Platform) {
    platform.ready().then(() => {

    });
  }
}
