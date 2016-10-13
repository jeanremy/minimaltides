import { Component } from '@angular/core';
import 'rxjs/add/operator/map';
//import {Page} from 'ionic-angular';
import { Platform, LoadingController, NavController } from 'ionic-angular';
import { TidesService } from '../../providers/tides-service/tides-service';
import { GmapService } from '../../providers/gmap-service/gmap-service';

@Component({
  templateUrl: 'home.html'
})
export class HomePage {

	public canvas: any;
	public searchQuery: any;
	public locations: any;
	public location: any;
	public loading: any;
	public extremes: any;
	public searching: any;
	public nearestPlace: any;
	public time : any;
	public tides: any;
	public status: any;


	constructor(public nav: NavController, private loadingCtrl: LoadingController, public platform: Platform, public tidesService: TidesService, public gmapService: GmapService) {
		this.canvas 		= document.getElementById('canvas');
		this.searchQuery 	= '';
		this.locations 		= [];
		this.searching 		= false;
		this.nearestPlace 	= '';
		this.time 			= new Date();
		this.platform.ready().then(() => { 
            this.geolocate(); 
        });
        console.log(this.time);
	}

	getPrevDay() {
		this.loading = this.loadingCtrl.create({ dismissOnPageChange: true });
		this.loading.present();
		this.time = new Date(this.time.setDate(this.time.getDate() - 1));
		this.getTides(this.tides.requestLat, this.tides.requestLon);
	}

	getNextDay() {
		this.loading = this.loadingCtrl.create({ dismissOnPageChange: true });
		this.loading.present();
		this.time = new Date(this.time.setDate(this.time.getDate() + 1));
		this.getTides(this.tides.requestLat, this.tides.requestLon);
	}

	// About searchQuery
	showPredictions() {
		this.searching = true;
	}

	geolocate() {
		this.loading = this.loadingCtrl.create({ dismissOnPageChange: true });
		this.loading.present();

		navigator.geolocation.getCurrentPosition(
			(position) => {
				this.gmapService.getLocationByCoords(position.coords.latitude, position.coords.longitude).map(res => res.json()).subscribe(data => {
					if(data.status === "OK") {
						this.searchQuery = this.getCityCountry(data);
						this.searching = false;
					}
					else {
						this.searching = false;
						this.searchQuery = 'Error';
					}
				});

	        	this.getTides(position.coords.latitude, position.coords.longitude);
			},

			(error) => {
				this.loading.dismiss();
				console.log(error);
			},
			{timeout: 10000, enableHighAccuracy: true}
	    );
	}

	getPredictions($event) {
		this.gmapService.getPredictions($event.target.value).map(res => res.json()).subscribe(

            data => {
            	if(data.status === "OK") {
                	this.locations = data.predictions;
            	}
            },
            err => console.error(err)
        );
	}


	resetQuery($event) {
		this.searching = false;
		this.searchQuery = '';
		console.log($event);
	}

	setLocation(location) {
		this.searching = false;
        this.locations = [];
		this.searchQuery = location.description;

		this.loading = this.loadingCtrl.create({ dismissOnPageChange: true });
		this.loading.present();

		this.gmapService.getLocationById(location.place_id).map(res => res.json()).subscribe( data => {
			if(data.status === "OK") {
	    		this.getTides(data.results[0].geometry.location.lat, data.results[0].geometry.location.lng);
			}
			else {
				this.loading.dismiss();
				console.log(data.status);
			}
        });
	}

	getTides(lat, lng) {
		this.tidesService.getTides(lat, lng, this.time).map(res => res.json()).subscribe(
            data => {
				this.loading.dismiss();            	
                this.tides = data;
                this.checkLocations();
                this.getExtremeTides();
                this.drawCanvas();
            },
            err => console.error(err)

        );
	}

	getCityCountry(data) {
		let temp = '';
		for (let i = 0; i < data.results[0].address_components.length; i++) {
			if(data.results[0].address_components[i].types.indexOf("locality") != -1) {
				temp = data.results[0].address_components[i].long_name;
			}

			if(data.results[0].address_components[i].types.indexOf("country") != -1) {
				temp += ', ' +data.results[0].address_components[i].long_name;
			}
		}
		return temp;
		
	}

	checkLocations() {
        //console.log(this.tides);
        let near = '';
		this.gmapService.getLocationByCoords(this.tides.responseLat, this.tides.responseLon).map(res => res.json()).subscribe(data => {
			if(data.status === "OK") {
				near = this.getCityCountry(data);
				if(near != this.searchQuery) {
					this.nearestPlace = near;
				} else {
					this.nearestPlace = '';
				}
			}
			else {
				this.nearestPlace = '';
			}
		});

	}

	getExtremeTides() {
		let index = 0;
		let length = this.tides.extremes.length;
		this.extremes = {Low: [], High: []};

		// Boucle à refaire pour parcourir le tableau, et prendre la valeur la plus proche.
		let find = false;

		for(let i = 0; i < length; i++) {

			let day 	= new Date(this.tides.extremes[i].date),
				hour 	= ("0" + day.getHours()).slice(-2),
				min 	= ("0" + day.getMinutes()).slice(-2);

			this.extremes[this.tides.extremes[i].type].push({
				type: this.tides.extremes[i].type,
				hour: hour+':'+min
			});
			index = i;

			if(day.getTime() > this.time.getTime() && find === false) {
				find = true;
				this.status = this.tides.extremes[i].type === 'High' ? 'up':'down';
			}
		}

	}

	drawCanvas() {
		this.canvas = document.getElementById('canvas');
		let ctx 			= this.canvas.getContext('2d'),
			delta 			= 40, // l'aimplitude de la courbe sur
			heights 		= new Array(),
			segments 		= new Array();

		for(let i = 0, j = this.tides.heights.length; i < j; i++) {
			if(i !== 0) {
		    	heights.push(this.tides.heights[i].height);
		  	}
		}

		for(let i = 0, j = heights.length; i < j; i++) {
			if(i !== 0) {
		    	segments.push({start:heights[i-1], end: (heights[i])})
		  	}
		}

		// calcul des max et min
		let maxHeight = Math.max.apply(null, heights),
			minHeight = Math.min.apply(null, heights);



		// Dessin du canvas (rectangle)
		ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
		ctx.beginPath();
		ctx.moveTo(this.canvas.width, (0 + ((segments[segments.length - 1].end - minHeight) / (maxHeight - minHeight)) * delta));
		ctx.lineTo(this.canvas.width, this.canvas.height);
		ctx.lineTo(0, this.canvas.height);
		ctx.lineTo(0, (0 + (segments[0].start - minHeight) / (maxHeight - minHeight)) * delta );


		// Dessin de la courbe
		for(let i = 0, j = segments.length; i < j; i++) {
		    let step = Math.round((this.canvas.width / segments.length)),
		      sx = i * step,
		      ex = (i + 1) *step,
		      // http://stackoverflow.com/questions/13729396/working-out-a-percentage-from-a-array-of-numbers
		      sy = (0 + ((segments[i].start - minHeight) / (maxHeight - minHeight)) * delta),
		      ey = (0 + ((segments[i].end - minHeight) / (maxHeight - minHeight)) * delta);

		  	ctx.quadraticCurveTo(sx, sy, ex, ey);
		}

		ctx.fillStyle = '#fff';
		ctx.fill();
	}
}
