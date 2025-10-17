function testCoordinateConversion() {
  // console.log('Testing coordinate conversion:');
  // console.log('a =', convertColumnLetterToYCoord('a')); // Should be 0
  // console.log('e =', convertColumnLetterToYCoord('e')); // Should be 4
  // console.log('h =', convertColumnLetterToYCoord('h')); // Should be 7
}

// Test move parsing
function testMoveParser() {
  // console.log('Testing move parser:');
  
  // Test regular move
  const move1 = moveFromStockfishString('e2e4');
  // console.log('e2e4 =', move1);
  
  // Test move with promotion
  setComputerColor('white');
  const move2 = moveFromStockfishString('a7a8q');
  // console.log('a7a8q =', move2);
}

// Test configuration
function testConfiguration() {
  // console.log('Testing configuration:');
  
  setComputerLevel(3);
  setComputerColor('black');
  // console.log('Current config:', getComputerConfiguration());
}

// Test API call with mock data
function testAPICall() {
  const testFEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  
  // console.log('Testing API call...');
  getBestMove(testFEN, 
    function(move) {
      // console.log('API test successful:', move);
    },
    function(error) {
      // console.log('API test failed:', error);
    }
  );
}

// Run all tests
function runAllTests() {
  testCoordinateConversion();
  testMoveParser();
  testConfiguration();
  testAPICall();
}
