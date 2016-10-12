import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';


@Injectable()
export class GmapService {

	public data: any;
	public key: 'AIzaSyDu-QZnDzl-mfuSUVumhUv9wsAIUAQSNsg';

	constructor(private http: Http) {
		this.key = 'AIzaSyDu-QZnDzl-mfuSUVumhUv9wsAIUAQSNsg';
	}

	getLocationByCoords(lat, lng) {
		let url = 'https://maps.googleapis.com/maps/api/geocode/json?latlng='+lat+','+lng+'&key='+this.key;
		return this.http.get(url);
		
	}

	getLocationById(id) {
		let url = 'https://maps.googleapis.com/maps/api/geocode/json?key='+this.key+'&place_id='+id;
		return this.http.get(url);
	}

	getPredictions(input) {

		let url = 'https://maps.googleapis.com/maps/api/place/autocomplete/json?key='+this.key+'&input='+input+'&types=(cities)';
		return this.http.get(url);
	}
  
}

