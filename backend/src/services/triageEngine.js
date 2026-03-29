/**
 * GramHealth AI - Triage Engine
 * Rule-based medical triage with confidence scoring
 * Designed for rural healthcare workers with limited connectivity
 */

const SYMPTOM_WEIGHTS = {
  fever: 2,
  high_fever: 4,
  cough: 1,
  severe_cough: 3,
  headache: 1,
  severe_headache: 3,
  body_pain: 1,
  chest_pain: 5,
  breathing_difficulty: 5,
  shortness_of_breath: 4,
  fatigue: 1,
  vomiting: 2,
  diarrhea: 2,
  rash: 2,
  joint_pain: 2,
  sore_throat: 1,
  runny_nose: 1,
  loss_of_consciousness: 6,
  seizure: 6,
  bleeding: 5,
  abdominal_pain: 2,
  severe_abdominal_pain: 4,
  yellow_eyes: 3,
  jaundice: 3,
  stiff_neck: 4,
  confusion: 5,
  pale_skin: 3,
  swelling: 2,
  painful_urination: 2,
  back_pain: 1,
  chills: 2,
  night_sweats: 2
};

const CONDITION_RULES = [
  {
    name: 'Dengue Fever',
    symptoms: ['fever', 'headache', 'body_pain', 'joint_pain', 'rash'],
    required: ['fever'],
    minMatch: 3,
    baseUrgency: 'high',
    confidence: 0.75
  },
  {
    name: 'Malaria',
    symptoms: ['fever', 'chills', 'headache', 'body_pain', 'fatigue', 'vomiting'],
    required: ['fever', 'chills'],
    minMatch: 3,
    baseUrgency: 'high',
    confidence: 0.7
  },
  {
    name: 'Viral Fever',
    symptoms: ['fever', 'headache', 'body_pain', 'fatigue', 'sore_throat', 'runny_nose'],
    required: ['fever'],
    minMatch: 2,
    baseUrgency: 'medium',
    confidence: 0.8
  },
  {
    name: 'Pneumonia',
    symptoms: ['fever', 'cough', 'breathing_difficulty', 'chest_pain', 'fatigue'],
    required: ['cough'],
    minMatch: 3,
    baseUrgency: 'high',
    confidence: 0.7
  },
  {
    name: 'COVID-19 / Respiratory Infection',
    symptoms: ['fever', 'cough', 'breathing_difficulty', 'fatigue', 'headache'],
    required: ['fever', 'cough'],
    minMatch: 3,
    baseUrgency: 'high',
    confidence: 0.65
  },
  {
    name: 'Typhoid Fever',
    symptoms: ['fever', 'headache', 'abdominal_pain', 'fatigue', 'vomiting', 'diarrhea'],
    required: ['fever'],
    minMatch: 3,
    baseUrgency: 'high',
    confidence: 0.7
  },
  {
    name: 'Diarrheal Disease / Gastroenteritis',
    symptoms: ['diarrhea', 'vomiting', 'abdominal_pain', 'fatigue', 'fever'],
    required: ['diarrhea'],
    minMatch: 2,
    baseUrgency: 'medium',
    confidence: 0.85
  },
  {
    name: 'Jaundice / Hepatitis',
    symptoms: ['yellow_eyes', 'jaundice', 'fatigue', 'abdominal_pain', 'vomiting'],
    required: ['yellow_eyes'],
    minMatch: 2,
    baseUrgency: 'high',
    confidence: 0.8
  },
  {
    name: 'Meningitis',
    symptoms: ['severe_headache', 'stiff_neck', 'fever', 'confusion', 'vomiting'],
    required: ['severe_headache', 'stiff_neck'],
    minMatch: 3,
    baseUrgency: 'critical',
    confidence: 0.8
  },
  {
    name: 'Cardiac Emergency',
    symptoms: ['chest_pain', 'breathing_difficulty', 'fatigue', 'pale_skin'],
    required: ['chest_pain'],
    minMatch: 2,
    baseUrgency: 'critical',
    confidence: 0.75
  },
  {
    name: 'Urinary Tract Infection',
    symptoms: ['painful_urination', 'back_pain', 'fever', 'fatigue'],
    required: ['painful_urination'],
    minMatch: 2,
    baseUrgency: 'low',
    confidence: 0.8
  },
  {
    name: 'Common Cold / URTI',
    symptoms: ['sore_throat', 'runny_nose', 'cough', 'headache', 'fatigue'],
    required: ['sore_throat'],
    minMatch: 2,
    baseUrgency: 'low',
    confidence: 0.9
  },
  {
    name: 'Severe Anemia',
    symptoms: ['pale_skin', 'fatigue', 'breathing_difficulty', 'headache'],
    required: ['pale_skin', 'fatigue'],
    minMatch: 2,
    baseUrgency: 'high',
    confidence: 0.65
  },
  {
    name: 'Stroke / Neurological Emergency',
    symptoms: ['confusion', 'loss_of_consciousness', 'severe_headache', 'seizure'],
    required: ['confusion'],
    minMatch: 2,
    baseUrgency: 'critical',
    confidence: 0.8
  }
];

const URGENCY_LEVELS = {
  low: { score: [0, 4], label: 'Low', color: 'green', action: 'Home care with monitoring' },
  medium: { score: [5, 9], label: 'Medium', color: 'yellow', action: 'Visit nearest clinic within 24 hours' },
  high: { score: [10, 14], label: 'High', color: 'orange', action: 'Seek medical attention within 6 hours' },
  critical: { score: [15, 100], label: 'Critical', color: 'red', action: 'Immediate emergency medical attention required' }
};

const GUIDANCE_MAP = {
  low: {
    general: 'Rest at home. Drink plenty of fluids. Monitor symptoms for 2-3 days.',
    fever: 'Take paracetamol for fever. Keep cool with wet cloth. Hydrate well.',
    cough: 'Honey and warm water can help. Avoid cold drinks. Breathe steam carefully.',
    diarrhea: 'Drink ORS (Oral Rehydration Solution). Avoid spicy food. Rest well.'
  },
  medium: {
    general: 'Visit your nearest Primary Health Center within 24 hours. Do not delay.',
    dengue: 'Rest. Drink fluids. NO Aspirin or Ibuprofen. Visit clinic urgently.',
    malaria: 'Visit clinic immediately for blood test. Take prescribed anti-malarials only.',
    typhoid: 'Visit clinic for blood test. Maintain hygiene. Drink only boiled water.'
  },
  high: {
    general: 'URGENT: Seek medical care within 6 hours. Contact nearest hospital.',
    pneumonia: 'Go to hospital now. You may need antibiotics and oxygen support.',
    jaundice: 'Hospital care needed. Avoid fatty foods. Rest completely.',
    anemia: 'Hospital evaluation needed. Iron-rich foods may help in mild cases.'
  },
  critical: {
    general: 'EMERGENCY: Call ambulance or go to hospital IMMEDIATELY. Do not wait.',
    cardiac: 'HEART EMERGENCY: Lie down, loosen clothing, call 108 ambulance NOW.',
    meningitis: 'BRAIN EMERGENCY: Hospital immediately. Do not delay even 1 hour.',
    stroke: 'BRAIN EMERGENCY: Do not give food/water. Hospital immediately. Call 108.'
  }
};

const NEAREST_FACILITIES = [
  { name: 'Primary Health Center', type: 'PHC', distance: '5 km', phone: '104', available: '24/7' },
  { name: 'Community Health Center', type: 'CHC', distance: '15 km', phone: '108', available: '24/7' },
  { name: 'District Hospital', type: 'Hospital', distance: '30 km', phone: '108', available: '24/7' }
];

/**
 * Main triage analysis function
 */
function analyze({ symptoms, age, gender, medicalHistory, temperature, durationOfIllness }) {
  const symptomNames = symptoms.map(s => (typeof s === 'string' ? s : s.name).toLowerCase().replace(/ /g, '_'));
  
  // Expand symptom list based on severity
  const expandedSymptoms = [...symptomNames];
  symptoms.forEach(s => {
    const name = typeof s === 'string' ? s : s.name;
    const severity = typeof s === 'object' ? s.severity : 'mild';
    if (severity === 'severe') {
      expandedSymptoms.push('severe_' + name.toLowerCase().replace(/ /g, '_'));
    }
  });

  // Add temperature-based symptoms
  if (temperature) {
    if (temperature >= 38.5) expandedSymptoms.push('fever');
    if (temperature >= 39.5) expandedSymptoms.push('high_fever');
  }

  // Calculate risk score
  let riskScore = expandedSymptoms.reduce((sum, sym) => sum + (SYMPTOM_WEIGHTS[sym] || 0), 0);

  // Age risk modifiers
  if (age < 5) riskScore *= 1.5;
  else if (age > 65) riskScore *= 1.3;
  else if (age > 50) riskScore *= 1.1;

  // Duration modifier
  if (durationOfIllness) {
    const days = parseInt(durationOfIllness);
    if (days > 7) riskScore += 2;
    if (days > 14) riskScore += 3;
  }

  // Critical symptom flags - override score
  const criticalSymptoms = ['loss_of_consciousness', 'seizure', 'confusion', 'chest_pain', 'stiff_neck'];
  const hasCritical = criticalSymptoms.some(cs => expandedSymptoms.includes(cs));
  if (hasCritical) riskScore = Math.max(riskScore, 15);

  // Match conditions
  const matchedConditions = [];
  for (const rule of CONDITION_RULES) {
    const hasRequired = rule.required.every(r => expandedSymptoms.includes(r));
    if (!hasRequired) continue;

    const matchCount = rule.symptoms.filter(s => expandedSymptoms.includes(s)).length;
    if (matchCount >= rule.minMatch) {
      const matchRatio = matchCount / rule.symptoms.length;
      matchedConditions.push({
        name: rule.name,
        confidence: Math.min(0.95, rule.confidence * (0.7 + matchRatio * 0.3)),
        urgency: rule.baseUrgency
      });
    }
  }

  // Sort by confidence
  matchedConditions.sort((a, b) => b.confidence - a.confidence);

  // Determine urgency from conditions + score
  let urgencyLevel = 'low';
  if (riskScore >= 15 || hasCritical) urgencyLevel = 'critical';
  else if (riskScore >= 10) urgencyLevel = 'high';
  else if (riskScore >= 5) urgencyLevel = 'medium';

  // Override with condition urgency if higher
  const urgencyOrder = ['low', 'medium', 'high', 'critical'];
  if (matchedConditions.length > 0) {
    const topConditionUrgency = matchedConditions[0].urgency;
    if (urgencyOrder.indexOf(topConditionUrgency) > urgencyOrder.indexOf(urgencyLevel)) {
      urgencyLevel = topConditionUrgency;
    }
  }

  const recommendation = URGENCY_LEVELS[urgencyLevel].action;

  // If no conditions matched, provide generic
  if (matchedConditions.length === 0) {
    matchedConditions.push({
      name: 'Unspecified illness - clinical evaluation needed',
      confidence: 0.5,
      urgency: urgencyLevel
    });
  }

  return {
    possibleConditions: matchedConditions.slice(0, 3),
    urgencyLevel,
    urgencyLabel: URGENCY_LEVELS[urgencyLevel].label,
    urgencyColor: URGENCY_LEVELS[urgencyLevel].color,
    recommendation,
    riskScore: Math.round(riskScore),
    aiGenerated: true,
    analyzedAt: new Date().toISOString()
  };
}

/**
 * Generate guidance text
 */
function getGuidance(triageResult) {
  const { urgencyLevel, possibleConditions } = triageResult;
  const levelGuidance = GUIDANCE_MAP[urgencyLevel];
  
  let guidance = levelGuidance.general;
  
  if (possibleConditions.length > 0) {
    const condName = possibleConditions[0].name.toLowerCase();
    if (condName.includes('dengue') && levelGuidance.dengue) guidance = levelGuidance.dengue;
    else if (condName.includes('malaria') && levelGuidance.malaria) guidance = levelGuidance.malaria;
    else if (condName.includes('typhoid') && levelGuidance.typhoid) guidance = levelGuidance.typhoid;
    else if (condName.includes('pneumonia') && levelGuidance.pneumonia) guidance = levelGuidance.pneumonia;
    else if (condName.includes('cardiac') && levelGuidance.cardiac) guidance = levelGuidance.cardiac;
    else if (condName.includes('meningitis') && levelGuidance.meningitis) guidance = levelGuidance.meningitis;
    else if (condName.includes('stroke') && levelGuidance.stroke) guidance = levelGuidance.stroke;
    else if (condName.includes('jaundice') && levelGuidance.jaundice) guidance = levelGuidance.jaundice;
  }

  return guidance;
}

/**
 * Get nearest facilities for referral
 */
function getNearestFacilities(urgencyLevel) {
  if (urgencyLevel === 'critical') return NEAREST_FACILITIES.slice(1);
  if (urgencyLevel === 'high') return NEAREST_FACILITIES;
  return NEAREST_FACILITIES.slice(0, 1);
}

module.exports = { analyze, getGuidance, getNearestFacilities };
