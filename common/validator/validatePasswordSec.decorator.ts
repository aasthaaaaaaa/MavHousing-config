/*
Decorator for the validator for password.validator.ts

Usage : 
@ValidatePassword()
ValueField
*/

import { validatePasswordSec } from './password.validator';

import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function ValidatePassword() {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'ValidatePassword',
      target: object.constructor,
      propertyName,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return false;

          const user = args.object as any;

          return validatePasswordSec(
            value,
            user.fname,
            user.lname,
            user.mname,
            user.email,
          );
        },
        defaultMessage(): string {
          return 'Password must be at least 10 chars, include upper/lowercase, number, special char, and not contain personal info (name or email).';
        },
      },
    });
  };
}
