import { Component, ElementRef, OnInit, Output, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { SearchBarComponent } from '../search-bar/search-bar.component';

@Component({
  selector: 'app-search-bar-float',
  templateUrl: './search-bar-float.component.html',
  styleUrls: ['./search-bar-float.component.scss']
})
export class SearchBarFloatComponent extends SearchBarComponent {}

