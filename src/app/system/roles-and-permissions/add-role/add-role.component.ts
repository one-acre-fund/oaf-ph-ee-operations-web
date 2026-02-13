/** Angular Imports */
import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

/** Custom Services */
import { SystemService } from '../../system.service';

/**
 * Add Role Component.
 */
@Component({
  selector: 'mifosx-add-role',
  templateUrl: './add-role.component.html',
  styleUrls: ['./add-role.component.scss']
})
export class AddRoleComponent implements OnInit {

  /** Role form. */
  roleForm: UntypedFormGroup;

  /**
   * @param {FormBuilder} formBuilder Form Builder.
   * @param {SystemService} systemService System Service.
   * @param {ActivatedRoute} route Activated Route.
   * @param {Router} router Router for navigation.
   */
  constructor(private formBuilder: UntypedFormBuilder,
              private systemService: SystemService,
              private route: ActivatedRoute,
              private router: Router) { }

  /**
   * Creates the role form.
   */
  ngOnInit() {
    this.createRoleForm();
  }

  /**
   * Creates the create role form.
   */
  createRoleForm() {
    this.roleForm = this.formBuilder.group({
      'name': ['', Validators.required],
      'description': ['', Validators.required],
      'disabled': false
    });
  }

  /**
   * Submits the role form and creates a role,
   * if successful redirects back to roles and permission.
   */
  submit() {
    const roleData = {
    ...this.roleForm.value,
    name: this.roleForm.value.name.trim().toLowerCase()
  };
  
  this.systemService.createRole(roleData)
    .subscribe((response: any) => {
      this.router.navigate(['../'], { relativeTo: this.route });
    });
  }

}
