const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function mergeCoverageReports() {
  try {
    const mockedCoveragePath = 'coverage/mocked/coverage-final.json';
    const unmockedCoveragePath = 'coverage/unmocked/coverage-final.json';
    const combinedDir = 'coverage/combined';
    const combinedCoveragePath = 'coverage/combined/coverage-final.json';

    // Ensure combined directory exists
    if (!fs.existsSync(combinedDir)) {
      fs.mkdirSync(combinedDir, { recursive: true });
    }

    // Read mocked coverage
    let mockedCoverage = {};
    if (fs.existsSync(mockedCoveragePath)) {
      mockedCoverage = JSON.parse(fs.readFileSync(mockedCoveragePath, 'utf8'));
      console.log(`✓ Loaded mocked coverage: ${Object.keys(mockedCoverage).length} files`);
    } else {
      console.warn('⚠ Mocked coverage file not found, proceeding with unmocked only');
    }

    // Read unmocked coverage
    let unmockedCoverage = {};
    if (fs.existsSync(unmockedCoveragePath)) {
      unmockedCoverage = JSON.parse(fs.readFileSync(unmockedCoveragePath, 'utf8'));
      console.log(`✓ Loaded unmocked coverage: ${Object.keys(unmockedCoverage).length} files`);
    } else {
      console.warn('⚠ Unmocked coverage file not found, proceeding with mocked only');
    }

    // Initialize merged coverage with mocked data as base
    const mergedCoverage = {};
    
    // Start with mocked coverage files
    Object.keys(mockedCoverage).forEach(filePath => {
      mergedCoverage[filePath] = { ...mockedCoverage[filePath] };
    });

    // Track coverage merging statistics
    let filesOnlyInMocked = 0;
    let filesOnlyInUnmocked = 0;
    let filesMerged = 0;

    // Merge unmocked coverage data
    Object.keys(unmockedCoverage).forEach(filePath => {
      if (mergedCoverage[filePath]) {
        // File exists in both mocked and unmocked - merge the data
        const mockedFileData = mergedCoverage[filePath];
        const unmockedFileData = unmockedCoverage[filePath];
        
        // Merge statement coverage (s)
        const mergedStatements = { ...mockedFileData.s };
        Object.keys(unmockedFileData.s || {}).forEach(key => {
          mergedStatements[key] = (mergedStatements[key] || 0) + (unmockedFileData.s[key] || 0);
        });

        // Merge function coverage (f)
        const mergedFunctions = { ...mockedFileData.f };
        Object.keys(unmockedFileData.f || {}).forEach(key => {
          mergedFunctions[key] = (mergedFunctions[key] || 0) + (unmockedFileData.f[key] || 0);
        });

        // Merge branch coverage (b)
        const mergedBranches = { ...mockedFileData.b };
        Object.keys(unmockedFileData.b || {}).forEach(key => {
          if (mergedBranches[key] && unmockedFileData.b[key]) {
            mergedBranches[key] = mergedBranches[key].map((count, index) => {
              return (count || 0) + (unmockedFileData.b[key][index] || 0);
            });
          } else {
            mergedBranches[key] = unmockedFileData.b[key];
          }
        });

        // Update merged coverage with combined data
        mergedCoverage[filePath] = {
          ...mockedFileData,
          s: mergedStatements,
          f: mergedFunctions,
          b: mergedBranches
        };
        
        filesMerged++;
      } else {
        mergedCoverage[filePath] = { ...unmockedCoverage[filePath] };
        filesOnlyInUnmocked++;
      }
    });

    Object.keys(mockedCoverage).forEach(filePath => {
      if (!unmockedCoverage[filePath]) {
        filesOnlyInMocked++;
      }
    });

    // Display merge statistics
    console.log('\n📊 Coverage merge statistics:');
    console.log(`   • Files merged from both test types: ${filesMerged}`);
    console.log(`   • Files only in mocked tests: ${filesOnlyInMocked}`);
    console.log(`   • Files only in unmocked tests: ${filesOnlyInUnmocked}`);
    console.log(`   • Total files in combined coverage: ${Object.keys(mergedCoverage).length}`);

    // Categorize files for better reporting
    const fileCategories = {
      controllers: [],
      routes: [],
      models: [],
      services: [],
      middleware: [],
      utils: [],
      config: [],
      types: [],
      other: []
    };

    // Categorize files and calculate per-category coverage
    Object.keys(mergedCoverage).forEach(filePath => {
      const relativePath = filePath.replace(/.*\\src\\/, 'src\\');
      
      if (relativePath.includes('\\controllers\\')) {
        fileCategories.controllers.push(filePath);
      } else if (relativePath.includes('\\routes\\')) {
        fileCategories.routes.push(filePath);
      } else if (relativePath.includes('\\models\\')) {
        fileCategories.models.push(filePath);
      } else if (relativePath.includes('\\services\\')) {
        fileCategories.services.push(filePath);
      } else if (relativePath.includes('\\middleware\\')) {
        fileCategories.middleware.push(filePath);
      } else if (relativePath.includes('\\utils\\')) {
        fileCategories.utils.push(filePath);
      } else if (relativePath.includes('\\config\\')) {
        fileCategories.config.push(filePath);
      } else if (relativePath.includes('\\types\\')) {
        fileCategories.types.push(filePath);
      } else {
        fileCategories.other.push(filePath);
      }
    });

    // Display file categorization and individual coverage stats
    console.log('\n📁 Files by category with coverage:');
    Object.keys(fileCategories).forEach(category => {
      const files = fileCategories[category];
      if (files.length > 0) {
        console.log(`\n   📂 ${category.toUpperCase()}: ${files.length} files`);
        
        // Calculate category-level coverage stats
        let totalStatements = 0;
        let coveredStatements = 0;
        let totalFunctions = 0;
        let coveredFunctions = 0;
        let totalBranches = 0;
        let coveredBranches = 0;

        files.forEach(filePath => {
          const fileData = mergedCoverage[filePath];
          const fileName = path.basename(filePath);
          
          // Count statements for this file
          let fileStatements = 0;
          let fileCoveredStatements = 0;
          Object.values(fileData.s || {}).forEach(count => {
            fileStatements++;
            totalStatements++;
            if (count > 0) {
              fileCoveredStatements++;
              coveredStatements++;
            }
          });
          
          // Count functions for this file
          let fileFunctions = 0;
          let fileCoveredFunctions = 0;
          Object.values(fileData.f || {}).forEach(count => {
            fileFunctions++;
            totalFunctions++;
            if (count > 0) {
              fileCoveredFunctions++;
              coveredFunctions++;
            }
          });
          
          // Count branches for this file
          let fileBranches = 0;
          let fileCoveredBranches = 0;
          Object.values(fileData.b || {}).forEach(branchArray => {
            if (Array.isArray(branchArray)) {
              branchArray.forEach(count => {
                fileBranches++;
                totalBranches++;
                if (count > 0) {
                  fileCoveredBranches++;
                  coveredBranches++;
                }
              });
            }
          });

          // Calculate file-level percentages
          const fileStmtPercent = fileStatements > 0 ? ((fileCoveredStatements / fileStatements) * 100).toFixed(1) : '100.0';
          const fileFuncPercent = fileFunctions > 0 ? ((fileCoveredFunctions / fileFunctions) * 100).toFixed(1) : '100.0';
          const fileBranchPercent = fileBranches > 0 ? ((fileCoveredBranches / fileBranches) * 100).toFixed(1) : '100.0';

          console.log(`     📄 ${fileName}:`);
          console.log(`        Statements: ${fileStmtPercent}% (${fileCoveredStatements}/${fileStatements})`);
          console.log(`        Functions:  ${fileFuncPercent}% (${fileCoveredFunctions}/${fileFunctions})`);
          console.log(`        Branches:   ${fileBranchPercent}% (${fileCoveredBranches}/${fileBranches})`);
        });

        // Calculate category totals
        const stmtPercent = totalStatements > 0 ? ((coveredStatements / totalStatements) * 100).toFixed(2) : '100.00';
        const funcPercent = totalFunctions > 0 ? ((coveredFunctions / totalFunctions) * 100).toFixed(2) : '100.00';
        const branchPercent = totalBranches > 0 ? ((coveredBranches / totalBranches) * 100).toFixed(2) : '100.00';

        console.log(`     📊 CATEGORY TOTALS:`);
        console.log(`        Statements: ${stmtPercent}% (${coveredStatements}/${totalStatements})`);
        console.log(`        Functions:  ${funcPercent}% (${coveredFunctions}/${totalFunctions})`);
        console.log(`        Branches:   ${branchPercent}% (${coveredBranches}/${totalBranches})`);
      }
    });

    // Write combined coverage file
    fs.writeFileSync(combinedCoveragePath, JSON.stringify(mergedCoverage, null, 2));

    console.log('\n✅ Coverage reports merged successfully');
    console.log(`📝 Combined coverage written to: ${combinedCoveragePath}`);

    // Generate HTML report using nyc
    console.log('\n🔄 Generating HTML report...');
    execSync(`npx nyc report --reporter=html --report-dir=coverage/combined --temp-dir=coverage/combined`, {
      stdio: 'inherit'
    });

    console.log('\n🎉 HTML report generated at: coverage/combined/index.html');
    console.log('   You can view individual file coverage metrics in the HTML report');
    console.log('   Each controller, route, model, and service file now shows detailed coverage breakdowns');

  } catch (error) {
    console.error('❌ Error merging coverage reports:', error);
    process.exit(1);
  }
}

mergeCoverageReports();