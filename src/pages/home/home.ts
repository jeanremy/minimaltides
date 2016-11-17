import { Component, trigger, state, style, transition, animate } from '@angular/core';
import 'rxjs/add/operator/map';
import { Platform } from 'ionic-angular';
import { TidesService } from '../../providers/tides-service/tides-service';
import { GmapService } from '../../providers/gmap-service/gmap-service';
import { Geolocation } from 'ionic-native';




declare var d3: any;

/* TODO

	faire loading ...
	mettre un circle sur la line
	factoriser un peu le dessin, c'est le bordel

*/

@Component({
  templateUrl: 'home.html',
  animations: [

    trigger('fade', [
      state('out', style({
        transform: 'translate3d(0,20px,0)',
        opacity: 0,
        visibility: 'hidden'
      })),
      state('in', style({
        transform: 'translate3d(0,0,0)',
        opacity: 1,
        visibility: 'visible'
      })),
      transition('out <=> in', animate('300ms ease'))
    ])
  ]
})

export class HomePage {

	// Animations class
	public fadeState: string = 'out';

	public searchQuery: string = '';
	public locations: Array<any> = [];
	public location: any;
	public loading: any;
	public extremes: any;
	public searching: Boolean = false;
	public nearestPlace: string = '';
	public time : any;
	public tides: any;
	public status: string = '';

	// d3
	private svg: any;
	private curvePoints: Array<any> = [];
	private currentPoints: Array<any> = [];
	private line: any;
	private backPath: any;
	private backTotalLength: any;
	private currentPath: any;
	private currentTotalLength: any;
	private circle: any;
	private circleCoords: Array<any> = [];

	constructor(public platform: Platform, public tidesService: TidesService, public gmapService: GmapService) {

		this.time 			= new Date();
		this.line 			= d3.svg.line()
			.x(function(d) { return d[0]; })
			.y(function(d) { return d[1]; })
			.interpolate("cardinal");


		this.platform.ready().then(() => {
            this.geolocate();
			this.svg = d3.select("#chart")
				.append("svg")
				.attr("width", window.innerWidth)
				.attr("id", "tides-chart")
				.attr("xmlns", "http://www.w3.org/2000/svg");

			this.backPath = this.svg.append('path').attr("id", "line");
			this.currentPath = this.svg.append('path').attr("id", "current-line");
			this.circle = this.svg.append('circle').attr("id", "circle");
        });
	}

	navigate(dir) {

		if(dir === "next") {
			this.time = new Date(this.time.setDate(this.time.getDate() + 1));
		}else {
			this.time = new Date(this.time.setDate(this.time.getDate() - 1));
		}

		this.animateOut().then((response) => {
    		this.getTides(this.tides.requestLat, this.tides.requestLon)
  		});
	}

	// About searchQuery
	showPredictions() {

		this.searching = true;
	}

	geolocate() {

		Geolocation.getCurrentPosition({enableHighAccuracy:true, timeout:5000, maximumAge:0}).then(
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

    )
    .catch((error) => {
      alert('Error getting location' +  error);
    });
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

		this.gmapService.getLocationById(location.place_id).map(res => res.json()).subscribe( data => {
			if(data.status === "OK") {
	    		this.getTides(data.results[0].geometry.location.lat, data.results[0].geometry.location.lng);
			}
			else {
				alert(data.status);
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

		this.curvePoints 	= new Array();
		this.currentPoints 	= new Array()
		this.circleCoords	= new Array();

		let step 			= (window.innerWidth / (this.tides.heights.length - 1)),
			delta 			= 50,
			heights 		= new Array(),
			currentHeights 	= new Array(),
			circlePosition 	= 0,
			found = false;

		for(let i = 0, j = this.tides.heights.length; i < j; i++) {
			let date = new Date(this.tides.heights[i].dt);
		    heights.push(this.tides.heights[i].height);

		    if(+date < (+this.time.getTime() / 1000)) {
		    	currentHeights.push(this.tides.heights[i].height);
		    }
		    if(+date > (+this.time.getTime() / 1000) && found === false ) {
		    	circlePosition = i - 1;
		    	found = true;
		    }
		}


		let minHeight = Math.max.apply(null, heights),
			maxHeight = Math.min.apply(null, heights);



		for(let i = 0, j = heights.length; i < j; i++) {
			let x = i * step,
				y = (10 + ((heights[i] - minHeight) / (maxHeight - minHeight)) * delta);
			this.curvePoints.push([x,y]);
			if( i === 0) {
				this.circleCoords = [i * step, 10 + ((heights[i] - minHeight) / (maxHeight - minHeight)) * delta];
			}
		}

		/* la ligne de fond */
		this.backPath
			.attr("d", this.line(this.curvePoints));

		/* la ligne du jour */
		for(let i = 0, j = currentHeights.length; i < j; i++) {
			let x = i * step,
				y = (10 + ((currentHeights[i] - minHeight) / (maxHeight - minHeight)) * delta);
			this.currentPoints.push([x,y]);
		}

		this.currentPath
			.attr('opacity', 1)
			.attr("d", this.line(this.currentPoints));

		this.circle
			.attr("transform", "translate(" + this.currentPoints[0] + ")")
			.attr('r', 10)
			.attr('opacity', 0);

		this.fadeState = 'in';

		this.animateIn();
	}

	_translateAlong(path) {
		var l = path.getTotalLength();
		return function(i) {
			return function(t) {
				var p = path.getPointAtLength(t * l);
				return "translate(" + p.x + "," + p.y + ")";//Move marker
			}
		}
	}

	animateIn() {

		this.backTotalLength 	= this.backPath.node().getTotalLength();
		this.currentTotalLength = this.currentPath.node().getTotalLength();


		// anime de la ligne de fond
		this.backPath
			.attr("stroke-dasharray", this.backTotalLength + " " + this.backTotalLength)
			.attr("stroke-dashoffset", this.backTotalLength)
			.attr('opacity', 1)
			.transition()
			.duration(500)
			.ease("circle")
			.attr("stroke-dashoffset", 0);

		// Anime de la courbe et du point
		this.currentPath
			.attr("stroke-dasharray", this.currentTotalLength + " " + this.currentTotalLength)
			.attr("stroke-dashoffset", this.currentTotalLength)
			.attr('opacity', 1)
			.transition()
			.delay(500)
			.duration(500)
			.ease("linear")
			.attr("stroke-dashoffset", 0);

		this.circle
			.transition()
			.delay(500)
			.duration(500)
			.attrTween("transform", this._translateAlong(this.currentPath.node()))
			.attr('opacity', 1);


	}

	animateOut() {

		//MARCHE PAs
		return new Promise((resolve, reject) => {
  			this.fadeState = 'out'; // for transiotn

  			let self = this;

			this.currentPath
				.transition()
				.duration(300)
				.ease("circle")
				.attr("stroke-dashoffset", '-' + this.currentTotalLength)
				.attr('opacity', 0)
				.each('end', function() {
					self.currentPath
						.attr('opacity', 0);
				});
			this.circle
				.transition()
				.duration(300)
				.attr('opacity', 0);
			this.backPath
				.transition()
				.delay(300)
				.duration(500)
				.ease("circle")
				.attr("stroke-dashoffset", '-' + this.backTotalLength)
				.each('end', function() {
					self.backPath
						.attr('opacity', 0);
					resolve();
				});

  		});



	}

}
