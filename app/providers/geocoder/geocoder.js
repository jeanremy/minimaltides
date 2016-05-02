import {Injectable} from 'angular2/core';
import {Http} from 'angular2/http';
import 'rxjs/add/operator/map';

/*
  Generated class for the Geocoder provider.

  See https://angular.io/docs/ts/latest/guide/dependency-injection.html
  for more info on providers and Angular 2 DI.
*/
@Injectable()
export class Geocoder {
	static get parameters(){
		return [[Http]]
	}  

	constructor(http) {
		this.http = http;
		this.data = null;
	}

	getLocationName(lat, lng) {

		var url = 'http://maps.googleapis.com/maps/api/geocode/json?latlng='+lat+','+lng,
			name = 'Error';
		return this.http.get(url);
		
	}
  
}

