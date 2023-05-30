import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavController } from '@ionic/angular';
import { Router } from '@angular/router';
import { UiElementsService } from '../services/common/ui-elements.service';
import { TranslateService } from '@ngx-translate/core';
import { ApiService } from '../services/network/api.service';
import { Doctor } from 'src/models/doctor.models';
import { Subscription } from 'rxjs';
import * as moment from 'moment';

@Component({
  selector: 'app-appointment-book',
  templateUrl: './appointment-book.page.html',
  styleUrls: ['./appointment-book.page.scss']
})
export class AppointmentBookPage implements OnInit, OnDestroy {
  private subscriptions = new Array<Subscription>();
  private use24HourFormat = true;
  private minutesApart = 30;

  weekDays = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  doctor: Doctor;
  dates: Array<Date> = [];
  dateSelected: Date;
  timeSelected: string;
  availabilityTimes = new Array<{ time: string, timeValue: string }>();

  appointmentReason: string;

  constructor(private router: Router, private navCtrl: NavController, private uiElementService: UiElementsService,
    private translate: TranslateService, private apiService: ApiService) { }

  ngOnInit() {
    if (this.router.getCurrentNavigation().extras.state) this.doctor = this.router.getCurrentNavigation().extras.state.doctor;

    for (let i = 0; i < 14; i++) {
      let d = new Date();
      d.setDate(d.getDate() + i);
      this.dates.push(d);
    }
    this.markSelected(this.dates[0]);
  }

  ngOnDestroy() {
    for (let sub of this.subscriptions) sub.unsubscribe();
    this.uiElementService.dismissLoading();
  }

  markSelected(date: Date) {
    this.dateSelected = date;

    this.availabilityTimes = new Array<{ time: string, timeValue: string }>();
    if (this.doctor.availability[date.getDay()].selected) {
      let fromSplit = this.doctor.availability[date.getDay()].from.split(":");
      let toSplit = this.doctor.availability[date.getDay()].to.split(":");
      let dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), Number(fromSplit[0]), Number(fromSplit[1]), 0);
      let dateEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), Number(toSplit[0]), Number(toSplit[1]), 0);

      let time: number = dateStart.getTime();
      while (time <= dateEnd.getTime()) {
        let dateIn = new Date(time);
        this.availabilityTimes.push({ time: moment(dateIn).format("HH:mm"), timeValue: moment(dateIn).format(this.use24HourFormat ? "HH:mm" : "hh:mm a") });
        time = time + (this.minutesApart * 60000);
      }

    }
  }

  createAppointment() {
    if (!this.dateSelected) {
      this.translate.get("err_field_date_select").subscribe(value => this.uiElementService.presentToast(value));
    } else if (!this.timeSelected) {
      this.translate.get("err_field_time_select").subscribe(value => this.uiElementService.presentToast(value));
    } else if (!this.appointmentReason || !this.appointmentReason.length) {
      this.translate.get("err_field_ap_reason").subscribe(value => this.uiElementService.presentToast(value));
    } else {
      let dateFormatted = moment(this.dateSelected).format("YYYY-MM-DD");
      let momentSelected = moment(dateFormatted + " " + this.timeSelected + ":00");
      if (momentSelected > moment()) {
        let apr = {
          amount: this.doctor.consultancy_fee,
          date: dateFormatted,
          time_from: this.timeSelected,
          time_to: momentSelected.add(30, "m").format("HH:mm"),
          address: this.doctor.hospitalClosest.address,
          latitude: this.doctor.hospitalClosest.latitude,
          longitude: this.doctor.hospitalClosest.longitude,
          meta: JSON.stringify({ reason: this.appointmentReason })
        };
        this.translate.get(["ap_create_ing", "ap_create_ed", "ap_create_same_time", "ap_create_fail"]).subscribe(values => {
          this.uiElementService.presentLoading(values["ap_create_ing"]);
          this.subscriptions.push(this.apiService.createAppointment(this.doctor.id, apr).subscribe(res => {
            this.uiElementService.presentToast(values["ap_create_ed"]);
            this.navCtrl.navigateRoot(['./appointment-booked']);
          }, err => {
            console.log("createAppointment", err);
            this.uiElementService.dismissLoading();
            if (err.status == 422) this.uiElementService.presentToast(values["ap_create_same_time"]); else this.uiElementService.presentToast(values["ap_create_fail"]);
          }));
        });
      } else {
        this.translate.get("err_field_timeslot_passed").subscribe(value => this.uiElementService.presentToast(value));
      }
    }
  }

}