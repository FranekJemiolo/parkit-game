const fs = require('fs');
const path = require('path');

function analyze() {
  console.log('Analyzing fuzz test results...');
  
  // Try to read fuzz output from previous run
  let fuzzResults = [];
  
  // If no fuzz output file exists, run a quick fuzz test
  const fuzzOutputPath = path.join(__dirname, '../fuzz-output.json');
  
  if (fs.existsSync(fuzzOutputPath)) {
    const data = fs.readFileSync(fuzzOutputPath, 'utf-8');
    fuzzResults = JSON.parse(data);
  } else {
    console.log('No fuzz output found, running quick fuzz test...');
    const { fuzzTest } = require('../tests/fuzz/seed-fuzzer');
    fuzzResults = fuzzTest(100);
  }
  
  const report = buildReport(fuzzResults);
  
  // Create reports directory
  const reportsDir = path.join(__dirname, '../reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  
  // Write JSON report
  fs.writeFileSync(
    path.join(reportsDir, 'balance-report.json'),
    JSON.stringify(report, null, 2)
  );
  
  // Write Markdown report
  fs.writeFileSync(
    path.join(reportsDir, 'balance-report.md'),
    toMarkdown(report)
  );
  
  console.log('Balance report generated:');
  console.log(`- JSON: ${path.join(reportsDir, 'balance-report.json')}`);
  console.log(`- Markdown: ${path.join(reportsDir, 'balance-report.md')}`);
}

function buildReport(fuzzResults) {
  // Aggregate issues
  const issues = {};
  
  fuzzResults.forEach(result => {
    result.issues.forEach(issue => {
      issues[issue] = (issues[issue] || 0) + 1;
    });
  });
  
  const summary = {
    fuzzRuns: fuzzResults.length,
    failures: fuzzResults.length,
    instabilityScore: Object.keys(issues).length / fuzzResults.length
  };
  
  return {
    summary,
    issues,
    recommendations: generateRecommendations(issues)
  };
}

function generateRecommendations(issues) {
  const rec = {};
  
  if (issues.score_explosion && issues.score_explosion > 2) {
    rec['scoring.globalMultiplier'] = {
      current: 1.0,
      suggested: 0.88,
      reason: `Score explosion detected in ${issues.score_explosion} runs`
    };
  }
  
  if (issues.impossible_completion && issues.impossible_completion > 2) {
    rec['parking.tolerance'] = {
      current: 1.0,
      suggested: 1.15,
      reason: `Impossible completion detected in ${issues.impossible_completion} runs`
    };
  }
  
  if (issues.director_oscillation && issues.director_oscillation > 3) {
    rec['director.stability'] = {
      current: 1.0,
      suggested: 1.25,
      reason: `Director oscillation detected in ${issues.director_oscillation} runs`
    };
  }
  
  if (issues.score_is_not_finite) {
    rec['physics.clampValues'] = {
      current: false,
      suggested: true,
      reason: `Non-finite scores detected in ${issues.score_is_not_finite} runs`
    };
  }
  
  if (issues.nan_values) {
    rec['physics.validateState'] = {
      current: false,
      suggested: true,
      reason: `NaN values detected in ${issues.nan_values} runs`
    };
  }
  
  return rec;
}

function toMarkdown(report) {
  let md = '# Balance Report\n\n';
  
  md += '## Summary\n';
  md += `- Fuzz runs: ${report.summary.fuzzRuns}\n`;
  md += `- Failures: ${report.summary.failures}\n`;
  md += `- Instability score: ${(report.summary.instabilityScore * 100).toFixed(2)}%\n\n`;
  
  md += '## Issues Detected\n\n';
  if (Object.keys(report.issues).length === 0) {
    md += 'No issues detected. System is stable.\n\n';
  } else {
    for (const [issue, count] of Object.entries(report.issues)) {
      md += `- **${issue}**: ${count} occurrences\n`;
    }
    md += '\n';
  }
  
  md += '## Recommendations\n\n';
  if (Object.keys(report.recommendations).length === 0) {
    md += 'No recommendations needed.\n\n';
  } else {
    for (const [key, rec] of Object.entries(report.recommendations)) {
      md += `### ${key}\n`;
      md += `- Current: ${rec.current}\n`;
      md += `- Suggested: ${rec.suggested}\n`;
      md += `- Reason: ${rec.reason}\n\n`;
    }
  }
  
  md += '## Overall Assessment\n\n';
  if (report.summary.instabilityScore < 0.05) {
    md += '✅ System is stable. No immediate action required.\n';
  } else if (report.summary.instabilityScore < 0.15) {
    md += '⚠️ System shows minor instability. Review recommendations.\n';
  } else {
    md += '❌ System shows significant instability. Immediate action recommended.\n';
  }
  
  return md;
}

// Run if executed directly
if (require.main === module) {
  analyze();
}

module.exports = { analyze };
