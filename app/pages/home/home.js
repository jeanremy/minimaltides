import 'rxjs/add/operator/map';
import {Page} from 'ionic-angular';
import {Http} from 'angular2/http';
import {Geolocation} from 'ionic-native';
import {TidesService} from '../../providers/tides-service/tides-service';
import {GmapService} from '../../providers/gmap-service/gmap-service';



@Page({
  templateUrl: 'build/pages/home/home.html',
  providers: [TidesService, GmapService]
})
export class HomePage {

	static get parameters() {
		return [[Http], [TidesService], [GmapService]];
	}

	constructor(http, tidesService, gmapService) {
		
		this.http 			= http;
		this.tidesService 	= tidesService;
		this.gmapService 	= gmapService;
		this.canvas 		= document.getElementById('canvas');
		this.searchQuery 	= '';
		this.locations 		= [];

		this.time 			= new Date();
		this.location 		= {name: "Waiting for position..."};

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
			{timeout: 10000, enableHighAccuracy: true}
	    );
	}

	getPrevDay() {
		this.time = new Date(this.time.setDate(this.time.getDate() - 1));
		this.getTides(this.location.lat, this.location.lng);
	}

	getNextDay() {
		this.time = new Date(this.time.setDate(this.time.getDate() + 1));
		this.getTides(this.location.lat, this.location.lng);
	}

	// About searchQuery
	getPredictions(searchbar) {

		this.gmapService.getPredictions(searchbar.target.value).subscribe(

            data => {
                this.locations = JSON.parse(data._body);
        		console.log(this.locations);
            },
            err => console.error(err),
            () => console.log(data)
        );
	}

	getTides(lat, lng) {
		this.tidesService.getTides(lat, lng, this.time).map(res => res.json()).subscribe(
            data => {
                this.tides = data;
                console.log(data);
                this.getLocationName(this.tides.responseLat, this.tides.responseLon);
                this.getExtremeTides();
                this.drawCanvas();
            },
            err => console.error(err)

        );
	}

	getExtremeTides() {
		let now = Math.round(this.time.getTime() / 1000);
		let index = 0;
		let length = this.tides.extremes.length;
		this.extremes = {Low: [], High: []};

		// Boucle à refaire pour parcourir le tableau, et prendre la valeur la plus proche.

		for(var i = 0; i < length; i++) {

			var day 	= new Date(this.tides.extremes[i].date),
				hour 	= ("0" + day.getHours()).slice(-2),
				min 	= ("0" + day.getMinutes()).slice(-2);

			this.extremes[this.tides.extremes[i].type].push({
				type: this.tides.extremes[i].type,
				hour: hour+':'+min
			});
			index = i;
		}

	}

	getLocationName(lat, lng) {
		this.location.name = this.gmapService.getLocationName(lat, lng).map(res => res.json()).subscribe(data => {
			if(data.status === "OK") {
				this.location.name = data.results[1].address_components[0].long_name;
			}
			else {
				this.location.name = 'Erreur';
			}
		});
	}

	drawCanvas() {
		this.canvas = document.getElementById('canvas');
		var ctx 			= this.canvas.getContext('2d'),
			canvasWidth 	= this.canvas.width,
			canvasHeight 	= this.canvas.height,
			segments 		= new Array();

		for(var i = 0, j = this.tides.heights.length; i < j; i++) {
			if(i !== 0) {
		    	segments.push({start:this.tides.heights[i-1].height, end: this.tides.heights[i].height})
		  	}
		}


		// Dessin du canvas
		ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
		ctx.beginPath();
		ctx.moveTo(this.canvas.width, 50);
		ctx.lineTo(this.canvas.width, this.canvas.height);
		ctx.lineTo(0, this.canvas.height);
		ctx.lineTo(0, 50);


		for(var i = 0, j = segments.length; i < j; i++) {
		    var step = Math.round((this.canvas.width / segments.length)),
		      sx = i * step,
		      sy = 50 + (segments[i].start * 10),
		      ex = (i + 1) *step,
		      ey = 50 + (segments[i].end * 10);

		  	ctx.quadraticCurveTo(sx, sy, ex, ey);
		}

		ctx.fillStyle = 'navy';
		ctx.fill();
	}

}
