import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { IonicModule } from '@ionic/angular';

import { HospitalInfoPageRoutingModule } from './hospital-info-routing.module';

import { HospitalInfoPage } from './hospital-info.page';
import { CallNumber } from '@ionic-native/call-number/ngx';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TranslateModule,
    HospitalInfoPageRoutingModule
  ],
  providers: [CallNumber, InAppBrowser],
  declarations: [HospitalInfoPage]
})
export class HospitalInfoPageModule { }
