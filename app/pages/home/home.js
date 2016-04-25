import 'rxjs/add/operator/map';
import {Page} from 'ionic-angular';
import {Http} from 'angular2/http';
import {Geolocation} from 'ionic-native';
//import {TidesService} from '../../services/TidesService';


@Page({
  templateUrl: 'build/pages/home/home.html'
})
export class HomePage {

	static get parameters() {
		return [[Http]];
	}

	constructor(http) {
		this.http = http;

		Geolocation.getCurrentPosition().then((resp) => {
			this.currentLocation = {
				lat: resp.coords.latitude,
				lng: resp.coords.longitude
			}
			this.getTides(this.location.lat, this.location.lng);
		});
	}

	getTides(lat, lng) {
		var url = 'https://www.worldtides.info/api?extremes&lat='+lat+'&lon='+lng+'&key=afedd705-a812-4ee5-b343-86ea9093fdbe&length=43200';
		this.http.get(url).map(res => res.json()).subscribe(data => {
			this.tides = data;
			this.nearestLocation = {
				lat: data.responseLat,
				lng: data.responseLon
			}
			//console.log(lat, lng);

			this.getLocationName([this.currentLocation,this.nearestLocation]);
		});
	}

	getLocationName(locations) {

		for (var i = 0; i < locations.length; i++) {
			var url = 'http://maps.googleapis.com/maps/api/geocode/json?latlng='+locations[i].lat+','+locations[i].lng;
			this.http.get(url).map(res => res.json()).subscribe(data => {

				if(data.status === "OK") {
					locations[i].name = data.results[1].address_components[0].longname;
				}
				console.log(data);
			});
		}
		// call googleapi for cityname with latlng
	}

  // form listener

}
