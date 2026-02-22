export const mockBeds = [
  // ============================================
  // TIMBER BROOKS - EAST WING BEDS (2-bed rooms)
  // Only BY_BED properties get beds
  // ============================================
  // Unit 1A (unitId 15), Room A (roomId 13) - 2 beds
  { roomId: 13, unitId: 15, bedLetter: 'L' }, // bedId 1
  { roomId: 13, unitId: 15, bedLetter: 'R' }, // bedId 2
  // Unit 1A (unitId 15), Room B (roomId 14) - 2 beds
  { roomId: 14, unitId: 15, bedLetter: '1' }, // bedId 3
  { roomId: 14, unitId: 15, bedLetter: '2' }, // bedId 4
  // Unit 1B (unitId 16), Room A (roomId 15) - 2 beds
  { roomId: 15, unitId: 16, bedLetter: 'L' }, // bedId 5
  { roomId: 15, unitId: 16, bedLetter: 'R' }, // bedId 6
  // Unit 1B (unitId 16), Room B (roomId 16) - 2 beds
  { roomId: 16, unitId: 16, bedLetter: '1' }, // bedId 7
  { roomId: 16, unitId: 16, bedLetter: '2' }, // bedId 8
  // Unit 2A ADA (unitId 17), Room A (roomId 17) - 2 beds
  { roomId: 17, unitId: 17, bedLetter: '1' }, // bedId 9
  { roomId: 17, unitId: 17, bedLetter: '2' }, // bedId 10
  // Unit 2A ADA (unitId 17), Room B (roomId 18) - 2 beds
  { roomId: 18, unitId: 17, bedLetter: '1' }, // bedId 11
  { roomId: 18, unitId: 17, bedLetter: '2' }, // bedId 12

  // ============================================
  // TIMBER BROOKS - WEST WING BEDS (3-bed rooms)
  // ============================================
  // Unit 1A (unitId 18), Room A (roomId 19) - 3 beds
  { roomId: 19, unitId: 18, bedLetter: '1' }, // bedId 13
  { roomId: 19, unitId: 18, bedLetter: '2' }, // bedId 14
  { roomId: 19, unitId: 18, bedLetter: '3' }, // bedId 15
  // Unit 1A (unitId 18), Room B (roomId 20) - 3 beds
  { roomId: 20, unitId: 18, bedLetter: '1' }, // bedId 16
  { roomId: 20, unitId: 18, bedLetter: '2' }, // bedId 17
  { roomId: 20, unitId: 18, bedLetter: '3' }, // bedId 18
  // Unit 1A (unitId 18), Room C (roomId 21) - 3 beds
  { roomId: 21, unitId: 18, bedLetter: '1' }, // bedId 19
  { roomId: 21, unitId: 18, bedLetter: '2' }, // bedId 20
  { roomId: 21, unitId: 18, bedLetter: '3' }, // bedId 21
  // Unit 1B (unitId 19), Room A (roomId 22) - 3 beds
  { roomId: 22, unitId: 19, bedLetter: '1' }, // bedId 22
  { roomId: 22, unitId: 19, bedLetter: '2' }, // bedId 23
  { roomId: 22, unitId: 19, bedLetter: '3' }, // bedId 24
  // Unit 1B (unitId 19), Room B (roomId 23) - 3 beds
  { roomId: 23, unitId: 19, bedLetter: '1' }, // bedId 25
  { roomId: 23, unitId: 19, bedLetter: '2' }, // bedId 26
  { roomId: 23, unitId: 19, bedLetter: '3' }, // bedId 27
  // Unit 1B (unitId 19), Room C (roomId 24) - 3 beds
  { roomId: 24, unitId: 19, bedLetter: '1' }, // bedId 28
  { roomId: 24, unitId: 19, bedLetter: '2' }, // bedId 29
  { roomId: 24, unitId: 19, bedLetter: '3' }, // bedId 30
  // Unit 2A (unitId 20), Room A (roomId 25) - 3 beds
  { roomId: 25, unitId: 20, bedLetter: '1' }, // bedId 31
  { roomId: 25, unitId: 20, bedLetter: '2' }, // bedId 32
  { roomId: 25, unitId: 20, bedLetter: '3' }, // bedId 33
  // Unit 2A (unitId 20), Room B (roomId 26) - 3 beds
  { roomId: 26, unitId: 20, bedLetter: '1' }, // bedId 34
  { roomId: 26, unitId: 20, bedLetter: '2' }, // bedId 35
  { roomId: 26, unitId: 20, bedLetter: '3' }, // bedId 36
  // Unit 2A (unitId 20), Room C (roomId 27) - 3 beds
  { roomId: 27, unitId: 20, bedLetter: '1' }, // bedId 37
  { roomId: 27, unitId: 20, bedLetter: '2' }, // bedId 38
  { roomId: 27, unitId: 20, bedLetter: '3' }, // bedId 39

  // ============================================
  // CARDINAL COMMONS BEDS (2-3 bed rooms)
  // ============================================
  // Unit A1 (unitId 21), Room A (roomId 28) - 2 beds
  { roomId: 28, unitId: 21, bedLetter: 'L' }, // bedId 40
  { roomId: 28, unitId: 21, bedLetter: 'R' }, // bedId 41
  // Unit A1 (unitId 21), Room B (roomId 29) - 2 beds
  { roomId: 29, unitId: 21, bedLetter: '1' }, // bedId 42
  { roomId: 29, unitId: 21, bedLetter: '2' }, // bedId 43
  // Unit A2 (unitId 22), Room A (roomId 30) - 2 beds
  { roomId: 30, unitId: 22, bedLetter: 'L' }, // bedId 44
  { roomId: 30, unitId: 22, bedLetter: 'R' }, // bedId 45
  // Unit A2 (unitId 22), Room B (roomId 31) - 2 beds
  { roomId: 31, unitId: 22, bedLetter: '1' }, // bedId 46
  { roomId: 31, unitId: 22, bedLetter: '2' }, // bedId 47
  // Unit B1 ADA (unitId 23), Room A (roomId 32) - 2 beds
  { roomId: 32, unitId: 23, bedLetter: '1' }, // bedId 48
  { roomId: 32, unitId: 23, bedLetter: '2' }, // bedId 49
  // Unit B1 ADA (unitId 23), Room B (roomId 33) - 2 beds
  { roomId: 33, unitId: 23, bedLetter: '1' }, // bedId 50
  { roomId: 33, unitId: 23, bedLetter: '2' }, // bedId 51
  // Unit B2 (unitId 24), Room A (roomId 34) - 3 beds
  { roomId: 34, unitId: 24, bedLetter: '1' }, // bedId 52
  { roomId: 34, unitId: 24, bedLetter: '2' }, // bedId 53
  { roomId: 34, unitId: 24, bedLetter: '3' }, // bedId 54
  // Unit B2 (unitId 24), Room B (roomId 35) - 3 beds
  { roomId: 35, unitId: 24, bedLetter: '1' }, // bedId 55
  { roomId: 35, unitId: 24, bedLetter: '2' }, // bedId 56
  { roomId: 35, unitId: 24, bedLetter: '3' }, // bedId 57
  // Unit B2 (unitId 24), Room C (roomId 36) - 3 beds
  { roomId: 36, unitId: 24, bedLetter: '1' }, // bedId 58
  { roomId: 36, unitId: 24, bedLetter: '2' }, // bedId 59
  { roomId: 36, unitId: 24, bedLetter: '3' }, // bedId 60
];
