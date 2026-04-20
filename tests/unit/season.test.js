module.exports = (assert) => {
  // Test season mapping
  function getSeasonFromMonth(month) {
    if (month >= 12 || month <= 2) return 'winter';
    if (month >= 6 && month <= 8) return 'summer';
    return 'rain';
  }
  
  assert('December is winter', getSeasonFromMonth(12) === 'winter');
  assert('January is winter', getSeasonFromMonth(1) === 'winter');
  assert('February is winter', getSeasonFromMonth(2) === 'winter');
  assert('July is summer', getSeasonFromMonth(7) === 'summer');
  assert('April is rain', getSeasonFromMonth(4) === 'rain');
  
  // Test season modifiers
  function getSeasonModifiers(season) {
    switch (season) {
      case 'winter': return { grip: 0.6, visibility: 0.9, traffic: 0.8 };
      case 'rain': return { grip: 0.8, visibility: 0.85, traffic: 1.0 };
      case 'summer': return { grip: 1.0, visibility: 1.0, traffic: 1.2 };
      default: return { grip: 1.0, visibility: 1.0, traffic: 1.0 };
    }
  }
  
  const winterMods = getSeasonModifiers('winter');
  assert('winter has reduced grip', winterMods.grip < 1.0);
  assert('winter modifiers are valid', winterMods.grip > 0 && winterMods.grip <= 1.0);
};
