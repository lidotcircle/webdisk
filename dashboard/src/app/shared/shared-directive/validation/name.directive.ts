import { Directive } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, ValidationErrors, Validators } from '@angular/forms';
import * as utils from '../../utils';

@Directive({
  selector: '[appName]',
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: NameDirective,
      multi: true
    }]
})
export class NameDirective implements Validators {
  constructor() { }

  validate(control: AbstractControl): ValidationErrors {
    return (!control.value || control.value.length == 0 || utils.validation.validName(control.value)) ? null : {name: true};
  }
}
