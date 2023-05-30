import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { IonicModule } from '@ionic/angular';

import { HospitalsPageRoutingModule } from './hospitals-routing.module';

import { HospitalsPage } from './hospitals.page';
import { CallNumber } from '@ionic-native/call-number/ngx';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TranslateModule,
    HospitalsPageRoutingModule
  ],
  providers: [CallNumber, InAppBrowser],
  declarations: [HospitalsPage]
})
export class HospitalsPageModule { }
