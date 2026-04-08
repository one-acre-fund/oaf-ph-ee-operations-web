/** Angular Imports */
import { Injectable } from '@angular/core';


/** rxjs Imports */
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

/** Custom Services */
import { UsersService } from './users.service';
import {HttpErrorResponse} from "@angular/common/http";

/**
 * Users template data resolver.
 */
@Injectable()
export class UsersTemplateResolver  {

  /**
   * @param {UsersService} usersService Users service.
   */
  constructor(private usersService: UsersService) {}

  /**
   * Returns the users template data.
   * Falls back to an empty array when the user lacks READ_ROLE permission.
   * @returns {Observable<any>}
   */
  resolve(): Observable<any> {
    return this.usersService.getUsersTemplate().pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401 || error.status === 403) {
                return of([]);
            }
            return throwError(() => error);
        })
    );
  }

}
