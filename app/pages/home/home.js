import 'rxjs/add/operator/map';
import {Page, Loading, NavController} from 'ionic-angular';
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
		return [[Http], [TidesService], [GmapService], [NavController]];
	}

	constructor(http, tidesService, gmapService, navController) {
		
		this.http 			= http;
		this.tidesService 	= tidesService;
		this.gmapService 	= gmapService;
		this.canvas 		= document.getElementById('canvas');
		this.searchQuery 	= 'Waiting for position...';
		//this.location 		= {};
		//this.locations 		= [];
		this.nav 			= navController;
		this.loading 		= Loading.create();

	    this.nav.present(this.loading);

		this.time 			= new Date();

		navigator.geolocation.getCurrentPosition(
			(position) => {
				this.loading.dismiss();
				this.location = {};
	        	this.getTides(position.coords.latitude, position.coords.longitude, this.time);
			},

			(error) => {
				this.loading.dismiss();
				console.log(error);
			},
			{timeout: 1000, enableHighAccuracy: true}
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
				//console.log(data.results);
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
		
		this.loading = Loading.create();
	    this.nav.present(this.loading);

		this.gmapService.getLocationById(location.place_id).map(res => res.json()).subscribe( data => {
			if(data.status === "OK") {
				this.loading.dismiss();
				this.location = data.results[0];
				this.searchQuery = this.location.address_components[0].long_name;
        		this.locations = [];
	    		this.getTides(this.location.geometry.location.lat, this.location.geometry.location.lng, this.time);
			}
			else {
				this.loading.dismiss();
				console.log(data.status);
			}
        });
	}

	getTides(lat, lng) {
		this.loading = Loading.create();
	    this.nav.present(this.loading);

		this.tidesService.getTides(lat, lng, this.time).map(res => res.json()).subscribe(
            data => {
				this.loading.dismiss();
                this.tides = data;
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

	drawChart() {

		var datas = [];


		// var data = google.visualization.arrayToDataTable(datas);

		// console.log(datas);

		// var options = {
		// 	animation: {
		// 		duration: 300
		// 	},
		// 	chartArea: {left:0,top:0,width:'100%',height:'100%'},
		// 	legend: 'none',
		// 	hAxis: {
		// 		titleTextStyle: {color: '#333'},
		// 		gridlines: {count: 0},
		// 		viewWindowMode: {min: -2}, 
		// 		minValue: -2
		// 	},
		// 	vAxis: {
		// 		titleTextStyle: {color: '#333'},
		// 		gridlines: {count: 0},
		// 		viewWindowMode: {min: -2}, 
		// 		minValue: 4

		// 	}
		// };

		// chart.draw(data, options);

		var chart = document.getElementById('chart');

		var margin = {top: 0, right: 0, bottom: 30, left: 0},
		    width = chart.offsetWidth - margin.left - margin.right,
		    height = chart.offsetHeight - margin.top - margin.bottom;


		var parseDate = d3.time.format("%d-%b-%y").parse;

		var x = d3.time.scale()
		    .range([0, width]);

		var y = d3.scale.linear()
		    .range([height, 0]);

		var xAxis = d3.svg.axis()
		    .scale(x)
		    .orient("bottom");

		var yAxis = d3.svg.axis()
		    .scale(y)
		    .orient("left");

		var area = d3.svg.area()
		    .x(function(d) { return x(d.newDate); })
		    .y0(height)
		    .y1(function(d) { return y(d.height); });

		var svg = d3.select("#chart").html('').append("svg")
		    .attr("width", width + margin.left + margin.right)
		    .attr("height", height + margin.top + margin.bottom)
		  .append("g")
		    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");



		  this.tides.heights.forEach(function(d) {
		    d.newDate = new Date(d.dt*1000);
		  });

		  x.domain(d3.extent(this.tides.heights, function(d) { return d.newDate; }));
		  y.domain([d3.min(this.tides.heights, function(d) { return d.height; }), d3.max(this.tides.heights, function(d) { return d.height; })]);

		  svg.append("path")
		      .datum(this.tides.heights)
		      .attr("class", "area")
		      .attr("d", area);

		  svg.append("g")
		      .attr("class", "x axis")
		      .attr("transform", "translate(0," + height + ")")
		      .call(xAxis);

	}

	drawCanvas() {
		this.canvas = document.getElementById('canvas');
		var ctx 			= this.canvas.getContext('2d'),
			canvasWidth 	= this.canvas.width,
			canvasHeight 	= this.canvas.height,
			delta 			= 40, // l'aimplitude de la courbe sur
			heights 		= new Array(),
			segments 		= new Array();

		for(var i = 0, j = this.tides.heights.length; i < j; i++) {
			if(i !== 0) {
		    	heights.push(this.tides.heights[i].height);
		  	}
		}

		for(var i = 0, j = heights.length; i < j; i++) {
			if(i !== 0) {
		    	segments.push({start:heights[i-1], end: (heights[i])})
		  	}
		}

		// calcul des max et min
		var maxHeight = Math.max.apply(null, heights),
			minHeight = Math.min.apply(null, heights);



		// Dessin du canvas (rectangle)
		ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
		ctx.beginPath();
		ctx.moveTo(this.canvas.width, (0 + ((segments[segments.length - 1].end - minHeight) / (maxHeight - minHeight)) * delta));
		ctx.lineTo(this.canvas.width, this.canvas.height);
		ctx.lineTo(0, this.canvas.height);
		ctx.lineTo(0, (0 + (segments[0].start - minHeight) / (maxHeight - minHeight)) * delta );


		// Dessin de la courbe
		for(var i = 0, j = segments.length; i < j; i++) {
		    var step = Math.round((this.canvas.width / segments.length)),
		      sx = i * step,
		      ex = (i + 1) *step,
		      // http://stackoverflow.com/questions/13729396/working-out-a-percentage-from-a-array-of-numbers
		      sy = (0 + ((segments[i].start - minHeight) / (maxHeight - minHeight)) * delta),
		      ey = (0 + ((segments[i].end - minHeight) / (maxHeight - minHeight)) * delta);

		  	ctx.quadraticCurveTo(sx, sy, ex, ey);
		}

		ctx.fillStyle = '#596e90';
		ctx.fill();
	}

}
