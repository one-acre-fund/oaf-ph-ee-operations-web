import { NgModule } from '@angular/core';

/** Routing Imports */
import { Routes, RouterModule } from '@angular/router';
import { Route } from '../core/route/route.service';
import { PermissionGuard } from '../core/authentication/permission.guard';
import { extract } from '../core/i18n/i18n.service';

/** Component Imports */
import { SystemComponent } from './system.component';
import { RolesAndPermissionsComponent } from './roles-and-permissions/roles-and-permissions.component';
import { AddRoleComponent } from './roles-and-permissions/add-role/add-role.component';
import { EditRoleComponent } from './roles-and-permissions/edit-role/edit-role.component';
import { ViewRoleComponent } from './roles-and-permissions/view-role/view-role.component';
import { AuditTrailsComponent } from './audit-trails/audit-trails.component';
import { ViewAuditComponent } from './audit-trails/view-audit/view-audit.component';

/** Custom Resolvers */
import { RolesAndPermissionsResolver } from './roles-and-permissions/roles-and-permissions.resolver';
import { ViewRoleResolver } from './roles-and-permissions/view-role/view-role.resolver';
import { AuditTrailSearchTemplateResolver } from './audit-trails/audit-trail-search-template.resolver';
import { AuditTrailResolver } from './audit-trails/view-audit/audit-trail.resolver';


const routes: Routes = [
  Route.withShell([
    {
      path: 'system/roles-and-permissions',
      canActivate: [PermissionGuard],
      data: { title: extract('System'), breadcrumb: 'System', permissions: ['ALL_FUNCTIONS', 'READ_AUDIT', 'READ_ROLE'] },
      children: [
        {
          path: '',
          component: SystemComponent
        },
        {
          path: 'roles-and-permissions',
          canActivate: [PermissionGuard],
          data: { title:  extract('Roles and Permissions'), breadcrumb: 'Roles and Permissions', permissions: ['ALL_FUNCTIONS', 'READ_ROLE'] },
          children: [
            {
              path: '',
              component: RolesAndPermissionsComponent,
              resolve: {
                roles: RolesAndPermissionsResolver
              }
            },
            {
              path: 'add',
              canActivate: [PermissionGuard],
              component: AddRoleComponent,
              data: { title: extract('Add Role'), breadcrumb: 'Add', permissions: ['ALL_FUNCTIONS', 'CREATE_ROLE'] }
            },
            {
              path: ':id',
              component: ViewRoleComponent,
              canActivate: [PermissionGuard],
              data: { title: extract('View Role'), routeParamBreadcrumb: 'id', permissions: ['ALL_FUNCTIONS', 'READ_ROLE'] },
              resolve: {
                role: ViewRoleResolver
              }
            },
            {
              path: ':id/edit',
              component: EditRoleComponent,
              canActivate: [PermissionGuard],
              data: { title: extract('Edit Role'), routeParamBreadcrumb: 'id', permissions: ['ALL_FUNCTIONS', 'UPDATE_ROLE'] },
              resolve: {
                role: ViewRoleResolver
              }
            }
          ]
        },
        {
          path: 'audit-trails',
          canActivate: [PermissionGuard],
          data: { title: extract('Audit Trails'), breadcrumb: 'Audit Trails', permissions: ['ALL_FUNCTIONS', 'READ_AUDIT'] },
          children: [
            {
              path: '',
              component: AuditTrailsComponent,
              resolve: {
                auditTrailSearchTemplate: AuditTrailSearchTemplateResolver
              }
            },
            {
             path: ':id',
             component: ViewAuditComponent,
             canActivate: [PermissionGuard],
             data: { title: extract('View Audit'), routeParamBreadcrumb: 'id', permissions: ['ALL_FUNCTIONS', 'READ_AUDIT'] },
             resolve: {
               auditTrail: AuditTrailResolver
             }
            }
          ]
        }
      ]
    }
  ])
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: [
    RolesAndPermissionsResolver,
    ViewRoleResolver,
    AuditTrailSearchTemplateResolver,
    AuditTrailResolver
  ]
})
export class SystemRoutingModule { }
