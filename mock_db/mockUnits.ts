export const mockUnits = [
  // ============================================
  // MEADOW RUN - NORTH TOWER (BY_UNIT MODEL)
  // No rooms/beds needed - unit is the lease unit
  // ============================================
  {
    propertyId: 1,
    unitNumber: '101',
    floorLevel: 1,
    requiresAdaAccess: false,
    maxOccupancy: 4,
  },
  {
    propertyId: 1,
    unitNumber: '102',
    floorLevel: 1,
    requiresAdaAccess: false,
    maxOccupancy: 4,
  },
  {
    propertyId: 1,
    unitNumber: '103',
    floorLevel: 1,
    requiresAdaAccess: true,
    maxOccupancy: 4,
  },
  {
    propertyId: 1,
    unitNumber: '201',
    floorLevel: 2,
    requiresAdaAccess: false,
    maxOccupancy: 4,
  },

  // ============================================
  // MEADOW RUN - SOUTH TOWER (BY_UNIT MODEL)
  // ============================================
  {
    propertyId: 2,
    unitNumber: '101',
    floorLevel: 1,
    requiresAdaAccess: false,
    maxOccupancy: 4,
  },
  {
    propertyId: 2,
    unitNumber: '102',
    floorLevel: 1,
    requiresAdaAccess: false,
    maxOccupancy: 4,
  },
  {
    propertyId: 2,
    unitNumber: '201',
    floorLevel: 2,
    requiresAdaAccess: false,
    maxOccupancy: 4,
  },
  {
    propertyId: 2,
    unitNumber: '202',
    floorLevel: 2,
    requiresAdaAccess: true,
    maxOccupancy: 4,
  },

  // ============================================
  // HEIGHTS ON PECAN - EAST BUILDING (BY_ROOM MODEL)
  // Units contain rooms, each room = 1 lease
  // ============================================
  {
    propertyId: 3,
    unitNumber: '101',
    floorLevel: 1,
    requiresAdaAccess: false,
    maxOccupancy: 2,
  },
  {
    propertyId: 3,
    unitNumber: '102',
    floorLevel: 1,
    requiresAdaAccess: false,
    maxOccupancy: 2,
  },
  {
    propertyId: 3,
    unitNumber: '201',
    floorLevel: 2,
    requiresAdaAccess: false,
    maxOccupancy: 2,
  },

  // ============================================
  // HEIGHTS ON PECAN - WEST BUILDING (BY_ROOM MODEL)
  // ============================================
  {
    propertyId: 4,
    unitNumber: '101',
    floorLevel: 1,
    requiresAdaAccess: false,
    maxOccupancy: 2,
  },
  {
    propertyId: 4,
    unitNumber: '102',
    floorLevel: 1,
    requiresAdaAccess: true,
    maxOccupancy: 2,
  },
  {
    propertyId: 4,
    unitNumber: '201',
    floorLevel: 2,
    requiresAdaAccess: false,
    maxOccupancy: 2,
  },

  // ============================================
  // TIMBER BROOKS - EAST WING (BY_BED MODEL)
  // Units contain rooms with individual beds
  // ============================================
  {
    propertyId: 5,
    unitNumber: '1A',
    floorLevel: 1,
    requiresAdaAccess: false,
    maxOccupancy: 2,
  },
  {
    propertyId: 5,
    unitNumber: '1B',
    floorLevel: 1,
    requiresAdaAccess: false,
    maxOccupancy: 2,
  },
  {
    propertyId: 5,
    unitNumber: '2A',
    floorLevel: 2,
    requiresAdaAccess: true,
    maxOccupancy: 2,
  },

  // ============================================
  // TIMBER BROOKS - WEST WING (BY_BED MODEL)
  // ============================================
  {
    propertyId: 6,
    unitNumber: '1A',
    floorLevel: 1,
    requiresAdaAccess: false,
    maxOccupancy: 3,
  },
  {
    propertyId: 6,
    unitNumber: '1B',
    floorLevel: 1,
    requiresAdaAccess: false,
    maxOccupancy: 3,
  },
  {
    propertyId: 6,
    unitNumber: '2A',
    floorLevel: 2,
    requiresAdaAccess: false,
    maxOccupancy: 3,
  },

  // ============================================
  // CARDINAL COMMONS (BY_BED MODEL - RESIDENCE HALL)
  // Units contain rooms with individual beds
  // ============================================
  {
    propertyId: 7,
    unitNumber: 'A1',
    floorLevel: 1,
    requiresAdaAccess: false,
    maxOccupancy: 2,
  },
  {
    propertyId: 7,
    unitNumber: 'A2',
    floorLevel: 1,
    requiresAdaAccess: false,
    maxOccupancy: 2,
  },
  {
    propertyId: 7,
    unitNumber: 'B1',
    floorLevel: 2,
    requiresAdaAccess: true,
    maxOccupancy: 2,
  },
  {
    propertyId: 7,
    unitNumber: 'B2',
    floorLevel: 2,
    requiresAdaAccess: false,
    maxOccupancy: 3,
  },
];
