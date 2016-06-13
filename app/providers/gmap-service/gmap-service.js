import {Injectable} from 'angular2/core';
import {Http} from 'angular2/http';
import 'rxjs/add/operator/map';

/*
  Generated class for the Geocoder provider.

  See https://angular.io/docs/ts/latest/guide/dependency-injection.html
  for more info on providers and Angular 2 DI.
*/
@Injectable()
export class GmapService {
	static get parameters(){
		return [[Http]]
	}  

	constructor(http) {
		this.http = http;
		this.data = null;
		this.key = 'AIzaSyDu-QZnDzl-mfuSUVumhUv9wsAIUAQSNsg';
	}

	getLocationName(lat, lng) {

		var url = 'https://maps.googleapis.com/maps/api/geocode/json?latlng='+lat+','+lng;
		return this.http.get(url);
		
	}

	getPredictions(input) {
		var url = 'https://maps.googleapis.com/maps/api/autocomplete/json?key='+this.key+'&input='+input;
		return this.http.get(url);
	}
  
}

