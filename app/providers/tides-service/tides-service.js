import {Injectable} from 'angular2/core';
import {Http} from 'angular2/http';
import 'rxjs/add/operator/map';

/*
  Generated class for the TidesService provider.

  See https://angular.io/docs/ts/latest/guide/dependency-injection.html
  for more info on providers and Angular 2 DI.
*/
@Injectable()
export class TidesService {
  static get parameters(){
    return [[Http]]
  }  

  constructor(http) {
    this.http = http;
    this.data = null;
    this.key = '79b7e2cf-dcd5-4f6c-930d-f89e9cc4c34c';
  }

  getTides(lat, lng, date) {
    var startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    var timestamp = startOfDay / 1000;
    var tides = this.http.get('https://www.worldtides.info/api?heights&extremes&lat='+lat+'&lon='+lng+'&start='+timestamp+'&key='+this.key+'&length=86400');
    return tides;
  }

}

