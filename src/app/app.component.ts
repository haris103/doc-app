import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { Platform, NavController, IonRouterOutlet, ModalController } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { TranslateService } from '@ngx-translate/core';
import { Constants } from 'src/models/constants.models';
import { APP_CONFIG, AppConfig } from './app.config';
import { MyEventsService } from './services/events/my-events.service';
import { Helper } from 'src/models/helper.models';
import { OneSignal } from '@ionic-native/onesignal/ngx';
import { ApiService } from './services/network/api.service';
import { ECommerceService } from './services/common/ecommerce.service';
import { User } from 'src/models/user.models';
import { Device } from '@ionic-native/device/ngx';
import * as firebase from 'firebase';
import { VtPopupPage } from './vt-popup/vt-popup.page';
import { UiElementsService } from './services/common/ui-elements.service';
declare var Agora;

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class AppComponent implements OnInit {
  @ViewChild(IonRouterOutlet, { static: false }) routerOutlets: IonRouterOutlet;
  rtlSide = "left";
  userMe: User;

  constructor(@Inject(APP_CONFIG) public config: AppConfig, private uiElementService: UiElementsService,
    private platform: Platform, private apiService: ApiService,
    private splashScreen: SplashScreen, private modalController: ModalController,
    private statusBar: StatusBar, private oneSignal: OneSignal, private eComService: ECommerceService,
    private translate: TranslateService, private device: Device,
    private navCtrl: NavController, private myEvent: MyEventsService) {
    //Helper.setAddressSelected(null);
  }

  ngOnInit() {
    if (this.config.demoMode && this.platform.is('cordova')) setTimeout(() => this.presentModal(), 15000);
    this.initializeApp();
    this.myEvent.getLanguageObservable().subscribe(value => {
      this.apiService.setupHeaders();
      this.navCtrl.navigateRoot(['./']);
      this.globalize(value);
    });
    this.myEvent.getUserMeObservable().subscribe(user => {
      this.refreshSettings();
      this.apiService.setUserMe(user);
      this.userMe = this.apiService.getUserMe();
      if (this.userMe == null) this.apiService.setupHeaders(null);
      this.navCtrl.navigateRoot(['./']);
      if (this.platform.is('cordova')) {
        if (this.userMe) {
          this.updatePlayerId();
        } else {
          //logout of Agora SDK
          Agora.logout((res) => {
            console.log("Agora-logout", res);
          }, (err) => {
            console.log("Agora-logout", err);
          });
        }
      }
    });
  }

  async presentModal() {
    const modal = await this.modalController.create({
      component: VtPopupPage,
    });
    return await modal.present();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.statusBar.styleDefault();
      this.splashScreen.show();

      firebase.initializeApp({
        apiKey: this.config.firebaseConfig.apiKey,
        authDomain: this.config.firebaseConfig.authDomain,
        databaseURL: this.config.firebaseConfig.databaseURL,
        projectId: this.config.firebaseConfig.projectId,
        storageBucket: this.config.firebaseConfig.storageBucket,
        messagingSenderId: this.config.firebaseConfig.messagingSenderId
      });
      if (this.platform.is('cordova')) this.initOneSignal();
      this.globalize(Helper.getLanguageDefault());

      this.apiService.setUuidAndPlatform(this.device.uuid, this.device.platform);
      this.refreshSettings();

      this.apiService.setUserMe(Helper.getLoggedInUser());
      this.userMe = this.apiService.getUserMe();
      this.navCtrl.navigateRoot(['./']);
      setTimeout(() => {
        this.splashScreen.hide();
        if (this.platform.is('cordova') && this.userMe) this.updatePlayerId();
        this.globalize(Helper.getLanguageDefault());
      }, 3000);

      this.platform.backButton.subscribe(() => {
        if (this.routerOutlets && this.routerOutlets.canGoBack()) {
          this.routerOutlets.pop();
        } else {
          let currPathName = window.location.pathname;
          if (currPathName && currPathName.includes("tabs")) {
            navigator['app'].exitApp();
          } else {
            this.navCtrl.navigateRoot(['./tabs']);
          }
        }
      });
    });
  }

  globalize(languagePriority) {
    this.translate.setDefaultLang("en");
    let defaultLangCode = this.config.availableLanguages[0].code;
    this.translate.use(languagePriority && languagePriority.length ? languagePriority : defaultLangCode);
    this.setDirectionAccordingly(languagePriority && languagePriority.length ? languagePriority : defaultLangCode);
    Helper.setLocale(languagePriority && languagePriority.length ? languagePriority : defaultLangCode);
    Helper.setLanguageDefault(languagePriority && languagePriority.length ? languagePriority : defaultLangCode);
  }

  setDirectionAccordingly(lang: string) {
    switch (lang) {
      case 'ar': {
        this.rtlSide = "rtl";
        break;
      }
      default: {
        this.rtlSide = "ltr";
        break;
      }
    }
  }

  initOneSignal() {
    if (this.config.oneSignalAppId && this.config.oneSignalAppId.length && this.config.oneSignalGPSenderId && this.config.oneSignalGPSenderId.length) {
      this.oneSignal.startInit(this.config.oneSignalAppId, this.config.oneSignalGPSenderId);
      this.oneSignal.inFocusDisplaying(this.oneSignal.OSInFocusDisplayOption.Notification);
      this.oneSignal.handleNotificationReceived().subscribe((data) => {
        console.log(data);
        Helper.saveNotification((data.payload.additionalData && data.payload.additionalData.title) ? data.payload.additionalData.title : data.payload.title,
          (data.payload.additionalData && data.payload.additionalData.body) ? data.payload.additionalData.body : data.payload.body,
          String(new Date().getTime()));
        let noti_ids_processed: Array<string> = JSON.parse(window.localStorage.getItem("noti_ids_processed"));
        if (!noti_ids_processed) noti_ids_processed = new Array<string>();
        noti_ids_processed.push(data.payload.notificationID);
        window.localStorage.setItem("noti_ids_processed", JSON.stringify(noti_ids_processed));
      });
      this.oneSignal.handleNotificationOpened().subscribe((data) => {
        let noti_ids_processed: Array<string> = JSON.parse(window.localStorage.getItem("noti_ids_processed"));
        if (!noti_ids_processed) noti_ids_processed = new Array<string>();
        let index = noti_ids_processed.indexOf(data.notification.payload.notificationID);
        if (index == -1) {
          Helper.saveNotification((data.notification.payload.additionalData && data.notification.payload.additionalData.title) ? data.notification.payload.additionalData.title : data.notification.payload.title,
            (data.notification.payload.additionalData && data.notification.payload.additionalData.body) ? data.notification.payload.additionalData.body : data.notification.payload.body,
            String(new Date().getTime()));
        } else {
          noti_ids_processed.splice(index, 1);
          window.localStorage.setItem("noti_ids_processed", JSON.stringify(noti_ids_processed));
        }
      });
      this.oneSignal.endInit();
    }
  }

  updatePlayerId() {
    //initialize Agora SDK with Agora App ID
    if (this.platform.is("cordova") && this.config.agoraVideoConfig.enableAgoraVideo) {
      Agora.initAgora(this.config.agoraVideoConfig.agoraAppId, (res) => {
        console.log("Agora-initAgora", res);

        //login to Agora sdk.
        Agora.loginUser(null, this.userMe.id, (res) => {
          console.log("Agora-loginUser", res);
        }, (err) => {
          console.log("Agora-loginUser", err);
        });

      }, (err) => {
        console.log("Agora-initAgora", err);
        this.uiElementService.presentToast("Unable to instantiate Agora")
      });
    }

    this.oneSignal.getIds().then((id) => {
      if (id && id.userId) {
        let defaultLang = Helper.getLanguageDefault();

        this.apiService.updateUser({
          notification: "{\"" + Constants.ROLE_USER + "\":\"" + id.userId + "\"}",
          language: (defaultLang && defaultLang.length) ? defaultLang : this.config.availableLanguages[0].code
        }).subscribe(res => console.log('updateUser', res), err => console.log('updateUser', err));

        firebase.database().ref(Constants.REF_USERS_FCM_IDS).child((this.userMe.id + Constants.ROLE_USER)).set(id.userId);
      }
    });
  }

  refreshSettings() {
    this.apiService.getSettings().subscribe(res => { console.log('getSettings', res); Helper.setSettings(res); this.apiService.reloadSetting(); this.eComService.initialize(); }, err => console.log('getSettings', err));
  }

}