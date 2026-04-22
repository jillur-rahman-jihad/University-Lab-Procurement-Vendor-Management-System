const Groq = require('groq-sdk');
const fs = require('fs');
const path = require('path');

// Load components database with error handling
let components = {};
try {
  const componentsPath = path.join(__dirname, '../data/components.json');
  console.log('📦 Loading components from:', componentsPath);
  
  if (!fs.existsSync(componentsPath)) {
    throw new Error(`Components database not found at ${componentsPath}`);
  }
  
  const fileContent = fs.readFileSync(componentsPath, 'utf-8');
  components = JSON.parse(fileContent);
  console.log('✅ Components database loaded successfully');
} catch (err) {
  console.error('❌ Error loading components database:', err.message);
  // Provide fallback empty structure
  components = {
    'CPU': [], 'GPU': [], 'RAM': [], 'Storage': [], 
    'Motherboard': [], 'PSU': [], 'Cooling': [], 'Monitor': []
  };
}

// Lab type profiles with specifications
const labTypeProfiles = {
  Graphics: {
    minGPUMemory: '8GB',
    minRAM: '32GB',
    minCPUCores: 8,
    minPower: 1200,
    essentialSoftware: ['CUDA', 'OpenGL', 'Unity', 'Unreal Engine', 'Blender'],
    priority: 'GPU-focused',
    description: 'Graphics rendering and game development lab'
  },
  Networking: {
    minRAM: '16GB',
    minCPUCores: 4,
    minPower: 600,
    essentialSoftware: ['Cisco Packet Tracer', 'Wireshark', 'GNS3', 'Linux'],
    priority: 'Networking-focused',
    description: 'Network administration and security lab'
  },
  AI: {
    minGPUMemory: '24GB',
    minRAM: '64GB',
    minCPUCores: 16,
    minPower: 1600,
    essentialSoftware: ['PyTorch', 'TensorFlow', 'CUDA', 'Python', 'Jupyter'],
    priority: 'Compute-intensive',
    description: 'AI/ML training and research lab'
  },
  Thesis: {
    minRAM: '16GB',
    minCPUCores: 6,
    minPower: 800,
    essentialSoftware: ['MATLAB', 'R', 'Python', 'Visual Studio', 'Git'],
    priority: 'Balanced',
    description: 'Research and thesis development lab'
  },
  Normal: {
    minRAM: '8GB',
    minCPUCores: 4,
    minPower: 500,
    essentialSoftware: ['Office', 'IDE', 'Git', 'Web Browsers'],
    priority: 'General-purpose',
    description: 'General computing and development lab'
  }
};

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Main function to generate AI-powered build recommendations
 */
async function generateBuildRecommendation(labType, requirements, budget, numberOfSystems) {
  try {
    console.log('🤖 Starting AI recommendation generation...');
    console.log(`Lab Type: ${labType}, Budget: $${budget}, Systems: ${numberOfSystems}`);

    // Validate Groq API key
    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY environment variable is not set');
    }

    const profile = labTypeProfiles[labType] || labTypeProfiles.Normal;

    // Step 1: Use Groq to analyze requirements and provide guidance
    console.log('📊 Step 1: Analyzing requirements with Groq AI...');
    const analysisPrompt = `
You are a lab infrastructure expert providing hardware recommendations.

Lab Type: ${labType}
Lab Description: ${profile.description}
Requirements: ${requirements}
Budget Per System: $${budget / numberOfSystems}
Total Number of Systems: ${numberOfSystems}
Lab Priority: ${profile.priority}

Analyze the requirements and provide ONLY a JSON response (no markdown, no extra text):
{
  "systemCategory": "recommended system tier (Budget/Mid-Range/High-End/Premium)",
  "keyPriorities": ["priority1", "priority2", "priority3"],
  "recommendedCPUTier": "Budget/High-End/Premium",
  "requiresGPU": true/false,
  "recommendedGPUTier": "Budget/High-End/Premium/AI",
  "recommendedRAMAmount": number_in_GB,
  "recommendedStorageAmount": number_in_TB,
  "estimatedCostPerSystem": number,
  "budgetAdvice": "brief advice on budget allocation",
  "powerConsumptionEstimate": number_in_watts
}`;

    const analysisResponse = await groq.chat.completions.create({
      messages: [{ role: 'user', content: analysisPrompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 500,
      response_format: { type: 'json_object' }
    });

    const analysisText = analysisResponse.choices[0]?.message?.content || '{}';
    let analysis;
    try {
      analysis = JSON.parse(analysisText);
    } catch (parseErr) {
      console.error('❌ Failed to parse Groq response:', analysisText);
      throw new Error(`Invalid JSON response from Groq API: ${parseErr.message}`);
    }
    console.log('✅ Analysis complete:', analysis);

    // Step 2: Select optimal components
    console.log('🔧 Step 2: Selecting optimal components...');
    const recommendedComponents = selectOptimalComponents(
      profile,
      analysis,
      budget,
      numberOfSystems
    );

    // Step 3: Calculate costs and discounts
    console.log('💰 Step 3: Calculating costs and bulk discounts...');
    const costBreakdown = calculateCosts(recommendedComponents, numberOfSystems);

    // Step 4: Estimate power consumption and cooling
    console.log('⚡ Step 4: Estimating power and cooling requirements...');
    const powerEstimate = calculatePowerConsumption(recommendedComponents, numberOfSystems);

    // Step 5: Generate detailed recommendation report
    const recommendation = {
      success: true,
      generatedAt: new Date().toISOString(),
      labType,
      numberOfSystems,
      
      // Components breakdown
      suggestedComponents: recommendedComponents.map(comp => ({
        category: comp.category,
        id: comp.id,
        name: comp.name,
        specs: comp.specs,
        unitPrice: comp.price,
        unitPriceFormatted: `৳${comp.price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
        quantity: comp.quantity,
        subtotal: comp.price * comp.quantity,
        subtotalFormatted: `৳${(comp.price * comp.quantity).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
        powerPerUnit: comp.powerConsumption,
        currency: 'BDT'
      })),

      // Cost analysis
      costAnalysis: {
        componentCost: costBreakdown.totalComponent,
        componentCostFormatted: `৳${costBreakdown.totalComponent.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
        bulkDiscountPercentage: costBreakdown.discount,
        discountAmount: costBreakdown.discountAmount,
        discountAmountFormatted: `৳${costBreakdown.discountAmount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
        finalTotalCost: costBreakdown.totalCost,
        finalTotalCostFormatted: `৳${costBreakdown.totalCost.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
        costPerSystem: costBreakdown.costPerSystem,
        costPerSystemFormatted: `৳${costBreakdown.costPerSystem.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
        costPerComponent: costBreakdown.breakdown,
        withinBudget: costBreakdown.totalCost <= (budget * numberOfSystems),
        budgetStatus: costBreakdown.totalCost <= (budget * numberOfSystems) 
          ? '✅ Within budget' 
          : `⚠️ Exceeds budget by ৳${(costBreakdown.totalCost - (budget * numberOfSystems)).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
        currency: 'BDT'
      },

      // Power requirements
      powerRequirements: {
        powerPerSystem: powerEstimate.perSystem,
        totalPowerConsumption: powerEstimate.total,
        recommendedPSUWattage: calculatePSUWattage(powerEstimate.perSystem),
        recommendedUPSCapacity: calculateUPSCapacity(powerEstimate.total),
        coolingRecommendation: calculateCoolingRequirement(powerEstimate.total)
      },

      // Recommendations and notes
      recommendations: {
        estimatedDeliveryTime: '4-6 weeks',
        warrantyPeriod: '3 years',
        maintenanceCost: Math.round(costBreakdown.totalCost * 0.05), // 5% per year
        estimatedLifespan: '4-5 years',
        supportLevel: 'Enterprise on-site support recommended for ${numberOfSystems}+ systems'
      },

      // Software recommendations
      softwareStack: profile.essentialSoftware,
      
      // Vendor information
      vendorNotes: `${numberOfSystems} systems bulk purchase - Eligible for volume discounts`,
      
      // Detailed breakdown
      breakdown: costBreakdown.breakdown
    };

    console.log('✅ Recommendation generation complete!');
    return recommendation;

  } catch (error) {
    console.error('❌ AI Recommendation Error:', error);
    throw new Error('Failed to generate recommendations: ' + error.message);
  }
}

/**
 * Select optimal components based on analysis and budget
 */
function selectOptimalComponents(profile, analysis, budget, numberOfSystems) {
  const selected = [];
  const budgetPerSystem = budget / numberOfSystems;

  console.log(`💳 Budget per system: $${budgetPerSystem.toFixed(2)}`);

  // Validate and cap recommended RAM amount to reasonable levels (max 128GB per system)
  const maxRAMRecommendation = 128;
  const cappedRAMAmount = Math.min(analysis.recommendedRAMAmount || 16, maxRAMRecommendation);
  console.log(`📊 RAM recommendation: ${cappedRAMAmount}GB per system (capped at ${maxRAMRecommendation}GB max)`);

  // Helper function to find best component with variety
  const findBest = (category, maxPrice, preference = 'balanced') => {
    const categoryComponents = components[category] || [];
    const available = categoryComponents.filter(
      c => c.price <= maxPrice && c.availability === 'stock'
    );

    if (available.length === 0) {
      // If none found, take cheapest
      return categoryComponents.filter(c => c.availability === 'stock').sort((a, b) => a.price - b.price)[0];
    }

    let sorted = [];
    
    if (preference === 'performance') {
      // Sort by performance (highest first)
      sorted = available.sort((a, b) => b.performance - a.performance);
    } else if (preference === 'capacity') {
      // Sort by capacity (highest first)
      sorted = available.sort((a, b) => (b.capacity || 0) - (a.capacity || 0));
    } else {
      // Balanced - best value
      sorted = available.sort((a, b) => {
        const aValue = (a.performance || 5) / a.price;
        const bValue = (b.performance || 5) / b.price;
        return bValue - aValue;
      });
    }

    // Add variety: randomly pick from top 3 candidates instead of always first
    // This ensures variety while maintaining quality
    const topCandidates = sorted.slice(0, Math.min(3, sorted.length));
    const randomIndex = Math.floor(Math.random() * topCandidates.length);
    return topCandidates[randomIndex];
  };

  // 1. SELECT CPU
  const cpuBudget = budgetPerSystem * 0.25;
  const cpu = findBest('CPU', cpuBudget, 'performance');
  if (cpu) {
    selected.push({ ...cpu, category: 'CPU', quantity: numberOfSystems });
    console.log(`✓ CPU: ${cpu.name} (৳${cpu.price})`);
  }

  // 2. SELECT GPU (if needed)
  if (analysis.requiresGPU) {
    const gpuBudget = budgetPerSystem * 0.4;
    const gpu = findBest('GPU', gpuBudget, 'performance');
    if (gpu) {
      selected.push({ ...gpu, category: 'GPU', quantity: numberOfSystems });
      console.log(`✓ GPU: ${gpu.name} (৳${gpu.price})`);
    }
  }

  // 3. SELECT MOTHERBOARD
  const moboBudget = budgetPerSystem * 0.12;
  const mobo = findBest('Motherboard', moboBudget, 'balanced');
  if (mobo) {
    selected.push({ ...mobo, category: 'Motherboard', quantity: numberOfSystems });
    console.log(`✓ Motherboard: ${mobo.name} (৳${mobo.price})`);
  }

  // 4. SELECT RAM
  const ramBudget = budgetPerSystem * 0.18;
  const ram = findBest('RAM', ramBudget, 'capacity');
  if (ram) {
    // Determine quantity of RAM sticks needed based on capped recommendation
    const ramQuantity = Math.ceil(cappedRAMAmount / (ram.capacity || 16));
    // Limit to maximum 4 sticks per system for practical reasons
    const limitedRamQuantity = Math.min(ramQuantity, 4);
    selected.push({ ...ram, category: 'RAM', quantity: numberOfSystems * limitedRamQuantity });
    console.log(`✓ RAM: ${ram.name} x${limitedRamQuantity} per system (৳${ram.price}/stick)`);
  }

  // 5. SELECT STORAGE (SSD preferred)
  const storageBudget = budgetPerSystem * 0.15;
  const ssd = findBest('SSD', storageBudget, 'capacity');
  if (ssd) {
    selected.push({ ...ssd, category: 'SSD', quantity: numberOfSystems });
    console.log(`✓ SSD: ${ssd.name} (৳${ssd.price})`);
  } else {
    // Fallback to HDD if no SSD available
    const hdd = findBest('HDD', storageBudget, 'capacity');
    if (hdd) {
      selected.push({ ...hdd, category: 'HDD', quantity: numberOfSystems });
      console.log(`✓ HDD: ${hdd.name} (৳${hdd.price})`);
    }
  }

  // 6. SELECT PSU
  const psuBudget = budgetPerSystem * 0.08;
  const psu = findBest('PSU', psuBudget, 'balanced');
  if (psu) {
    selected.push({ ...psu, category: 'PSU', quantity: numberOfSystems });
    console.log(`✓ PSU: ${psu.name} (৳${psu.price})`);
  }

  // 7. SELECT COOLING
  const coolBudget = budgetPerSystem * 0.05;
  const cooling = findBest('Cooling', coolBudget, 'balanced');
  if (cooling) {
    selected.push({ ...cooling, category: 'Cooling', quantity: numberOfSystems });
    console.log(`✓ Cooling: ${cooling.name} (৳${cooling.price})`);
  }

  // 8. SELECT MONITOR (optional, if budget allows)
  const remainingBudget = budgetPerSystem - selected.reduce((sum, c) => sum + c.price, 0);
  if (remainingBudget > 2000) {
    const monitor = findBest('Monitor', remainingBudget, 'balanced');
    if (monitor) {
      selected.push({ ...monitor, category: 'Monitor', quantity: numberOfSystems });
      console.log(`✓ Monitor: ${monitor.name} (৳${monitor.price})`);
    }
  }

  return selected;
}

/**
 * Calculate total costs and bulk discounts
 */
function calculateCosts(components, numberOfSystems) {
  let totalComponent = 0;
  const breakdown = [];

  // Calculate component costs
  const componentBreakdown = components.reduce((acc, comp) => {
    const itemTotal = comp.price * comp.quantity;
    totalComponent += itemTotal;

    // Group by category
    if (!acc[comp.category]) {
      acc[comp.category] = [];
    }
    acc[comp.category].push({
      name: comp.name,
      unitPrice: comp.price,
      quantity: comp.quantity,
      subtotal: itemTotal
    });

    return acc;
  }, {});

  // Convert breakdown to array format
  Object.entries(componentBreakdown).forEach(([category, items]) => {
    items.forEach(item => {
      breakdown.push({ ...item, category });
    });
  });

  // Calculate bulk discount based on number of systems
  let discountPercentage = 0;
  if (numberOfSystems >= 50) discountPercentage = 0.25;
  else if (numberOfSystems >= 20) discountPercentage = 0.20;
  else if (numberOfSystems >= 11) discountPercentage = 0.15;
  else if (numberOfSystems >= 6) discountPercentage = 0.10;

  const discountAmount = totalComponent * discountPercentage;
  const totalCost = totalComponent - discountAmount;
  const costPerSystem = totalCost / numberOfSystems;

  return {
    totalComponent: Math.round(totalComponent),
    discount: `${(discountPercentage * 100).toFixed(0)}%`,
    discountAmount: Math.round(discountAmount),
    totalCost: Math.round(totalCost),
    costPerSystem: Math.round(costPerSystem),
    breakdown
  };
}

/**
 * Calculate power consumption requirements
 */
function calculatePowerConsumption(components, numberOfSystems) {
  // Calculate total power per system
  const perSystemPower = components.reduce((sum, comp) => {
    return sum + ((comp.powerConsumption || 0) * Math.ceil(comp.quantity / numberOfSystems));
  }, 0);

  // Add overhead for PSU inefficiency and cooling (30% overhead)
  const totalPerSystem = Math.round(perSystemPower * 1.3);
  const totalForLab = totalPerSystem * numberOfSystems;

  return {
    perSystem: totalPerSystem,
    total: totalForLab,
    unit: 'W'
  };
}

/**
 * Calculate appropriate PSU wattage
 */
function calculatePSUWattage(powerPerSystem) {
  // PSU should be 20-30% higher than max system power
  const recommended = Math.round(powerPerSystem * 1.3 / 50) * 50; // Round to nearest 50W
  return `${recommended}W minimum`;
}

/**
 * Calculate UPS capacity needed
 */
function calculateUPSCapacity(totalPower) {
  // UPS should handle 1.5x peak power for 15-30 min backup
  const upsKVA = Math.ceil((totalPower * 1.5) / 1000);
  return `${upsKVA}kVA recommended (${Math.round(totalPower * 1.5 / 1000 * 100) / 100}kW)`;
}

/**
 * Calculate cooling requirements
 */
function calculateCoolingRequirement(totalPower) {
  // Rough estimation: 1W power ≈ 3.4 BTU/hr heat dissipation
  const btuPerHour = Math.round(totalPower * 3.4);
  const tonsCooling = Math.round((btuPerHour / 12000) * 10) / 10;
  
  return {
    btuPerHour,
    tonsCooling,
    recommendation: tonsCooling < 2 ? 'Standard AC sufficient' : `Professional cooling ${tonsCooling}+ tons required`
  };
}

module.exports = {
  generateBuildRecommendation,
  labTypeProfiles
};
