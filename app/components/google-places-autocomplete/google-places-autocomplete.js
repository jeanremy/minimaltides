import {Component, ElementRef} from 'angular2/core';
import {IONIC_DIRECTIVES} from 'ionic-angular';
/*
  Generated class for the GooglePlacesAutocomplete component.

  See https://angular.io/docs/ts/latest/api/core/ComponentMetadata-class.html
  for more info on Angular 2 Components.
*/
@Component({
  selector: 'google-places-autocomplete',
  templateUrl: 'build/components/google-places-autocomplete/google-places-autocomplete.html',
  directives: [IONIC_DIRECTIVES] // makes all Ionic directives available to your component
})
export class GooglePlacesAutocomplete {
	static get parameters() {
		return [[ElementRef]];
	}
  constructor(element) {
  	this.el = element;
  }

  ngAfterViewInit() {
    const hostElem = this.el.nativeElement;
    var self = this;
    this.input = hostElem.children[0].children[0].children[0].children[1];
    
    this.autocomplete = new google.maps.places.Autocomplete(this.input);

    this.autocomplete.addListener('place_changed', function() {
    
    	var place = self.autocomplete.getPlace();
	    if (!place.geometry) {
	      window.alert("Autocomplete's returned place contains no geometry");
	      return;
	    }
  	});
  }
}
