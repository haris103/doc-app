import { Component, OnInit, Inject } from '@angular/core';
import { NavController, AlertController, Platform } from '@ionic/angular';
import { NavigationExtras } from '@angular/router';
import { APP_CONFIG, AppConfig } from '../app.config';
import { MyEventsService } from '../services/events/my-events.service';
import { UiElementsService } from '../services/common/ui-elements.service';
import { ApiService } from '../services/network/api.service';
import { TranslateService } from '@ngx-translate/core';
import { Facebook } from '@ionic-native/facebook/ngx';
import { GooglePlus } from '@ionic-native/google-plus/ngx';
import { SocialLoginRequest } from 'src/models/sociallogin-request.models';
import { AuthResponse } from 'src/models/auth-response.models';
import { Helper } from 'src/models/helper.models';
import { Constants } from 'src/models/constants.models';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.page.html',
  styleUrls: ['./sign-in.page.scss']
})
export class SignInPage implements OnInit {
  countries: any;
  phoneNumber: string;
  countryCode: string;
  phoneNumberFull: string;
  phoneNumberHint: string;

  constructor(@Inject(APP_CONFIG) public config: AppConfig, private navCtrl: NavController, private myEvent: MyEventsService,
    private uiElementService: UiElementsService, private apiService: ApiService, private translate: TranslateService,
    private alertCtrl: AlertController, private platform: Platform, private facebook: Facebook, private google: GooglePlus) {

  }

  ngOnInit() {
    this.apiService.getCountries().subscribe(res => this.countries = res);
    this.changeHint();
  }

  changeHint() {
    this.phoneNumber = "";
    if (this.countryCode && this.countryCode.length) {
      this.translate.get('enter_phone_number_exluding').subscribe(value => this.phoneNumberHint = (value + " (+" + this.countryCode + ")"));
    } else {
      this.translate.get('enter_phone_number').subscribe(value => this.phoneNumberHint = value);
    }
  }

  alertPhone() {
    if (!this.countryCode || !this.countryCode.length) {
      this.translate.get("select_country").subscribe(value => this.uiElementService.presentToast(value));
      return;
    }
    if (!this.phoneNumber || !this.phoneNumber.length) {
      this.uiElementService.presentToast(this.phoneNumberHint);
      return;
    }
    this.translate.get(['alert_phone', 'no', 'yes']).subscribe(text => {
      this.phoneNumberFull = "+" + this.countryCode + Helper.formatPhone(this.phoneNumber);
      this.alertCtrl.create({
        header: this.phoneNumberFull,
        message: text['alert_phone'],
        buttons: [{
          text: text['no'],
          role: 'cancel',
          handler: () => {
            console.log('Cancel clicked');
          }
        }, {
          text: text['yes'],
          handler: () => {
            this.checkIfExists();
          }
        }]
      }).then(alert => alert.present());
    });
  }

  checkIfExists() {
    this.translate.get('just_moment').subscribe(value => {
      this.uiElementService.presentLoading(value);
      this.apiService.checkUser({ mobile_number: this.phoneNumberFull, role: Constants.ROLE_USER }).subscribe(res => {
        console.log(res);
        this.uiElementService.dismissLoading();

        let navigationExtras: NavigationExtras = { queryParams: { phoneNumberFull: this.phoneNumberFull } };
        this.navCtrl.navigateForward(['./verification'], navigationExtras);
      }, err => {
        console.log(err);
        this.uiElementService.dismissLoading();

        let navigationExtras: NavigationExtras = { queryParams: { code: this.countryCode, phone: this.phoneNumber } };
        this.navCtrl.navigateForward(['./register'], navigationExtras);
      });
    });
  }

  signInFacebook() {
    if (this.platform.is('cordova')) {
      this.translate.get(["logging_facebook", "logging_facebook_err"]).subscribe(values => {
        this.uiElementService.presentLoading(values["logging_facebook"]);
        this.facebook.login(["public_profile", 'email']).then(response => {
          console.log("fb_success", JSON.stringify(response));
          let os = this.platform.is('ios') ? 'ios' : 'android';
          this.verifyUser(new SocialLoginRequest(response.authResponse.accessToken, "facebook", os), null);
        }).catch((error) => {
          console.log("fb_error", error);
          this.uiElementService.presentToast(values["logging_facebook_err"]);
          this.uiElementService.dismissLoading();
        });
      });
    }
  }

  signInGoogle() {
    if (this.platform.is('cordova')) {
      this.translate.get(["logging_google", "logging_google_err"]).subscribe(values => {
        this.uiElementService.presentLoading(values["logging_google"]);
        this.google.login({
          'webClientId': this.config.firebaseConfig.webApplicationId,
          'offline': false,
          'scopes': 'profile email'
        }).then(googleCredential => {
          console.log('google_success', JSON.stringify(googleCredential));

          let os = this.platform.is('ios') ? 'ios' : 'android';
          this.verifyUser(new SocialLoginRequest(googleCredential.idToken, "google", os), (googleCredential.displayName && googleCredential.email) ? { name: googleCredential.displayName, email: googleCredential.email } : null);

        }).catch(err => {
          console.log('google_fail', err);
          this.uiElementService.dismissLoading();
          this.uiElementService.presentToast(values["logging_google_err"]);
        });
      });
    }
  }

  private verifyUser(slr: SocialLoginRequest, nameEmail: { name: string, email: string }) {
    this.translate.get('verifying_user').subscribe(value => {
      this.uiElementService.presentToast(value);
      this.apiService.loginSocial(slr).subscribe(res => {
        this.uiElementService.dismissLoading();
        this.loginSocialSuccess(res);
      }, err => {
        this.uiElementService.dismissLoading();
        console.log(err);
        if (err && err.status && err.status == 404) {
          let navigationExtras: NavigationExtras = { queryParams: nameEmail ? nameEmail : { name: err.error.name, email: err.error.email } };
          this.navCtrl.navigateForward(['./register'], navigationExtras);
        } else {
          this.uiElementService.presentToast(err.error.message);
        }
      });
    });
  }

  private loginSocialSuccess(res: AuthResponse) {
    if (res.user.mobile_verified == 1) {
      Helper.setLoggedInUserResponse(res);
      this.apiService.setupHeaders(res.token);
      this.myEvent.setUserMeData(res.user);
      window.localStorage.removeItem(Constants.KEY_ADDRESS);
      this.myEvent.setAddressData(null);
    } else {
      let navigationExtras: NavigationExtras = { queryParams: { phoneNumberFull: res.user.mobile_number } };
      this.navCtrl.navigateForward(['./verification'], navigationExtras);
    }
  }

}
