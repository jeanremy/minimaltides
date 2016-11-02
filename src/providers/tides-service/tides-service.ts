import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from "rxjs/Observable";
import 'rxjs/add/operator/map';


/*
  Generated class for the TidesService provider.

  See https://angular.io/docs/ts/latest/guide/dependency-injection.html
  for more info on providers and Angular 2 DI.
*/
@Injectable()
export class TidesService {
  
  private key: any;
  
  constructor(private http: Http) {
    this.key = 'ad2f8bb5-e1a6-4f2b-9743-9ef857f3cb33';
  }

  getTides(lat, lng, date) {
    let startOfDay = +new Date(date.getFullYear(), date.getMonth(), date.getDate());
    let timestamp = +startOfDay / 1000;
    let tides = this.http.get('https://www.worldtides.info/api?heights&extremes&lat='+lat+'&lon='+lng+'&start='+timestamp+'&key='+this.key+'&length=86400');
    return tides;
  }

}

