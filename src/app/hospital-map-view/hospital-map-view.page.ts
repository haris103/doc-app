import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Router, NavigationExtras } from '@angular/router';
import { Hospital } from 'src/models/hospital.models.js';
import { NavController } from '@ionic/angular';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';
import { GoogleMapsService } from '../services/network/google-maps.service';
import createHTMLMapMarker from '../../assets/scripts/html-map-marker.js';
import { Constants } from 'src/models/constants.models';

@Component({
  selector: 'app-hospital-map-view',
  templateUrl: './hospital-map-view.page.html',
  styleUrls: ['./hospital-map-view.page.scss']
})
export class HospitalMapViewPage implements OnInit {
  @ViewChild("pleaseConnect", { static: true }) pleaseConnect: ElementRef;
  @ViewChild("map", { static: true }) mapElement: ElementRef;
  hospitals = new Array<Hospital>();
  private initialized = false;

  constructor(private router: Router, private navCtrl: NavController,
    private maps: GoogleMapsService, private iab: InAppBrowser) {
    console.log("getCurrentNavigation", this.router.getCurrentNavigation().extras.state);
    if (this.router.getCurrentNavigation().extras.state) {
      this.hospitals = this.router.getCurrentNavigation().extras.state.hospitals;
    }
  }

  ngOnInit() {
  }

  ionViewDidEnter() {
    if (!this.initialized) {
      let mapLoaded = this.maps.init(this.mapElement.nativeElement, this.pleaseConnect.nativeElement, null).then(() => {
        this.initialized = true;
        this.plotMarkers();
      }).catch(err => { console.log("maps.init", err); this.close() });
      mapLoaded.catch(err => { console.log("mapLoaded", err); this.close() });
    }
  }

  private close() {
    this.navCtrl.pop();
  }

  private plotMarkers() {
    let posBonds = new google.maps.LatLngBounds();
    for (let hos of this.hospitals) {
      let posDoc = new google.maps.LatLng(Number(hos.latitude), Number(hos.longitude));
      let markerDoc = createHTMLMapMarker({
        latlng: posDoc,
        map: this.maps.map,
        html: '<div id="doctor_map"><img src="' + hos.image + '"></div>'
      });
      posBonds.extend(posDoc);
    }
    setTimeout(() => this.maps.map.fitBounds(posBonds), 1000);
  }

  navHospitalInfo(hos) {
    window.localStorage.setItem(Constants.TEMP_HOSPITAL, JSON.stringify(hos));
    this.navCtrl.navigateForward(['./hospital-info']);
  }

  navHospital(hospital: Hospital) {
    this.iab.create((("http://maps.google.com/maps?daddr=" + hospital.latitude + "," + hospital.longitude)), "_system");
  }
}
