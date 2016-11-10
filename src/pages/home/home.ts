import { Component, trigger, state, style, transition, animate } from '@angular/core';
import 'rxjs/add/operator/map';
import { Platform } from 'ionic-angular';
import { TidesService } from '../../providers/tides-service/tides-service';
import { GmapService } from '../../providers/gmap-service/gmap-service';

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
      state('fadein', style({
        transform: 'translate3d(0,20px,0)',
        opacity: 0,
        visibility: 'hidden'
      })),
      state('fadeout', style({
        transform: 'translate3d(0,0,0)',
        opacity: 1,
        visibility: 'visible'
      })),
      transition('* => *', animate('300ms ease'))
    ])
  ]
})

export class HomePage {

	// Animations class
	public fadeState: String = 'fadein';

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
	private pending: any;

	// d3
	private svg: any;
	private flatPoints: any;
	private curvePoints: any;
	private currentPoints: any;
	private line: any;
	private backPath: any;
	private currentPath: any;
	private circle: any;
	private circleCoords: any;


	constructor(public platform: Platform, public tidesService: TidesService, public gmapService: GmapService) {
		this.searchQuery 	= '';
		this.locations 		= [];
		this.searching 		= false;
		this.nearestPlace 	= '';
		this.time 			= new Date();
		this.status 		= "";
		this.pending 		= true;
		this.fadeState 		= 'fadein';
		//d3
		this.flatPoints		= new Array();
		this.curvePoints	= new Array();
		this.currentPoints	= new Array();
		this.circleCoords	= new Array();
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

	isPending() {
		return this.pending ? 'pending':'';
	}

	navigate(dir) {
		if(dir === "next") {
			this.time = new Date(this.time.setDate(this.time.getDate() + 1));
		}else {				
			this.time = new Date(this.time.setDate(this.time.getDate() - 1));
		}
		let self = this;

		this.animateOut(function() {

			self.getTides(self.tides.requestLat, self.tides.requestLon);
			
		});
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
				alert(error);
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

		this.gmapService.getLocationById(location.place_id).map(res => res.json()).subscribe( data => {
			if(data.status === "OK") {
	    		this.getTides(data.results[0].geometry.location.lat, data.results[0].geometry.location.lng);
			}
			else {
				this.loading.dismiss();
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

		this.pending 		= false;
		this.curvePoints 	= new Array();
		this.flatPoints 	= new Array();
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
			this.flatPoints.push([x, 10 + (((maxHeight - minHeight) / 2) / (maxHeight - minHeight)) * delta]);
			if( i === 0) {
				this.circleCoords = [i * step, 10 + ((heights[i] - minHeight) / (maxHeight - minHeight)) * delta];
			}
		}

		/* la ligne de fond */
		this.backPath
			.attr("d", this.line(this.flatPoints));	

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

		this.animateIn();
	}

	translateAlong(path) {
		var l = path.getTotalLength();
		return function(i) {
			return function(t) {
				var p = path.getPointAtLength(t * l);
				return "translate(" + p.x + "," + p.y + ")";//Move marker
			}
		}
	}

	animateIn() {
		
		let currentTotalLength 	= this.currentPath.node().getTotalLength();
		
		this.fadeState = "fadeout";

		// anime de la ligne de fond
		this.backPath
			.transition()
			.duration(500)
			.ease('circle')
			.attr('d', this.line(this.curvePoints)); 

		// Anime de la courve et du point		 	

		this.currentPath
			.attr("stroke-dasharray", currentTotalLength + " " + currentTotalLength)
			.attr("stroke-dashoffset", currentTotalLength)
			.transition()
			.delay(500)
			.duration(500)
			.ease("linear")
			.attr("stroke-dashoffset", 0);

		this.circle
			.transition()
			.delay(1000)
			.duration(300)
			.attrTween("transform", this.translateAlong(this.currentPath.node()))
			.attr('opacity', 1);


	}

	animateOut(callback) {

		this.pending = true;
		this.fadeState = "fadein";

		this.currentPath
			.transition()
			.duration(300)
			.attr('opacity', 0);
		this.circle
			.transition()
			.duration(300)
			.attr('opacity', 0);
		this.backPath
			.transition()
			.delay(350)
			.duration(500)
			.ease('circle')
			.attr('d', this.line(this.flatPoints))
			.each("end", callback);

	}

}
