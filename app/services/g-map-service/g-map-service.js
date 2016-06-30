import {Injectable} from 'angular2/core';
import {Http} from 'angular2/http';
import 'rxjs/add/operator/map';

@Injectable()
export class GMapService {
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

	getPredictions(input) {
		var service = new google.maps.places.AutocompleteService();
		//console.log(service);
		service.getQueryPredictions({ input: input }, function(predictions, status) {
		    if (status != google.maps.places.PlacesServiceStatus.OK) {
		      return status;
		    }

			return predictions;
		  }
		);
	}
  
}

