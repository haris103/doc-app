import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { UiElementsService } from '../services/common/ui-elements.service';
import { ApiService } from '../services/network/api.service';
import { ECommerceService } from '../services/common/ecommerce.service';
import { Subscription } from 'rxjs';
import { PaymentMethod } from 'src/models/payment-method.models';
import { Helper } from 'src/models/helper.models';

@Component({
  selector: 'app-select-paymet-method',
  templateUrl: './select-paymet-method.page.html',
  styleUrls: ['./select-paymet-method.page.scss']
})
export class SelectPaymetMethodPage implements OnInit, OnDestroy {
  private subscriptions = new Array<Subscription>();
  currency_icon: string;
  paymentMethods = new Array<PaymentMethod>();
  paymentMethoIdSelected = -1;
  fabAction = false;

  constructor(private navCtrl: NavController, private translate: TranslateService,
    private uiElementService: UiElementsService, private apiService: ApiService, public eComService: ECommerceService) {
    this.translate.get("loading").subscribe(value => {
      this.uiElementService.presentLoading(value);
      this.subscriptions.push(this.apiService.getPaymentMethods().subscribe(res => {
        this.paymentMethods = res;
        this.uiElementService.dismissLoading();
      }, err => {
        console.log("getPaymentMethods", err);
        this.uiElementService.dismissLoading();
      }));
    });
  }

  ngOnInit() {
    this.currency_icon = Helper.getSetting("currency_icon");
  }

  ngOnDestroy() {
    for (let sub of this.subscriptions) sub.unsubscribe();
    this.uiElementService.dismissLoading();
  }

  onPaymentMethodSelected(event) {
    if (event.detail && event.detail.value) {
      this.paymentMethoIdSelected = event.detail.value;
    }
  }

  placeOrder() {
    let selectedPaymentMethod = this.getSelectedPaymentMethod();
    if (selectedPaymentMethod != null) {
      this.eComService.setupOrderRequestPaymentMethod(selectedPaymentMethod);

      let orderRequest = this.eComService.getOrderRequest();
      this.translate.get(["order_placing", "order_placed", "order_place_err"]).subscribe(values => {
        this.uiElementService.presentLoading(values["order_placing"]);

        this.apiService.createOrder(orderRequest).subscribe(res => {
          this.uiElementService.dismissLoading();
          this.uiElementService.presentToast(values["order_placed"]);
          this.eComService.clearCart();
          this.navCtrl.navigateRoot(['./order-placed']);
        }, err => {
          console.log("createOrder", err);
          this.uiElementService.dismissLoading();
          this.uiElementService.presentToast(values["order_place_err"]);
        });
      });
    } else {
      this.translate.get("select_payment_method").subscribe(value => this.uiElementService.presentToast(value));
    }
  }

  getSelectedPaymentMethod(): PaymentMethod {
    let toReturn = null;
    for (let pm of this.paymentMethods) if (this.paymentMethoIdSelected == pm.id) { toReturn = pm; break; }
    return toReturn;
  }

  toggleFab() {
    this.fabAction = !this.fabAction;
  }

}
