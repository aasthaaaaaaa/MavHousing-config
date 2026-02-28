import { LeaseType, PropertyType } from '../generated/prisma';

export const mockProperties = [
  // ============================================
  // MEADOW RUN (BY_UNIT - APARTMENT)
  // Units only — no rooms/beds tracked
  // ============================================
  {
    name: 'Meadow Run - North Tower',
    address: '701 W Mitchell St, Arlington, TX 76010',
    propertyType: PropertyType.APARTMENT,
    leaseType: LeaseType.BY_UNIT,
    phone: 8172722000,
    totalCapacity: 200,
  },
  {
    name: 'Meadow Run - South Tower',
    address: '705 W Mitchell St, Arlington, TX 76010',
    propertyType: PropertyType.APARTMENT,
    leaseType: LeaseType.BY_UNIT,
    phone: 8172722001,
    totalCapacity: 180,
  },

  // ============================================
  // HEIGHTS ON PECAN (BY_ROOM - APARTMENT)
  // Units with rooms — no beds tracked
  // ============================================
  {
    name: 'Heights on Pecan - East Building',
    address: '300 Pecan St, Arlington, TX 76010',
    propertyType: PropertyType.APARTMENT,
    leaseType: LeaseType.BY_ROOM,
    phone: 8172724000,
    totalCapacity: 150,
  },
  {
    name: 'Heights on Pecan - West Building',
    address: '305 Pecan St, Arlington, TX 76010',
    propertyType: PropertyType.APARTMENT,
    leaseType: LeaseType.BY_ROOM,
    phone: 8172724001,
    totalCapacity: 140,
  },

  // ============================================
  // TIMBER BROOKS (BY_BED - APARTMENT)
  // Units → rooms → individual beds
  // ============================================
  {
    name: 'Timber Brooks - East Wing',
    address: '450 S Center St, Arlington, TX 76010',
    propertyType: PropertyType.APARTMENT,
    leaseType: LeaseType.BY_BED,
    phone: 8172723000,
    totalCapacity: 150,
  },
  {
    name: 'Timber Brooks - West Wing',
    address: '455 S Center St, Arlington, TX 76010',
    propertyType: PropertyType.APARTMENT,
    leaseType: LeaseType.BY_BED,
    phone: 8172723001,
    totalCapacity: 160,
  },

  // ============================================
  // ARLINGTON HALL (BY_BED - RESIDENCE HALL)
  // Units → rooms → individual beds
  // ============================================
  {
    name: 'Arlington Hall',
    address: '600 S West St, Arlington, TX 76010',
    propertyType: PropertyType.RESIDENCE_HALL,
    leaseType: LeaseType.BY_BED,
    phone: 8172725000,
    totalCapacity: 200,
  },
];
