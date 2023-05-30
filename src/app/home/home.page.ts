import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavigationExtras } from '@angular/router';
import { NavController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { MyEventsService } from '../services/events/my-events.service';
import { UiElementsService } from '../services/common/ui-elements.service';
import { ApiService } from '../services/network/api.service';
import { ECommerceService } from '../services/common/ecommerce.service';
import { Subscription } from 'rxjs';
import { MyAddress } from 'src/models/address.models';
import { Helper } from 'src/models/helper.models';
import { Constants } from 'src/models/constants.models';
import { Category } from 'src/models/category.models';
import { Vendor } from 'src/models/vendor.models';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss']
})
export class HomePage implements OnInit, OnDestroy {
  location: string = "home";
  private subscriptions = new Array<Subscription>();
  selectedLocation: MyAddress;
  vendorsArray = new Array<{ vendors: Array<Vendor>; }>();
  categories: Array<Category>;
  banners: Array<Category>;
  cartCount: number;
  pageNo: number;
  private isLoading = true;
  private loadedCount = 0;

  constructor(private navCtrl: NavController, private translate: TranslateService, private myEventsService: MyEventsService,
    private uiElementService: UiElementsService, public apiService: ApiService, public eComService: ECommerceService) { }

  ngOnInit() {
    this.selectedLocation = Helper.getAddressSelected();
    this.subscriptions.push(this.myEventsService.getAddressObservable().subscribe(selectedLocationNew => {
      let changed: boolean = !this.selectedLocation || !selectedLocationNew ||
        (this.selectedLocation.latitude != selectedLocationNew.latitude || this.selectedLocation.longitude != selectedLocationNew.longitude);
      this.selectedLocation = selectedLocationNew;
      if (changed) {
        this.doRefresh();
      }
    }));
    this.doRefresh();
  }

  ngOnDestroy() {
    for (let sub of this.subscriptions) sub.unsubscribe();
    this.uiElementService.dismissLoading();
  }

  private doRefresh() {
    this.pageNo = 1;
    this.vendorsArray = [];
    this.banners = [];
    this.loadedCount = 0;
    this.translate.get("loading").subscribe(value => {
      this.uiElementService.presentLoading(value);
      this.loadCategories();
    });
  }

  pickLocation() {
    this.myEventsService.setCustomEventData("nav:pick_location");
  }

  // alertLogin() {
  //   this.translate.get("alert_login_short").subscribe(value => this.uiElementService.presentToast(value));
  //   this.navCtrl.navigateForward(['./phone-number']);
  // }

  loadCategories() {
    this.subscriptions.push(this.apiService.getCategoriesParents(Constants.SCOPE_ECOMMERCE).subscribe(res => {
      this.categories = res;
      // this.loadedCount = 0;
      // if (res && res.length && this.selectedLocation) {
      //   for (let cat of res) this.loadProductsByCatId(cat);
      if (this.selectedLocation && this.selectedLocation.latitude && this.selectedLocation.longitude) {
        this.loadProductsByCatId();
      } else {
        this.isLoading = false;
        this.uiElementService.dismissLoading();
      }
    }, err => {
      console.log("getCategoriesParents", err);
      this.isLoading = false;
      this.uiElementService.dismissLoading();
    }));
  }

  loadProductsByCatId() {
    this.isLoading = true;
    this.subscriptions.push(this.apiService.getCategoriesVendors(this.selectedLocation).subscribe((res: any) => {
      if (res.data && res.data.length) this.vendorsArray.push({ vendors: res.data });
      console.log(this.vendorsArray)
      this.isLoading = false;
      this.uiElementService.dismissLoading();
      this.checkAndLoadBanners();
    }, err => {
      console.log("getProductsWithCategoryId", err);
      this.isLoading = false;
      this.uiElementService.dismissLoading();
      this.checkAndLoadBanners();
    }));
  }

  private checkAndLoadBanners() {
    // this.loadedCount += 1;
    if (!this.haveNothingToShow()) this.subscriptions.push(this.apiService.getBanners(Constants.SCOPE_ECOMMERCE).subscribe(res => this.banners = res, err => console.log("getBanners", err)));
  }

  haveNothingToShow(): boolean {
    let toReturn = true;
    if (this.vendorsArray) {
      for (let catPros of this.vendorsArray) {
        if (catPros && catPros.vendors.length) {
          toReturn = false;
          break;
        }
      }
    }
    return this.isLoading ? false : toReturn;
  }


  subCategories(cat: Category) {
    if (this.selectedLocation) {
      let navigationExtras: NavigationExtras = { state: { categories: this.categories, category_id: cat.id } };
      this.navCtrl.navigateForward(['./categories'], navigationExtras);
    } else {
      this.translate.get("select_location").subscribe(value => this.uiElementService.presentToast(value));
    }
  }

  viewAllSubCategories() {
    if (this.selectedLocation && this.selectedLocation.latitude && this.selectedLocation.longitude) {
      this.navCtrl.navigateForward(['./product-list']);
    } else {
      this.translate.get("select_location").subscribe(value => this.uiElementService.presentToast(value));
    }
  }

  navVenDetail(vendor: Vendor) {
    if (this.selectedLocation && this.selectedLocation.latitude && this.selectedLocation.longitude) {
      let navigationExtras: NavigationExtras = { queryParams: { vendor_id: vendor.id } };
      this.navCtrl.navigateForward(['./seller-profile'], navigationExtras);
    } else {
      this.translate.get("select_location").subscribe(value => this.uiElementService.presentToast(value));
    }
  }

  offers() {
    if (this.selectedLocation && this.selectedLocation.latitude && this.selectedLocation.longitude) {
      this.navCtrl.navigateForward(['./offers']);
    } else {
      this.translate.get("select_location").subscribe(value => this.uiElementService.presentToast(value));
    }
  }

  cart() {
    this.navCtrl.navigateForward(['./my-cart']);
    // if (this.selectedLocation && this.selectedLocation.latitude && this.selectedLocation.longitude) {
    //   this.navCtrl.navigateForward(['./my-cart']);
    // } else {
    //   this.translate.get("select_location").subscribe(value => this.uiElementService.presentToast(value));
    // }
  }

  navSearch() {
    if (this.selectedLocation && this.selectedLocation.latitude && this.selectedLocation.longitude) {
      this.navCtrl.navigateForward(['./search-products']);
    } else {
      this.translate.get("select_location").subscribe(value => this.uiElementService.presentToast(value));
    }
  }

}
