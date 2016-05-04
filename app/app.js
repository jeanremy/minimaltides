import 'es6-shim';
import {App, Platform} from 'ionic-angular';
import {HomePage} from './pages/home/home';


@App({
  template: '<ion-nav [root]="rootPage"></ion-nav>',
  config: {}, // http://ionicframework.com/docs/v2/api/config/Config/
})
export class TidesApp {
  static get parameters() {
    return [[Platform]];
  }

  constructor(platform) {
    this.rootPage = HomePage;

    platform.ready().then(() => {
     
    });
  }
}
