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
		this.searchQuery 	= 'Waiting for position...';
		this.location 		= {};
		this.locations 		= [];

		this.time 			= new Date();

		navigator.geolocation.getCurrentPosition(
			(position) => {
				this.location = {};
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
		this.getTides(this.location.geometry.location.lat, this.location.geometry.location.lng);
	}

	getNextDay() {
		this.time = new Date(this.time.setDate(this.time.getDate() + 1));
		this.getTides(this.location.geometry.location.lat, this.location.geometry.location.lng);
	}

	// About searchQuery
	getPredictions(searchbar) {
		this.gmapService.getPredictions(searchbar.target.value).map(res => res.json()).subscribe(

            data => {
            	if(data.status === "OK") {
                	this.locations = data.predictions;
            	}
            },
            err => console.error(err)
        );
	}

	getLocationName(lat, lng) {
		this.location.name = this.gmapService.getLocationByCoords(lat, lng).map(res => res.json()).subscribe(data => {
			if(data.status === "OK") {
				console.log(data.results);
				this.location = data.results[0];
				this.searchQuery = data.results[0].address_components[0].long_name;
			}
			else {
				//console.log(data.status);
			}
		});
	}

	resetQuery() {
		this.searchQuery = this.location.address_components[0].long_name;
	}

	setLocation(location) {
		this.gmapService.getLocationById(location.place_id).map(res => res.json()).subscribe( data => {
			if(data.status === "OK") {
				this.location = data.results[0];
				this.searchQuery = this.location.address_components[0].long_name;
        		this.locations = [];
	    		this.getTides(this.location.geometry.location.lat, this.location.geometry.location.lng, this.time);
			}
			else {
				console.log(data.status);
			}
        });
	}

	getTides(lat, lng) {
		this.tidesService.getTides(lat, lng, this.time).map(res => res.json()).subscribe(
            data => {
                this.tides = data;
                //console.log(data);
                this.getLocationName(this.tides.responseLat, this.tides.responseLon);
                this.getExtremeTides();
                this.drawChart();
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

	drawChart() {
		var chart = new google.visualization.AreaChart(document.getElementById('chart'));


		var datas = [
			['Day', 'Heights']
		];

		for (var i = 0; i < this.tides.heights.length; i++) {
			datas.push([this.tides.heights[i].date, this.tides.heights[i].height]);
		}

		var data = google.visualization.arrayToDataTable(datas);

		console.log(datas);

		var options = {
			animation: {
				duration: 300
			},
			chartArea: {left:0,top:0,width:'100%',height:'100%'},
			legend: 'none',
			hAxis: {
				titleTextStyle: {color: '#333'},
				gridlines: {count: 0},
				viewWindowMode: {min: -2}, 
				minValue: -2
			},
			vAxis: {
				titleTextStyle: {color: '#333'},
				gridlines: {count: 0},
				viewWindowMode: {min: -2}, 
				minValue: 4

			}
		};

		chart.draw(data, options);

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
