import 'rxjs/add/operator/map';
import {Page} from 'ionic-angular';
import {Http} from 'angular2/http';
import {Geolocation} from 'ionic-native';
import {TidesService} from '../../providers/tides-service/tides-service';
import {Geocoder} from '../../providers/geocoder/geocoder';


@Page({
  templateUrl: 'build/pages/home/home.html',
  providers: [TidesService, Geocoder]
})
export class HomePage {

	static get parameters() {
		return [[Http], [TidesService], [Geocoder]];
	}

	constructor(http, tidesService, geocoder) {
		this.http 			= http;
		this.tidesService 	= tidesService;
		this.geocoder 		= geocoder;
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
            err => console.error(err)
        );
	}

	getExtremeTides() {
		let now = Math.round(this.time.getTime() / 1000);
		let index = 0;
		let length = this.tides.extremes.length;

		// Boucle à refaire pour parcourir le tableau, et prendre la valeur la plus proche.

		for(var i = 0; i < length; i++) {

			if(now > this.tides.extremes[i].dt) {
				var day 	= new Date(this.tides.extremes[i].date),
					hour 	= day.getUTCHours(),
					min 	= day.getUTCMinutes();
				this.extremes[0] = {
					type: this.tides.extremes[i].type,
					hour: hour+':'+min
				};
				index = i;
			}
		}

		if(typeof this.tides.extremes[index + 1] != 'undefined') {
			var day 	= new Date(this.tides.extremes[index + 1].date),
				hour 	= day.getUTCHours(),
				min 	= day.getUTCMinutes();
			this.extremes[1] = {
				type: this.tides.extremes[index + 1].type,
				hour: hour+':'+min
			};
		}
	}

	getLocationName(lat, lng) {
		this.location.name = this.geocoder.getLocationName(lat, lng);
		console.log(this.geocoder);
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
