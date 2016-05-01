import 'rxjs/add/operator/map';
import {Page} from 'ionic-angular';
import {Http} from 'angular2/http';
import {Geolocation} from 'ionic-native';
import {TidesService} from '../../providers/tides-service/tides-service';


@Page({
  templateUrl: 'build/pages/home/home.html',
  providers: [TidesService]
})
export class HomePage {

	static get parameters() {
		return [[Http], [TidesService]];
	}

	constructor(http, tidesService) {
		this.http 			= http;
		this.tidesService 	= tidesService;
		this.time 			= new Date();
		this.location 		= {name: "En cours de gélocalisation..."};
		let locationOptions = {timeout: 10000, enableHighAccuracy: true};

		navigator.geolocation.getCurrentPosition(
			(position) => {
				this.location = {
					lat: position.coords.latitude,
					lng: position.coords.longitude
				}
				console.log(this.location);
	        	this.getTides(position.coords.latitude, position.coords.longitude, this.time);
                //this.getLocationName(this.location);

			},

			(error) => {
				console.log(error);
			},
			locationOptions
	    );
	}

	getTides(lat, lng, date) {
		this.tidesService.getTides(lat, lng, date).subscribe(
            data => {
                this.tides = JSON.parse(data._body);
                this.getLocationName(this.tides.responseLat, this.tides.responseLon);
            },
            err => console.error(err),
            () => console.log(this.tides)
        );
	}

	getLocationName(lat, lng) {

		var url = 'http://maps.googleapis.com/maps/api/geocode/json?latlng='+lat+','+lng;
		this.http.get(url).map(res => res.json()).subscribe(data => {
				console.log(data);

			if(data.status === "OK") {
				this.location.name = data.results[1].address_components[0].long_name;
				console.log(this.location.name);
			}
		});
		// call googleapi for cityname with latlng
	}

  // form listener

}
