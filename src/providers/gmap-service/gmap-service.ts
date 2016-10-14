import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from "rxjs/Observable";
import 'rxjs/add/operator/map';


@Injectable()
export class GmapService {

	private key: any;

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

