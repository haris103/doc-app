import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationExtras } from '@angular/router';
import { Category } from 'src/models/category.models';
import { NavController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { UiElementsService } from '../services/common/ui-elements.service';
import { ApiService } from '../services/network/api.service';
import { Subscription } from 'rxjs';
import { Product } from 'src/models/product.models';
import { ECommerceService } from '../services/common/ecommerce.service';
import { Constants } from 'src/models/constants.models';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.page.html',
  styleUrls: ['./product-list.page.scss']
})
export class ProductListPage implements OnInit, OnDestroy {
  private subscriptions = new Array<Subscription>();
  private doneAll = false;
  private infiniteScrollEvent;
  private pageNo = 1;
  category: Category;
  products = new Array<Product>();
  isLoading = true;

  constructor(private router: Router, private navCtrl: NavController, private translate: TranslateService,
    private uiElementService: UiElementsService, private apiService: ApiService, public eComService: ECommerceService) {
    console.log("getCurrentNavigation", this.router.getCurrentNavigation().extras.state);
    if (this.router.getCurrentNavigation().extras.state) {
      this.category = this.router.getCurrentNavigation().extras.state.category;
    }
    // if (this.category != null) {
    this.translate.get("loading").subscribe(value => {
      this.uiElementService.presentLoading(value);
      this.loadProducts();
    });
    // }
  }

  ngOnInit() {
  }

  ngOnDestroy() {
    for (let sub of this.subscriptions) sub.unsubscribe();
    this.uiElementService.dismissLoading();
  }

  loadProducts() {
    this.subscriptions.push(this.apiService.getProductsWithCategoryId(Constants.SCOPE_ECOMMERCE, this.category ? this.category.id : null, this.pageNo).subscribe(res => {
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
      this.loadProducts();
    }
  }

  addProCart(pro: Product) {
    let added = this.eComService.addOrIncrementCartItem(this.eComService.getCartItemFromProduct(pro));
    this.translate.get((added ? "added_cart" : "incremented_cart")).subscribe(value => this.uiElementService.presentToast(value));
  }

  navCart() {
    this.navCtrl.navigateForward(['./my-cart']);
  }

  navProDetail(pro) {
    let navigationExtras: NavigationExtras = { queryParams: { product_id: pro.id } };
    this.navCtrl.navigateForward(['./product-info'], navigationExtras);
  }

}
