import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationExtras, ActivatedRoute } from '@angular/router';
import { NavController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { UiElementsService } from '../services/common/ui-elements.service';
import { ApiService } from '../services/network/api.service';
import { Subscription } from 'rxjs';
import { Product } from 'src/models/product.models';
import { ECommerceService } from '../services/common/ecommerce.service';
import { Vendor } from 'src/models/vendor.models';

@Component({
  selector: 'app-seller-profile',
  templateUrl: './seller-profile.page.html',
  styleUrls: ['./seller-profile.page.scss']
})
export class SellerProfilePage implements OnInit, OnDestroy {
  private subscriptions = new Array<Subscription>();
  private doneAll = false;
  private infiniteScrollEvent;
  private pageNo = 1;
  vendorProfile = new Vendor();
  products = new Array<Product>();
  isLoading = true;

  constructor(private router: Router, private navCtrl: NavController, private translate: TranslateService, private route: ActivatedRoute,
    private uiElementService: UiElementsService, private apiService: ApiService, public eComService: ECommerceService) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      let vendor_id = params["vendor_id"];
      this.translate.get("loading").subscribe(value => {
        this.uiElementService.presentLoading(value);
        this.subscriptions.push(this.apiService.getVendorById(vendor_id).subscribe(res => {
          this.vendorProfile = res;
          this.loadProductsVendor();
        }, err => {
          this.uiElementService.dismissLoading();
          this.navCtrl.pop();
        }));
      });
    });
  }

  ngOnDestroy() {
    for (let sub of this.subscriptions) sub.unsubscribe();
    this.uiElementService.dismissLoading();
  }

  loadProductsVendor() {
    this.subscriptions.push(this.apiService.getProductsWithVendorId(this.vendorProfile.id, this.pageNo).subscribe(res => {
      this.products = this.products.concat(res.data);
      this.doneAll = (!res.data || !res.data.length);
      if (this.infiniteScrollEvent) this.infiniteScrollEvent.target.complete();
      this.isLoading = false;
      this.uiElementService.dismissLoading();
    }, err => {
      console.log("getProductsWithCategoryId", err);
      this.uiElementService.dismissLoading();
      if (this.infiniteScrollEvent) this.infiniteScrollEvent.target.complete();
      this.isLoading = false;
    }));
  }

  doInfiniteProducts(event) {
    if (this.doneAll) {
      event.target.complete();
    } else {
      this.infiniteScrollEvent = event;
      this.pageNo = this.pageNo + 1;
      this.loadProductsVendor();
    }
  }

  navProDetail(pro: Product) {
    let navigationExtras: NavigationExtras = { queryParams: { product_id: pro.id } };
    this.navCtrl.navigateForward(['./product-info'], navigationExtras);
  }

  addProCart(pro: Product) {
    let added = this.eComService.addOrIncrementCartItem(this.eComService.getCartItemFromProduct(pro));
    this.translate.get((added ? "added_cart" : "incremented_cart")).subscribe(value => this.uiElementService.presentToast(value));
  }

  navCart() {
    this.navCtrl.navigateForward(['./my-cart']);
  }

}
