import { ApplicationStatus } from '@mav-housing/prisma';
import { UserSignup } from 'apps/auth-server/DTO/userSignUp.dto';

/**
 * Base application entity matching the Prisma Application model.
 * Common fields shared across all unit-type variants.
 */
export class ApplicationEntity {
  appId: number;
  userId: number;
  term: string;
  status: ApplicationStatus;
  preferredPropertyId?: number;
  submissionDate?: Date;
  createdAt: Date;
  updatedAt: Date;

  // --- Payload fields (from DTOs) ---

  personalDetails: {
    fName: UserSignup['fName'];
    mName?: UserSignup['mName'];
    lName: UserSignup['lName'];
    utaId: UserSignup['utaId'];
    email: UserSignup['email'];
    gender: UserSignup['gender'];
  };

  emergencyContact: {
    name: string;
    phone: string;
  };

  applicationSelection: {
    intakeSemester: string;
    buildingId: string;
    unitType: string;
    isAdaRequired?: boolean;
    agreementAccepted: boolean;
  };
}

/**
 * Entity for BY_UNIT applications.
 * Includes optional occupant list (up to 4 occupants).
 */
export class ApplicationByUnitEntity extends ApplicationEntity {
  occupants?: {
    utaId: UserSignup['utaId'];
    gender: UserSignup['gender'];
  }[];
}

/**
 * Entity for BY_ROOM applications.
 * Includes the selected room ID.
 */
export class ApplicationByRoomEntity extends ApplicationEntity {
  roomId: string;
}

/**
 * Entity for BY_BED applications.
 * Includes the selected bed ID.
 */
export class ApplicationByBedEntity extends ApplicationEntity {
  bedId: string;
}
