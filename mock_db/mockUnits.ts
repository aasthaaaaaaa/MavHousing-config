export const mockUnits = [
  // ============================================
  // MEADOW RUN - NORTH TOWER (BY_UNIT)
  // No rooms/beds — unit is the lease unit
  // unitId 1-4
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
  // MEADOW RUN - SOUTH TOWER (BY_UNIT)
  // No rooms/beds — unit is the lease unit
  // unitId 5-8
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
  // HEIGHTS ON PECAN - EAST BUILDING (BY_ROOM)
  // Units contain rooms, each room = 1 lease
  // No beds tracked
  // unitId 9-11
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
  // HEIGHTS ON PECAN - WEST BUILDING (BY_ROOM)
  // Units contain rooms, each room = 1 lease
  // No beds tracked
  // unitId 12-14
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
  // TIMBER BROOKS - EAST WING (BY_BED)
  // Units → rooms → individual beds
  // unitId 15-17
  // ============================================
  {
    propertyId: 5,
    unitNumber: '1A',
    floorLevel: 1,
    requiresAdaAccess: false,
    maxOccupancy: 4,
  },
  {
    propertyId: 5,
    unitNumber: '1B',
    floorLevel: 1,
    requiresAdaAccess: false,
    maxOccupancy: 4,
  },
  {
    propertyId: 5,
    unitNumber: '2A',
    floorLevel: 2,
    requiresAdaAccess: true,
    maxOccupancy: 4,
  },

  // ============================================
  // TIMBER BROOKS - WEST WING (BY_BED)
  // Units → rooms → individual beds (3-bed rooms)
  // unitId 18-20
  // ============================================
  {
    propertyId: 6,
    unitNumber: '1A',
    floorLevel: 1,
    requiresAdaAccess: false,
    maxOccupancy: 9,
  },
  {
    propertyId: 6,
    unitNumber: '1B',
    floorLevel: 1,
    requiresAdaAccess: false,
    maxOccupancy: 9,
  },
  {
    propertyId: 6,
    unitNumber: '2A',
    floorLevel: 2,
    requiresAdaAccess: false,
    maxOccupancy: 9,
  },

  // ============================================
  // CARDINAL COMMONS (BY_BED - RESIDENCE HALL)
  // Units → rooms → individual beds
  // unitId 21-24
  // ============================================
  {
    propertyId: 7,
    unitNumber: 'A1',
    floorLevel: 1,
    requiresAdaAccess: false,
    maxOccupancy: 4,
  },
  {
    propertyId: 7,
    unitNumber: 'A2',
    floorLevel: 1,
    requiresAdaAccess: false,
    maxOccupancy: 4,
  },
  {
    propertyId: 7,
    unitNumber: 'B1',
    floorLevel: 2,
    requiresAdaAccess: true,
    maxOccupancy: 4,
  },
  {
    propertyId: 7,
    unitNumber: 'B2',
    floorLevel: 2,
    requiresAdaAccess: false,
    maxOccupancy: 9,
  },
];
