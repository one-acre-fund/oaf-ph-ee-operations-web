import { NgModule } from '@angular/core';

/** Routing Imports */
import { Routes, RouterModule } from '@angular/router';
import { Route } from '../core/route/route.service';
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
      path: 'system',
      data: { title: extract('System'), breadcrumb: 'System' },
      children: [
        {
          path: '',
          component: SystemComponent
        },
        {
          path: 'roles-and-permissions',
          data: { title:  extract('Roles and Permissions'), breadcrumb: 'Roles and Permissions' },
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
              component: AddRoleComponent,
              data: { title: extract('Add Role'), breadcrumb: 'Add' }
            },
            {
              path: ':id',
              component: ViewRoleComponent,
              data: { title: extract('View Role'), routeParamBreadcrumb: 'id' },
              resolve: {
                role: ViewRoleResolver
              }
            },
            {
              path: ':id/edit',
              component: EditRoleComponent,
              data: { title: extract('Edit Role'), routeParamBreadcrumb: 'id' },
              resolve: {
                role: ViewRoleResolver
              }
            }
          ]
        },
        {
          path: 'audit-trails',
          data: { title: extract('Audit Trails'), breadcrumb: 'Audit Trails' },
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
             data: { title: extract('View Audit'), routeParamBreadcrumb: 'id' },
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
