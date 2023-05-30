import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavigationExtras, ActivatedRoute } from '@angular/router';
import { Product } from 'src/models/product.models';
import { NavController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { UiElementsService } from '../services/common/ui-elements.service';
import { ApiService } from '../services/network/api.service';
import { ECommerceService } from '../services/common/ecommerce.service';
import { Subscription } from 'rxjs';
import { Category } from 'src/models/category.models';
import { ProductVendor } from 'src/models/vendor-product.models';
import { Constants } from 'src/models/constants.models';
import { Helper } from 'src/models/helper.models';
import { Review } from 'src/models/review.models';
import { BaseListResponse } from 'src/models/base-list.models';
import { PhotoViewer } from '@ionic-native/photo-viewer/ngx';
import { Router } from '@angular/router';

@Component({
  selector: 'app-product-info',
  templateUrl: './product-info.page.html',
  styleUrls: ['./product-info.page.scss']
})
export class ProductInfoPage implements OnInit, OnDestroy {
  private subscriptions = new Array<Subscription>();
  tabPinfo: string = "about";
  gaming: string = "1";

  similarProducts = new Array<Product>();
  product = new Product();
  category = new Category();
  reviews = new Array<Review>();
  private infiniteScrollEvent;
  private nextUrl: string;
  isLoading = true;

  constructor(
    //    private route: Router,
    private route: ActivatedRoute,
    private navCtrl: NavController,
    private translate: TranslateService,
    private photoViewer: PhotoViewer,
    private uiElementService: UiElementsService,
    private apiService: ApiService,
    public eComService: ECommerceService) {

    this.route.queryParams.subscribe(params => {
      let product_id = params["product_id"];

      this.translate.get(["loading", "something_wrong"]).subscribe(values => {
        this.uiElementService.presentLoading(values["loading"]);
        this.subscriptions.push(this.apiService.getProductsWithId(product_id).subscribe(res => {
          this.product = res;
          console.log(res);
          this.category = this.product.categories[0];
          this.loadProductsSimilar();
          // this.subscriptions.push(this.apiService.getReviewsProduct(this.product.id, 1).subscribe(res => this.reviewsRes(res), err => this.reviewsErr(err)));
        }, err => {
          console.log("getProductsWithId", err);
          this.uiElementService.dismissLoading();
          this.uiElementService.presentErrorAlert(values["something_wrong"]);
          this.navCtrl.pop();
        }));
      });
    });
  }

  ngOnInit() {
  }

  ngOnDestroy() {
    for (let sub of this.subscriptions) sub.unsubscribe();
    this.uiElementService.dismissLoading();
  }

  // private reviewsRes(res: BaseListResponse) {
  //   this.reviews = this.reviews.concat(res.data);
  //   this.nextUrl = res.links.next;
  //   if (this.infiniteScrollEvent) this.infiniteScrollEvent.target.complete();
  //   this.isLoading = false;
  //   this.uiElementService.dismissLoading();
  // }

  // private reviewsErr(err) {
  //   console.log("productsErr", err);
  //   this.uiElementService.dismissLoading();
  //   if (this.infiniteScrollEvent) this.infiniteScrollEvent.target.complete();
  //   this.isLoading = false;
  // }

  // doInfiniteReviews(event) {
  //   if (this.nextUrl == null) {
  //     event.target.complete();
  //   } else {
  //     this.infiniteScrollEvent = event;
  //     this.subscriptions.push(this.apiService.getURL(this.nextUrl).subscribe(res => {
  //       let locale = Helper.getLocale();
  //       for (let review of res.data) review.created_at = Helper.formatTimestampDate(review.created_at, locale);
  //       this.reviewsRes(res);
  //     }, err => this.reviewsErr(err)));
  //   }
  // }

  toggleFavorite() {
    if (Helper.getLoggedInUser() != null) {
      this.translate.get("just_moment").subscribe(value => {
        this.uiElementService.presentLoading(value);
        this.subscriptions.push(this.apiService.toggleFavoriteProduct(this.product.id).subscribe(res => {
          this.product.is_favourite = !this.product.is_favourite;
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

  loadProductsSimilar() {
    this.subscriptions.push(this.apiService.getProductsWithCategoryId(Constants.SCOPE_ECOMMERCE, this.category.id, 1).subscribe(res => {
      let index = -1;
      for (let i = 0; i < res.data.length; i++) {
        if (res.data[i].id == this.product.id) {
          index = i;
          break;
        }
      }
      if (index != -1) res.data.splice(index, 1);
      // this.similarProducts = this.similarProducts.concat(res.data);
      this.similarProducts = res.data;
      // this.doneAll = (!res.data || !res.data.length);
      // if (this.infiniteScrollEvent) this.infiniteScrollEvent.target.complete();
      // this.isLoading = false;
      this.uiElementService.dismissLoading();
    }, err => {
      console.log("getProductsWithCategoryId", err);
      this.uiElementService.dismissLoading();
      // if (this.infiniteScrollEvent) this.infiniteScrollEvent.target.complete();
      // this.isLoading = false;
    }));
  }

  addProCart(pro: Product) {
    let added = this.eComService.addOrIncrementCartItem(this.eComService.getCartItemFromProduct(pro == null ? this.product : pro));
    this.translate.get((added ? "added_cart" : "incremented_cart")).subscribe(value => this.uiElementService.presentToast(value));
  }

  navCart() {
    this.navCtrl.navigateForward(['./my-cart']);
  }

  navVendorProfile(vendorProfileId) {
    let navigationExtras: NavigationExtras = { queryParams: { vendor_id: vendorProfileId } };
    this.navCtrl.navigateForward(['./seller-profile'], navigationExtras);
  }

  navProDetail(pro) {
    let navigationExtras: NavigationExtras = { queryParams: { product_id: pro.id } };
    this.navCtrl.navigateForward(['./product-info'], navigationExtras);
  }

  private alertLogin() {
    this.translate.get("alert_login_short").subscribe(value => this.uiElementService.presentToast(value));
    this.navCtrl.navigateForward(['./sign-in']);
  }

  bigImage(myImage) {
    this.photoViewer.show(myImage);
  }

  //  product_review() {
  //   this.navCtrl.navigateForward(['./product-reviews']);
  //  }    
  navReviews() {
    let navigationExtras: NavigationExtras = { state: { product: this.product } };
    this.navCtrl.navigateForward(['./product-reviews'], navigationExtras);
  }
}
