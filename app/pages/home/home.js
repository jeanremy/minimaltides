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
		this.location 		= {name: "Waiting for position..."};
		this.extremes 		= [];
		let locationOptions = {timeout: 10000, enableHighAccuracy: true};

		

		navigator.geolocation.getCurrentPosition(
			(position) => {
				this.location = {
					lat: position.coords.latitude,
					lng: position.coords.longitude
				}
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
                console.log(this.tides.extremes.length);
                this.getLocationName(this.tides.responseLat, this.tides.responseLon);
                this.getExtremeTides();
            },
            err => console.error(err),
            () => console.log(this.tides)
        );
	}

	getExtremeTides() {
		let now = Math.round(this.time.getTime() / 1000);
		let index = 0;
		let length = this.tides.extremes.length;

		for(var i = 0; i < length; i++) {
			console.log(now, this.tides.extremes[i].date);

			if(now < this.tides.extremes[i].dt) {
				this.extremes[0] = this.tides.extremes[i];
				index = i;
			}
		}

		if(typeof this.tides.extremes[index + 1] != 'undefined') {
			this.extremes[1] = this.tides.extremes[index+1];
		}
		console.log(this.extremes);
	}

	getLocationName(lat, lng) {

		var url = 'http://maps.googleapis.com/maps/api/geocode/json?latlng='+lat+','+lng;
		this.http.get(url).map(res => res.json()).subscribe(data => {

			if(data.status === "OK") {
				this.location.name = data.results[1].address_components[0].long_name;
			}
		});
		// call googleapi for cityname with latlng
	}

	getDayName() {
		let dayNames = new Array('Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday');
		return dayNames[this.time.getDay()];
	}

	getMonthName() {
		let monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"];
		return monthNames[this.time.getMonth()];
	}


}
