function detectAnomalies(result) {
  const issues = [];
  const final = result.final;
  
  // Check for physics instability
  if (!isFinite(final.score)) {
    issues.push('score_is_not_finite');
  }
  
  // Check for impossible scoring explosion
  if (final.score > 1e7) {
    issues.push('score_explosion');
  }
  
  // Check for negative fuel or invalid state
  if (final.fuel < 0) {
    issues.push('negative_fuel');
  }
  
  // Check for impossible completion (no movement but completed)
  if (final.moves === 0 && final.completed) {
    issues.push('impossible_completion');
  }
  
  // Check for car position out of bounds
  if (Math.abs(final.car.x) > 10000 || Math.abs(final.car.y) > 10000) {
    issues.push('car_out_of_bounds');
  }
  
  // Check for director oscillation
  if (result.log.length > 10) {
    const d = result.log.map(l => l.director);
    const flips = countTransitions(d);
    
    if (flips > 15) {
      issues.push('director_oscillation');
    }
  }
  
  // Check for NaN values
  if (isNaN(final.car.x) || isNaN(final.car.y) || isNaN(final.car.angle)) {
    issues.push('nan_values');
  }
  
  return issues;
}

function countTransitions(arr) {
  let count = 0;
  
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] !== arr[i - 1]) count++;
  }
  
  return count;
}

module.exports = { detectAnomalies };
