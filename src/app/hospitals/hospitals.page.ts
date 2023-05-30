import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavController } from '@ionic/angular';
import { MyAddress } from 'src/models/address.models';
import { Helper } from 'src/models/helper.models';
import { Subscription } from 'rxjs';
import { Category } from 'src/models/category.models';
import { TranslateService } from '@ngx-translate/core';
import { UiElementsService } from '../services/common/ui-elements.service';
import { ApiService } from '../services/network/api.service';
import { Constants } from 'src/models/constants.models';
import { Hospital } from 'src/models/hospital.models';
import { CallNumber } from '@ionic-native/call-number/ngx';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';
import { NavigationExtras } from '@angular/router';
import { MyEventsService } from '../services/events/my-events.service';

@Component({
  selector: 'app-hospitals',
  templateUrl: './hospitals.page.html',
  styleUrls: ['./hospitals.page.scss']
})
export class HospitalsPage implements OnInit, OnDestroy {
  private subscriptions = new Array<Subscription>();
  private doneAll = false;
  private infiniteScrollEvent;
  private pageNo = 1;
  isLoading = true;
  selectedLocation: MyAddress;
  banners = new Array<Category>();
  hospitals = new Array<Hospital>();
  hostpitalsCategory = new Array<Category>();;

  constructor(private navCtrl: NavController, private translate: TranslateService, private callNumber: CallNumber,
    private myEventsService: MyEventsService, private uiElementService: UiElementsService, public apiService: ApiService,
    private iab: InAppBrowser) { }

  ngOnInit() {
    this.selectedLocation = Helper.getAddressSelected();
    this.subscriptions.push(this.myEventsService.getAddressObservable().subscribe(selectedLocationNew => {
      let changed: boolean = !this.selectedLocation || !selectedLocationNew || (this.selectedLocation.latitude != selectedLocationNew.latitude || this.selectedLocation.longitude != selectedLocationNew.longitude);
      this.selectedLocation = selectedLocationNew;
      if (changed) this.doRefresh();
    }));
    this.loadBanners();
    this.doRefresh();
  }

  ngOnDestroy() {
    for (let sub of this.subscriptions) sub.unsubscribe();
    this.uiElementService.dismissLoading();
  }

  pickLocation() {
    this.myEventsService.setCustomEventData("nav:pick_location");
  }

  private doRefresh() {
    this.pageNo = 1;
    this.hospitals = [];
    this.isLoading = true;
    this.loadHospitals();
  }

  private loadHospitals() {
    if (this.selectedLocation != null) {
      if (this.hospitals && this.hospitals.length) {
        this.getHostpitalsCategory();
        this.refreshHospitals();
      } else {
        this.translate.get("loading").subscribe(value => {
          this.uiElementService.presentLoading(value);
          this.getHostpitalsCategory();
          this.refreshHospitals();
        });
      }
    } else {
      this.isLoading = false;
    }
  }

  private getHostpitalsCategory() {
    this.subscriptions.push(this.apiService.getCategoriesWithScope(Constants.SCOPE_HOSPITAL).subscribe(res => { this.hostpitalsCategory = res; this.uiElementService.dismissLoading(); }, err => { console.log("getCategoriesWithScope", err); this.uiElementService.dismissLoading(); }));
  }

  private loadBanners() {
    this.subscriptions.push(this.apiService.getBanners(Constants.SCOPE_HOSPITAL).subscribe(res => this.banners = res, err => console.log("getBanners", err)));
  }

  private refreshHospitals() {
    this.subscriptions.push(this.apiService.getHospitals(this.selectedLocation, this.pageNo).subscribe(res => {
      this.hospitals = this.hospitals.concat(res);
      this.doneAll = (!res || !res.length);
      if (this.infiniteScrollEvent) this.infiniteScrollEvent.target.complete();
      this.isLoading = false;
      this.uiElementService.dismissLoading();
    }, err => {
      console.log("getHospitals", err);
      this.uiElementService.dismissLoading();
      if (this.infiniteScrollEvent) this.infiniteScrollEvent.target.complete();
      this.isLoading = false;
    }));
  }

  doInfiniteHospitals(event) {
    if (this.doneAll) {
      event.target.complete();
    } else {
      this.infiniteScrollEvent = event;
      this.pageNo = this.pageNo + 1;
      this.refreshHospitals();
    }
  }

  dialHospital(hospital: Hospital) {
    if (hospital.meta && hospital.meta.phone) {
      this.callNumber.callNumber(hospital.meta.phone, false).then(res => console.log('Launched dialer!', res)).catch(err => console.log('Error launching dialer', err));
    } else {
      this.translate.get("phone_unavailable").subscribe(value => this.uiElementService.presentToast(value));
    }
  }

  navHospital(hospital: Hospital) {
    this.iab.create((("http://maps.google.com/maps?daddr=" + hospital.latitude + "," + hospital.longitude)), "_system");
  }

  navHospitalInfo(hos) {
    window.localStorage.setItem(Constants.TEMP_HOSPITAL, JSON.stringify(hos));
    this.navCtrl.navigateForward(['./hospital-info']);
  }

  navMapView() {
    if (this.hospitals && this.hospitals.length) {
      let navigationExtras: NavigationExtras = { state: { hospitals: this.hospitals } };
      this.navCtrl.navigateForward(['./hospital-map-view'], navigationExtras);
    }
  }

  navSearch() {
    if (this.selectedLocation && this.selectedLocation.latitude && this.selectedLocation.longitude) {
      this.navCtrl.navigateForward(['./search-hospitals']);
    } else {
      this.translate.get("select_location").subscribe(value => this.uiElementService.presentToast(value));
    }
  }

}
