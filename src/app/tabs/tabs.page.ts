import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavigationExtras } from '@angular/router';
import { AlertController, NavController } from '@ionic/angular';
import { MyEventsService } from '../services/events/my-events.service';
import { TranslateService } from '@ngx-translate/core';
import { LocationAccuracy } from '@ionic-native/location-accuracy/ngx';
import { Diagnostic } from '@ionic-native/diagnostic/ngx';
import { Helper } from 'src/models/helper.models';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss']
})
export class TabsPage implements OnInit, OnDestroy {
  private subscriptions = new Array<Subscription>();

  constructor(private navCtrl: NavController, private diagnostic: Diagnostic, private translate: TranslateService,
    private myEventsService: MyEventsService, private alertCtrl: AlertController, private locationAccuracy: LocationAccuracy) { }

  ngOnInit() {
    this.subscriptions.push(this.myEventsService.getCustomEventObservable().subscribe(data => {
      if (data == "nav:pick_location") {
        this.alertLocation();
      }
    }));
  }

  ngOnDestroy() {
    for (let sub of this.subscriptions) sub.unsubscribe();
  }

  ionViewDidEnter() {
    let selectedLocation = Helper.getAddressSelected();
    if (selectedLocation == null) this.alertLocation();
  }

  alertLocation() {
    if (Helper.getLoggedInUser() != null) {
      let navigationExtras: NavigationExtras = { state: { pick_location: true } };
      this.navCtrl.navigateForward(['./addresses'], navigationExtras);
    } else {
      this.diagnostic.isLocationEnabled().then((isAvailable) => {
        if (isAvailable) {
          let navigationExtras: NavigationExtras = { state: { pick_location: true } };
          this.navCtrl.navigateForward(['./add-address'], navigationExtras);
        } else {
          this.alertLocationServices();
        }
      }).catch((e) => {
        console.error(e);
        this.alertLocationServices();
      });
    }
  }

  alertLocationServices() {
    this.translate.get(["location_services_title", "location_services_message", "okay", "search_anyway"]).subscribe(values => {
      this.alertCtrl.create({
        header: values["location_services_title"],
        message: values["location_services_message"],
        buttons: [{
          text: values["okay"],
          handler: () => {
            this.locationAccuracy.canRequest().then((canRequest: boolean) => {
              if (canRequest) {
                // the accuracy option will be ignored by iOS
                this.locationAccuracy.request(this.locationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY).then(
                  () => console.log('Request successful'),
                  error => console.log('Error requesting location permissions', error)
                );
              }
            });
          }
        }, {
          text: values["search_anyway"],
          handler: () => {
            let navigationExtras: NavigationExtras = { state: { pick_location: true } };
            this.navCtrl.navigateForward(['./add-address'], navigationExtras);
          }
        }]
      }).then(alert => alert.present());
    });
  }

}
