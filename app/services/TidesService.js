import {Http} from 'angular2/http';
import 'rxjs/add/operator/map';
 
export class TidesService {  
    static get parameters() {
        return [[Http]];
    }
 
    constructor(http) {
        this.http = http
    }   
 
    getTides(lat, lng, time) {
    	this.tides = {};
        var url = 'https://www.worldtides.info/api?height&extremes&lat='+lat+'&lon='+lng+'&start='+time.getTime()+'&key=afedd705-a812-4ee5-b343-86ea9093fdbe&length=43200';
        return this.http.get(url);
    }
}