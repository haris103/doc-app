import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { IonicModule } from '@ionic/angular';

import { HospitalMapViewPageRoutingModule } from './hospital-map-view-routing.module';

import { HospitalMapViewPage } from './hospital-map-view.page';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';
import { GoogleMapsService } from '../services/network/google-maps.service';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TranslateModule,
    HospitalMapViewPageRoutingModule
  ],
  providers: [InAppBrowser, GoogleMapsService],
  declarations: [HospitalMapViewPage]
})
export class HospitalMapViewPageModule { }
