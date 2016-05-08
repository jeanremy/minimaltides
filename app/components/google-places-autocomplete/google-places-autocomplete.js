import {Directive, ElementRef} from 'angular2/core';

/*
  Generated class for the GooglePlacesAutocomplete directive.

  See https://angular.io/docs/ts/latest/api/core/DirectiveMetadata-class.html
  for more info on Angular 2 Directives.
*/
@Directive({
  selector: '[google-places-autocomplete]' // Attribute selector
})
export class GooglePlacesAutocomplete {
	static get parameters(){
		return [ElementRef];
	}

 	constructor(element){
 
		this.element = element;

		window.addEventListener('keyup', function() {
            console.log(this.element);
        }, false);

	}
}
