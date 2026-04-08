import { Component, OnInit } from '@angular/core';
import { UserPermissionsService } from 'app/core/authentication/user-permissions.service';

@Component({
  selector: 'mifosx-system',
  templateUrl: './system.component.html',
  styleUrls: ['./system.component.scss']
})
export class SystemComponent implements OnInit {

  constructor(private userPermissionsService: UserPermissionsService) { }

  ngOnInit() {
  }

  canViewRoles(): boolean {
    return this.userPermissionsService.hasPermission('READ_ROLE');
  }

  canViewAudit(): boolean {
    return this.userPermissionsService.hasPermission('READ_AUDIT');
  }

}
