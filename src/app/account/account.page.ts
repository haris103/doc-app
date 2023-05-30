import { Component, OnInit, Inject } from '@angular/core';
import { NavController, AlertController } from '@ionic/angular';
import { APP_CONFIG, AppConfig } from '../app.config';
import { User } from 'src/models/user.models';
import { Helper } from 'src/models/helper.models';
import { UiElementsService } from '../services/common/ui-elements.service';
import { TranslateService } from '@ngx-translate/core';
import { MyEventsService } from '../services/events/my-events.service';
import { ECommerceService } from '../services/common/ecommerce.service';
import { ApiService } from '../services/network/api.service';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';

@Component({
  selector: 'app-account',
  templateUrl: './account.page.html',
  styleUrls: ['./account.page.scss']
})
export class AccountPage implements OnInit {

  constructor(@Inject(APP_CONFIG) public config: AppConfig, private navCtrl: NavController, private myEvent: MyEventsService, public apiService: ApiService,
    private uiElementService: UiElementsService, private translate: TranslateService, private alertCtrl: AlertController, private eComService: ECommerceService,
    private inAppBrowser: InAppBrowser) { }

  ngOnInit() {
  }

  viewProfile() {
    if (this.apiService.getUserMe() != null) {
      this.navCtrl.navigateForward(['./my-profile']);
    } else {
      this.alertLogin();
    }
  }
  orderTracking() {
    if (this.apiService.getUserMe() != null) {
      this.navCtrl.navigateForward(['./order-tracking']);
    } else {
      this.alertLogin();
    }
  }
  myAddress() {
    if (this.apiService.getUserMe() != null) {
      this.navCtrl.navigateForward(['./addresses']);
    } else {
      this.alertLogin();
    }
  }
  pillReminders() {
    if (this.apiService.getUserMe() != null) {
      this.navCtrl.navigateForward(['./pill-reminders']);
    } else {
      this.alertLogin();
    }
  }
  orders() {
    if (this.apiService.getUserMe() != null) {
      this.navCtrl.navigateForward(['./orders']);
    } else {
      this.alertLogin();
    }
  }
  contactUs() {
    if (this.apiService.getUserMe() != null) {
      this.navCtrl.navigateForward(['./contact-us']);
    } else {
      this.alertLogin();
    }
  }
  savedItems() {
    if (this.apiService.getUserMe() != null) {
      this.navCtrl.navigateForward(['./saved-items']);
    } else {
      this.alertLogin();
    }
  }
  termsConditions() {
    this.navCtrl.navigateForward(['./tnc']);
  }
  faqs() {
    this.navCtrl.navigateForward(['./faqs']);
  }
  wallet() {
    this.navCtrl.navigateForward(['./wallet']);
  }
  logout() {
    this.translate.get(["logout_title", "logout_message", "no", "yes"]).subscribe(values => {
      this.alertCtrl.create({
        header: values["logout_title"],
        message: values["logout_message"],
        buttons: [{
          text: values["no"],
          handler: () => { }
        }, {
          text: values["yes"],
          handler: () => {
            this.eComService.clearCart();
            Helper.setLoggedInUserResponse(null);
            this.myEvent.setUserMeData(null);
            this.myEvent.setAddressData(null);
          }
        }]
      }).then(alert => alert.present());
    });
  }
  changeLanguage() {
    this.navCtrl.navigateForward(['./change-language']);
  }
 
  alertLogin() {
    this.translate.get("alert_login_short").subscribe(value => this.uiElementService.presentToast(value));
    this.navCtrl.navigateForward(['./sign-in']);
  }

  buyAppAction() {
    this.translate.get("just_moment").subscribe(value => {
      this.uiElementService.presentLoading(value);
      this.apiService.getContactLink().subscribe(res => {
        this.uiElementService.dismissLoading();
        this.inAppBrowser.create((res.link ? res.link : "https://bit.ly/cc_DoctoWorld"), "_system");
      }, err => {
        console.log("getContactLink", err);
        this.uiElementService.dismissLoading();
        this.inAppBrowser.create("https://bit.ly/cc_DoctoWorld", "_system");
      });
    });
  }

  developed_by() {
    this.inAppBrowser.create("https://verbosetechlabs.com/", "_system");
  }
}
