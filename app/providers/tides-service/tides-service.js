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
  }

  getTides(lat, lng, date) {
    let startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    let timestamp = startOfDay / 1000;

    let tides = this.http.get('https://www.worldtides.info/api?heights&extremes&lat='+lat+'&lon='+lng+'&start='+timestamp+'&key=afedd705-a812-4ee5-b343-86ea9093fdbe&length=86400');

    return tides;
  }

}

