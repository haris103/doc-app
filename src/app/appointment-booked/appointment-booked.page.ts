import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-appointment-booked',
  templateUrl: './appointment-booked.page.html',
  styleUrls: ['./appointment-booked.page.scss'],
})
export class AppointmentBookedPage implements OnInit {

  constructor(private navCtrl: NavController) { }

  ngOnInit() {
  }

  navMyAppointments() {
    this.navCtrl.navigateRoot(['./tabs/my_appointments']);
  }
}
