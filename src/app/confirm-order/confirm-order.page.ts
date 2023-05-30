import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ModalController, NavController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { MyAddress } from 'src/models/address.models';
import { Helper } from 'src/models/helper.models';
import { ECommerceService } from '../services/common/ecommerce.service';
import { UiElementsService } from '../services/common/ui-elements.service';
import { ApiService } from '../services/network/api.service';

@Component({
  selector: 'app-confirm-order',
  templateUrl: './confirm-order.page.html',
  styleUrls: ['./confirm-order.page.scss'],
})
export class ConfirmOrderPage implements OnInit {
  private subscriptions = new Array<Subscription>();
  currency_icon: string;
  selectedLocation: MyAddress;

  constructor(private route: Router, private navCtrl: NavController, private modalController: ModalController, private translate: TranslateService,
    public eComService: ECommerceService, private uiElementService: UiElementsService, private apiService: ApiService) {
    
  }

  ngOnInit() {
    this.currency_icon = Helper.getSetting("currency_icon");
    this.selectedLocation = Helper.getAddressSelected();
  }

  select_paymet_method() {
    this.eComService.setupOrderRequestAddress(this.selectedLocation);
    this.navCtrl.navigateForward(['./select-paymet-method']);
  }

}
