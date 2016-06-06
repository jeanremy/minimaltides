import {Component, ElementRef, Renderer} from 'angular2/core';
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
		return [[ElementRef], [Renderer]];
	}
  constructor(element, renderer) {
  	this.el = element;
    this.renderer = renderer;
  }

  ngAfterViewInit() {
    const hostElem = this.el.nativeElement;
    var self = this;
    this.input = hostElem.children[0].children[0].children[0].children[1];

    this.renderer.listen(this.input, 'change', (event) => {
        this.autocomplete = new google.maps.places.Autocomplete(this.input);
        console.log(this.input.value);
    });
    

    // this.autocomplete.addListener('place_changed', function() {
    
    //  var place = self.autocomplete.getPlace();
     //  if (!place.geometry) {
     //    window.alert("Autocomplete's returned place contains no geometry");
     //    return;
    //   }
    // });

  }

  selectLocation(location) {
      this.location = location;
  }

  getLocation() {
    return this.location;
  }
}
