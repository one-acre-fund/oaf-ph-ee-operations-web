/** Angular Imports */
import { Component, OnInit } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, UntypedFormControl, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

/** Custom Services */
import { UsersService } from '../users.service';

/** Custom Validators */
import { confirmPasswordValidator } from '../../login/reset-password/confirm-password.validator';

/**
 * Create user component.
 */
@Component({
  selector: 'mifosx-create-user',
  templateUrl: './create-user.component.html',
  styleUrls: ['./create-user.component.scss']
})
export class CreateUserComponent implements OnInit {

  /** User form. */
  userForm: UntypedFormGroup;
  /** Offices data. */
  officesData: any;
  /** Roles data. */
  rolesData: any;
  /** Staff data. */
  staffData: any;

  /**
   * Retrieves the offices and roles data from `resolve`.
   * @param {FormBuilder} formBuilder Form Builder.
   * @param {UsersService} UsersService Users Service.
   * @param {ActivatedRoute} route Activated Route.
   * @param {Router} router Router for navigation.
   */
  constructor(private formBuilder: UntypedFormBuilder,
    private usersService: UsersService,
    private route: ActivatedRoute,
    private router: Router) {
    this.route.data.subscribe((data: {
      usersTemplate: any
    }) => {
      this.officesData = [];
      this.rolesData = data.usersTemplate;
    });
  }

  /**
   * Creates the user form, sets the staff data and conditional controls of the user form.
   */
  ngOnInit() {
    this.createUserForm();
    this.setStaffData();
    this.setConditionalControls();
  }

  /**
   * Creates the user form.
   */
  createUserForm() {
    this.userForm = this.formBuilder.group({
      'username': ['', Validators.required],
      'email': ['', [Validators.required, Validators.email]],
      'firstname': ['', [Validators.required, Validators.pattern('(^[A-z]).*')]],
      'lastname': ['', [Validators.required, Validators.pattern('(^[A-z]).*')]],
      'sendPasswordToEmail': [true],
      'passwordNeverExpires': [false],
      'officeId': [undefined],
      'staffId': [undefined],
      'roles': ['', Validators.required]
    }, { validator: confirmPasswordValidator });
  }

  /**
   * Sets the staff data each time the user selects a new office
   */
  setStaffData() {
    this.userForm.get('officeId').valueChanges.subscribe((officeId: string) => {
      this.staffData = [];
      this.usersService.getStaff(officeId).subscribe((staff: any) => {
        this.staffData = staff;
      });
    });
  }

  /**
   * Sets the conditional controls of the user form
   */
  setConditionalControls() {
    this.userForm.get('sendPasswordToEmail').valueChanges.subscribe((sendPasswordToEmail: boolean) => {
      if (sendPasswordToEmail) {
        this.userForm.removeControl('password');
        this.userForm.removeControl('repeatPassword');
        this.userForm.get('email').setValidators([Validators.required, Validators.email]);
      } else {
        this.userForm.addControl('password', new UntypedFormControl('', Validators.required));
        this.userForm.addControl('repeatPassword', new UntypedFormControl('', Validators.required));
        this.userForm.get('email').setValidators([Validators.email]);
      }
      this.userForm.get('email').updateValueAndValidity();
    });
  }

  /**
   * Submits the user form and creates user,
   * if successful redirects to users.
   */
  submit() {
    let user = this.userForm.value;
    let data = {
      "email": user.email,
      "username": user.username,
      "firstname": user.firstname,
      "lastname": user.lastname,
      "password": user.password,
      "accountNonExpired": true,
      "accountNonLocked": true,
      "credentialsNonExpired": true,
      "enabled": true,
      "firstTimeLoginRemaining": false,
      "deleted": false,
      "passwordNeverExpires": true,
      "lastTimePasswordUpdated": Date.now()
    }
    this.usersService.createUser(data).subscribe((response: any) => {
      let rolesData = { "entityIds": user.roles }
      this.usersService.assignRoles(response.id,rolesData).subscribe((response: any) => {
        this.router.navigate(['../'], { relativeTo: this.route });
      });
    });
  }

}
