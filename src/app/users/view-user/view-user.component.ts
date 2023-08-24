/** Angular Imports */
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';

/** Custom Services */
import { UsersService } from '../users.service';

/** Custom Components */
import { DeleteDialogComponent } from 'app/shared/delete-dialog/delete-dialog.component';
import { ConfirmDialogComponent } from 'app/shared/confirm-dialog/confirm-dialog.component';

/**
 * View user component.
 */
@Component({
  selector: 'mifosx-view-user',
  templateUrl: './view-user.component.html',
  styleUrls: ['./view-user.component.scss']
})
export class ViewUserComponent implements OnInit {

  /** User Data. */
  userData: any;

  /**
   * Retrieves the user data from `resolve`.
   * @param {UsersService} usersService Users Service.
   * @param {ActivatedRoute} route Activated Route.
   * @param {Router} router Router for navigation.
   * @param {MatDialog} dialog Dialog reference.
   */
  constructor(private usersService: UsersService,
    private route: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog) {
    this.route.data.subscribe((data: { user: any }) => {
      this.userData = data.user;
    });
  }

  ngOnInit() {
  }

  /**
   * Deletes the user and redirects to users.
   */
  delete() {
    const deleteUserDialogRef = this.dialog.open(DeleteDialogComponent, {
      data: { deleteContext: `user ${this.userData.id}` }
    });
    deleteUserDialogRef.afterClosed().subscribe((response: any) => {
      if (response.delete) {
        this.usersService.deleteUser(this.userData.id)
          .subscribe(() => {
            this.router.navigate(['/users']);
          });
      }
    });
  }

  /**
   * activates the user and redirects to users.
   */
  activate() {
    const activateUserDialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: { deleteContext: `user ${this.userData.id}`, action: 'Activate' }
    });
    activateUserDialogRef.afterClosed().subscribe((response: any) => {
      if (response.delete) {
        this.usersService.activateUser(this.userData.id)
          .subscribe(() => {
            this.router.navigate(['/users']);
          });
      }
    });
  }

  /**
   * deactivate the user and redirects to users.
   */
  deactivate() {
    const deactivateUserDialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: { deleteContext: `user ${this.userData.id}`, action: 'Deactivate' }
    });
    deactivateUserDialogRef.afterClosed().subscribe((response: any) => {
      if (response.delete) {
        this.usersService.deactivateUser(this.userData.id)
          .subscribe(() => {
            this.router.navigate(['/users']);
          });
      }
    });
  }
}
