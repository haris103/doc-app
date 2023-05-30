import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationExtras } from '@angular/router';
import { ModalController, NavController } from '@ionic/angular';
import { FilterPage } from '../filter/filter.page';
import { TranslateService } from '@ngx-translate/core';
import { UiElementsService } from '../services/common/ui-elements.service';
import { ApiService } from '../services/network/api.service';
import { Subscription } from 'rxjs';
import { Category } from 'src/models/category.models';
import { Doctor } from 'src/models/doctor.models';
import { Helper } from 'src/models/helper.models';
import { MyAddress } from 'src/models/address.models';
import { Constants } from 'src/models/constants.models';

@Component({
  selector: 'app-list-of-doctors',
  templateUrl: './list-of-doctors.page.html',
  styleUrls: ['./list-of-doctors.page.scss']
})
export class ListOfDoctorsPage implements OnInit, OnDestroy {
  private subscriptions = new Array<Subscription>();
  private doneAll = false;
  private infiniteScrollEvent;
  private pageNo = 1;
  isLoading = true;
  category: Category;
  doctors = new Array<Doctor>();
  currencyIcon: string;
  private scope: string;
  private selectedLocationNew: MyAddress;

  constructor(private router: Router, private navCtrl: NavController, private translate: TranslateService, private modalController: ModalController,
    private uiElementService: UiElementsService, private apiService: ApiService) { }

  ngOnInit() {
    this.currencyIcon = Helper.getSetting("currency_icon");
    if (this.router.getCurrentNavigation().extras.state) {
      this.category = this.router.getCurrentNavigation().extras.state.category;
      this.scope = this.router.getCurrentNavigation().extras.state.scope;
    }
    this.selectedLocationNew = Helper.getAddressSelected();
    this.translate.get("loading").subscribe(value => {
      this.uiElementService.presentLoading(value);
      this.loadDoctors();
    });
  }

  ngOnDestroy() {
    for (let sub of this.subscriptions) sub.unsubscribe();
    this.uiElementService.dismissLoading();
  }

  loadDoctors() {
    this.subscriptions.push(this.apiService.getDoctorsWithScopeId(this.category ? this.category.id : null, this.scope, this.selectedLocationNew, this.pageNo).subscribe(res => {
      this.doctors = this.doctors.concat(res.data);
      this.doneAll = (!res.data || !res.data.length);
      if (this.infiniteScrollEvent) this.infiniteScrollEvent.target.complete();
      this.isLoading = false;
      this.uiElementService.dismissLoading();
    }, err => {
      console.log("getDoctorsWithCategoryId", err);
      this.uiElementService.dismissLoading();
      if (this.infiniteScrollEvent) this.infiniteScrollEvent.target.complete();
      this.isLoading = false;
    }));
  }

  doInfiniteDoctors(event) {
    if (this.doneAll) {
      event.target.complete();
    } else {
      this.infiniteScrollEvent = event;
      this.pageNo = this.pageNo + 1;
      this.loadDoctors();
    }
  }

  navMapView() {
    if (this.doctors && this.doctors.length) {
      let navigationExtras: NavigationExtras = { state: { doctors: this.doctors } };
      this.navCtrl.navigateForward(['./map-view'], navigationExtras);
    }
  }

  navDocProfile(doc) {
    window.localStorage.setItem(Constants.TEMP_DOCTOR, JSON.stringify(doc));
    this.navCtrl.navigateForward(['./doctor-profile']);
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

  private alertLogin() {
    this.translate.get("alert_login_short").subscribe(value => this.uiElementService.presentToast(value));
    this.navCtrl.navigateForward(['./sign-in']);
  }

  filter() {
    this.modalController.create({ component: FilterPage }).then((modalElement) => {
      modalElement.present();
    });
  }

}
