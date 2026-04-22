#!/usr/bin/env node

// Quick test to verify AI recommendation service works

require('dotenv').config();
const path = require('path');

console.log('🧪 Testing AI Recommendation Service');
console.log('==================================\n');

// Check GROQ API key
console.log('1️⃣ Checking environment variables...');
if (!process.env.GROQ_API_KEY) {
  console.error('❌ GROQ_API_KEY not set');
  process.exit(1);
}
console.log('✅ GROQ_API_KEY is set');

// Check components file
console.log('\n2️⃣ Checking components database...');
const fs = require('fs');
const componentsPath = path.join(__dirname, 'data/components.json');
if (!fs.existsSync(componentsPath)) {
  console.error('❌ Components file not found at:', componentsPath);
  process.exit(1);
}
console.log('✅ Components file found at:', componentsPath);

try {
  const components = JSON.parse(fs.readFileSync(componentsPath, 'utf-8'));
  console.log('✅ Components JSON is valid');
  console.log(`   - Total categories: ${Object.keys(components).length}`);
  Object.entries(components).forEach(([cat, items]) => {
    console.log(`   - ${cat}: ${Array.isArray(items) ? items.length : 0} items`);
  });
} catch (err) {
  console.error('❌ Error parsing components JSON:', err.message);
  process.exit(1);
}

// Load the service
console.log('\n3️⃣ Loading AI Recommendation Service...');
try {
  const aiService = require('./services/aiRecommendationService');
  console.log('✅ Service loaded successfully');
} catch (err) {
  console.error('❌ Error loading service:', err.message);
  console.error('Stack:', err.stack);
  process.exit(1);
}

// Test the generation function
console.log('\n4️⃣ Testing recommendation generation...');
(async () => {
  try {
    const aiService = require('./services/aiRecommendationService');
    
    console.log('   Calling generateBuildRecommendation...');
    const recommendation = await aiService.generateBuildRecommendation(
      'Graphics',
      'Lab for graphics design and 3D rendering',
      330000,  // BDT budget per system (approx 3000 USD)
      5
    );
    
    console.log('✅ Recommendation generated successfully!');
    console.log('\n📋 Recommendation Summary:');
    console.log('   - Lab Type:', recommendation.labType);
    console.log('   - Number of Systems:', recommendation.numberOfSystems);
    console.log('   - Components Count:', recommendation.suggestedComponents?.length || 0);
    console.log('   - Total Cost:', recommendation.costAnalysis?.finalTotalCostFormatted);
    console.log('   - Power Consumption:', recommendation.powerRequirements?.totalPowerConsumption, 'W');
    console.log('   - Software Stack Count:', recommendation.softwareStack?.length || 0);
    
    console.log('\n✅ All tests passed!');
    process.exit(0);
    
  } catch (err) {
    console.error('\n❌ Error during recommendation generation:');
    console.error('   Message:', err.message);
    console.error('   Stack:', err.stack);
    process.exit(1);
  }
})();
