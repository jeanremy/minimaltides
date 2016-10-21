import { Component } from '@angular/core';
import 'rxjs/add/operator/map';
//import {Page} from 'ionic-angular';
import { Platform, LoadingController, NavController } from 'ionic-angular';
import { TidesService } from '../../providers/tides-service/tides-service';
import { GmapService } from '../../providers/gmap-service/gmap-service';

declare var d3: any;

/* TODO 

	faire loading ...
	faire transition sur left/right
	mettre un circle sur la line
	factoriser un peu le dessin, c'est le bordel

*/

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
	public swipe: any;
	private svg: any;


	constructor(public nav: NavController, private loadingCtrl: LoadingController, public platform: Platform, public tidesService: TidesService, public gmapService: GmapService) {
		this.canvas 		= document.getElementById('canvas');
		this.searchQuery 	= '';
		this.locations 		= [];
		this.searching 		= false;
		this.nearestPlace 	= '';
		this.time 			= new Date();
		this.status 		= "";
		this.swipe  = '';
		this.platform.ready().then(() => { 
            this.geolocate(); 

			this.svg = d3.select("#chart")
				.append("svg")
				.attr("width", window.innerWidth)
				.attr("id", "tides-chart")
				.attr("xmlns", "http://www.w3.org/2000/svg");

			this.svg.append('path').attr("id", "line")
			this.svg.append('path').attr("id", "current-line")
			this.svg.append('circle').attr("id", "circle")
        });
	}

	getPrevDay() {
		this.swipe = 'prev';
		this.time = new Date(this.time.setDate(this.time.getDate() - 1));
		this.getTides(this.tides.requestLat, this.tides.requestLon);
	}

	getNextDay() {
		this.swipe = 'next';
		this.time = new Date(this.time.setDate(this.time.getDate() + 1));
		this.getTides(this.tides.requestLat, this.tides.requestLon);
	}

	// About searchQuery
	showPredictions() {
		this.searching = true;
	}

	geolocate() {

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
		this.swipe = '';

		// Boucle à refaire pour parcourir le tableau, et prendre la valeur la plus proche.
		let find = false;

		for (let i = 0; i < length; i++) {

			let day 	= new Date(this.tides.extremes[i].date),
				hour 	= ("0" + day.getHours()).slice(-2),
				min 	= ("0" + day.getMinutes()).slice(-2);

			this.extremes[this.tides.extremes[i].type].push({
				type: this.tides.extremes[i].type,
				hour: hour+':'+min,
				selected: (+day.getTime() > +this.time.getTime() && find === false) ? true:false
			});
			index = i;

			// a améliorer pour les soirs 
			if(+day.getTime() > +this.time.getTime() && find === false) {
				this.status = this.tides.extremes[i].type === 'High' ? 'up':'down';
				find = true;
			}
		}
		/* si rien trouvé, on prend la dernière et ce sera l'inverse */
		if(find === false) {
			this.status = this.tides.extremes[length - 1].type === 'High' ? 'down':'up';
			find = true;
		}
	}

	drawCanvas() {

		// test d3
		let line = d3.svg.line()
			.x(function(d) { return d[0]; })
			.y(function(d) { return d[1]; })
			.interpolate("cardinal");

		let backPath = d3.select("#line");
		let currentPath = d3.select("#current-line");
		let circle = d3.select("#circle");
		

		// on cree une ligne avec tous les points, mais sans les courbes
		let points 			= new Array(),
			currentPoints 	= new Array(),
			step 			= (window.innerWidth / (this.tides.heights.length - 1)),
			delta 			= 50,
			heights 		= new Array(),
			currentHeights 	= new Array();


		for(let i = 0, j = this.tides.heights.length; i < j; i++) {
			let date = new Date(this.tides.heights[i].dt);
		    heights.push(this.tides.heights[i].height);

		    if(+date < (+this.time.getTime() / 1000)) {
		    	currentHeights.push(this.tides.heights[i].height);		    	
		    }
		}
		

		let minHeight = Math.max.apply(null, heights),
			maxHeight = Math.min.apply(null, heights);

		/* la ligne de fond */
		for(let i = 0, j = heights.length; i < j; i++) {
			let x = i * step,
				y = (2 + ((heights[i] - minHeight) / (maxHeight - minHeight)) * delta);
			points.push([x,y]);
		}

		console.log(heights, points);


		/* la ligne du jour */
		for(let i = 0, j = currentHeights.length; i < j; i++) {
			let x = i * step,
				y = (2 + ((currentHeights[i] - minHeight) / (maxHeight - minHeight)) * delta);
			currentPoints.push([x,y]);
		}

      	backPath
			.attr("d", line(points))
			.attr("stroke", "#8299BA")
			.attr("stroke-width", 2)
			.attr("fill", "none");
      	
		currentPath
			.attr("d", line(currentPoints))
			.attr("stroke", "#263960")
			.attr("stroke-width", 2)
			.attr("fill", "none");
      	
      	this.animateChart([backPath, currentPath, circle]);

		
	}

	animateChart(el) {

		let totalLength 		= el[0].node().getTotalLength(),
			currentTotalLength 	= el[1].node().getTotalLength();

		el[0]
			.attr("stroke-dasharray", totalLength + " " + totalLength)
			.attr("stroke-dashoffset", totalLength)
			.transition()
			.duration(1000)
			.ease("linear")
			.attr("stroke-dashoffset", 0);



		el[1]
			.attr("stroke-dasharray", currentTotalLength + " " + currentTotalLength)
			.attr("stroke-dashoffset", currentTotalLength)
			.transition()
			.delay(1000)
			.duration(1000)
			.ease("linear")
			.attr("stroke-dashoffset", 0);
	}

	animateIn() {
		

	}

}
