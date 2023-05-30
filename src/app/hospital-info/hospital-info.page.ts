import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { NavigationExtras } from '@angular/router';
import { Hospital } from 'src/models/hospital.models';
import { Subscription } from 'rxjs';
import { NavController } from '@ionic/angular';
import { UiElementsService } from '../services/common/ui-elements.service';
import { TranslateService } from '@ngx-translate/core';
import { ApiService } from '../services/network/api.service';
import { Helper } from 'src/models/helper.models';
import { Doctor } from 'src/models/doctor.models';
import { CallNumber } from '@ionic-native/call-number/ngx';
import { APP_CONFIG, AppConfig } from '../app.config';
import { Constants } from 'src/models/constants.models';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';

@Component({
  selector: 'app-hospital-info',
  templateUrl: './hospital-info.page.html',
  styleUrls: ['./hospital-info.page.scss']
})
export class HospitalInfoPage implements OnInit, OnDestroy {
  // @ViewChild("pleaseConnect", { static: false }) pleaseConnect: ElementRef;
  // @ViewChild("map", { static: false }) mapElement: ElementRef;
  private subscriptions = new Array<Subscription>();
  private infiniteScrollEvent;
  private nextUrl: string;
  isLoading = true;
  private initialized = false;
  private pageNo = 1;
  favorite_icon = false;
  tabHinfo: string = "about";
  hospital: Hospital;
  currencyIcon: string;
  availabilityToday: string;
  private doctors = new Array<Doctor>();
  servicesDoctorsMap = new Array<{ service_id: number; service_title: string, doctors: Array<Doctor> }>();
  currServiceId = -1;
  hos_map: string;

  constructor(private navCtrl: NavController, private uiElementService: UiElementsService, private iab: InAppBrowser,
    @Inject(APP_CONFIG) private config: AppConfig, private translate: TranslateService, private apiService: ApiService, private callNumber: CallNumber) { }

  ngOnInit() {
    this.hospital = JSON.parse(window.localStorage.getItem(Constants.TEMP_HOSPITAL));
    console.log(this.hospital);
    this.currencyIcon = Helper.getSetting("currency_icon");
    for (let avail of this.hospital.availability) {
      if (avail.days == String(new Date().toLocaleString('en-us', { weekday: 'short' })).toLocaleLowerCase()) {
        this.translate.get((avail.selected ? "to" : "closed_today")).subscribe(value => (this.availabilityToday = avail.selected ? (avail.from + " " + value + " " + avail.to) : value));
        break;
      }
    }

    let parameters = new URLSearchParams();
    parameters.append("size", "400x200");
    parameters.append("markers", "color:red|" + this.hospital.latitude + "," + this.hospital.longitude);
    parameters.append("zoom", "13");
    parameters.append("key", this.config.googleApiKey);
    this.hos_map = "https://maps.googleapis.com/maps/api/staticmap?" + parameters.toString();
    console.log("hosmap", this.hos_map);

    this.translate.get("loading").subscribe(value => {
      this.uiElementService.presentLoading(value);
      this.loadDoctorsAll();
    });

    window.localStorage.removeItem(Constants.TEMP_HOSPITAL);
  }

  ngOnDestroy() {
    for (let sub of this.subscriptions) sub.unsubscribe();
    this.uiElementService.dismissLoading();
  }

  private loadDoctorsAll() {
    this.subscriptions.push(this.apiService.getDoctorsWithHospitalId(this.hospital.id, this.pageNo).subscribe(res => {
      this.doctors = this.doctors.concat(res.data);
      if (res.data && res.data.length > 0) { this.pageNo = this.pageNo + 1; this.loadDoctorsAll(); } else { this.uiElementService.dismissLoading(); this.setupDoctors(); }
    }, err => {
      console.log("getDoctorsWithHospitalId", err);
      this.uiElementService.dismissLoading();
    }));
  }

  toggleFavorite() {
    if (Helper.getLoggedInUser() != null) {
      this.translate.get("just_moment").subscribe(value => {
        this.uiElementService.presentLoading(value);
        this.subscriptions.push(this.apiService.toggleFavoriteHospital(this.hospital.id).subscribe(res => {
          this.hospital.is_favourite = !this.hospital.is_favourite;
          this.uiElementService.dismissLoading();
        }, err => {
          console.log("toggleProductFavorite", err);
          this.uiElementService.dismissLoading();
        }));
      });
    } else {
      this.alertLogin();
    }
  }

  navDocProfile(doc) {
    window.localStorage.setItem(Constants.TEMP_DOCTOR, JSON.stringify(doc));
    this.navCtrl.navigateForward(['./doctor-profile']);
  }

  navHospital(){
    this.iab.create((("http://maps.google.com/maps?daddr=" + this.hospital.latitude + "," + this.hospital.longitude)), "_system");
  }

  bookDoc(doc) {
    if (Helper.getLoggedInUser() != null) {
      let doctor = new Doctor();
      doctor.id = doc.id;
      doctor.name = doc.name;
      doctor.availability = doc.availability;
      doctor.image = doc.image;
      doctor.user = doc.user;
      doctor.user_id = doc.user_id;
      doctor.specializations_text = doc.specializations_text;
      doctor.consultancy_fee = doc.consultancy_fee;
      doctor.hospitalClosest = doc.hospitalClosest;

      let navigationExtras: NavigationExtras = { state: { doctor: doctor } };
      this.navCtrl.navigateForward(['./appointment-book'], navigationExtras);
    } else {
      this.alertLogin();
    }
  }

  dialHospital() {
    if (this.hospital.meta && this.hospital.meta.phone) {
      this.callNumber.callNumber(this.hospital.meta.phone, false).then(res => console.log('Launched dialer!', res)).catch(err => console.log('Error launching dialer', err));
    } else {
      this.translate.get("phone_unavailable").subscribe(value => this.uiElementService.presentToast(value));
    }
  }

  showServiceDoctors(sd: { service_id: number; service_title: string, doctors: Array<Doctor> }) {
    this.currServiceId = (this.currServiceId == sd.service_id) ? -1 : sd.service_id;
  }

  private setupDoctors() {
    for (let service of this.hospital.services) {
      let sDocs = new Array<Doctor>();
      for (let doc of this.doctors) {
        for (let docService of doc.services) {
          if (service.id == docService.id) {
            sDocs.push(doc);
            break;
          }
        }
      }
      if (sDocs.length > 0) this.servicesDoctorsMap.push({ service_id: service.id, service_title: service.title, doctors: sDocs });
    }
  }

  private alertLogin() {
    this.translate.get("alert_login_short").subscribe(value => this.uiElementService.presentToast(value));
    this.navCtrl.navigateForward(['./sign-in']);
  }
}
