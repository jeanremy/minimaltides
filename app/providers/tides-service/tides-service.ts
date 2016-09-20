import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';


/*
  Generated class for the TidesService provider.

  See https://angular.io/docs/ts/latest/guide/dependency-injection.html
  for more info on providers and Angular 2 DI.
*/
@Injectable()
export class TidesService {
  
  public data: any;
  public key: '79b7e2cf-dcd5-4f6c-930d-f89e9cc4c34c';
  
  constructor(private http: Http) {
    this.key = '79b7e2cf-dcd5-4f6c-930d-f89e9cc4c34c';

  }

  getTides(lat, lng, date) {
    let startOfDay = +new Date(date.getFullYear(), date.getMonth(), date.getDate());
    let timestamp = +startOfDay / 1000;
    let tides = this.http.get('https://www.worldtides.info/api?heights&extremes&lat='+lat+'&lon='+lng+'&start='+timestamp+'&key='+this.key+'&length=86400');
    return tides;
  }

}

