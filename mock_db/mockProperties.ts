import { LeaseType, PropertyType } from '../generated/prisma';

export const mockProperties = [
  // ============================================
  // MEADOW RUN (BY_UNIT BASED - RESIDENCE HALL)
  // ============================================
  {
    name: 'Meadow Run - North Tower',
    address: '701 W Mitchell St, Arlington, TX 76010',
    propertyType: PropertyType.RESIDENCE_HALL,
    leaseType: LeaseType.BY_UNIT,
    phone: '817-272-2000',
    totalCapacity: 200,
  },
  {
    name: 'Meadow Run - South Tower',
    address: '705 W Mitchell St, Arlington, TX 76010',
    propertyType: PropertyType.RESIDENCE_HALL,
    leaseType: LeaseType.BY_UNIT,
    phone: '817-272-2001',
    totalCapacity: 180,
  },

  // ============================================
  // HEIGHTS ON PECAN (BY_ROOM BASED - APARTMENT)
  // ============================================
  {
    name: 'Heights on Pecan - East Building',
    address: '300 Pecan St, Arlington, TX 76010',
    propertyType: PropertyType.APARTMENT,
    leaseType: LeaseType.BY_ROOM,
    phone: '817-272-4000',
    totalCapacity: 150,
  },
  {
    name: 'Heights on Pecan - West Building',
    address: '305 Pecan St, Arlington, TX 76010',
    propertyType: PropertyType.APARTMENT,
    leaseType: LeaseType.BY_ROOM,
    phone: '817-272-4001',
    totalCapacity: 140,
  },

  // ============================================
  // TIMBER BROOKS (BY_BED BASED - APARTMENT)
  // ============================================
  {
    name: 'Timber Brooks - East Wing',
    address: '450 S Center St, Arlington, TX 76010',
    propertyType: PropertyType.APARTMENT,
    leaseType: LeaseType.BY_BED,
    phone: '817-272-3000',
    totalCapacity: 150,
  },
  {
    name: 'Timber Brooks - West Wing',
    address: '455 S Center St, Arlington, TX 76010',
    propertyType: PropertyType.APARTMENT,
    leaseType: LeaseType.BY_BED,
    phone: '817-272-3001',
    totalCapacity: 160,
  },

  // ============================================
  // CARDINAL COMMONS (BY_BED BASED - RESIDENCE HALL)
  // ============================================
  {
    name: 'Cardinal Commons',
    address: '500 S Oak St, Arlington, TX 76010',
    propertyType: PropertyType.RESIDENCE_HALL,
    leaseType: LeaseType.BY_BED,
    phone: '817-272-5000',
    totalCapacity: 200,
  },
];
