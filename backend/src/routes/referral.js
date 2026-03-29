const express = require('express');
const Consultation = require('../models/Consultation');
const Patient = require('../models/Patient');
const { auth } = require('../middleware/auth');
const triageEngine = require('../services/triageEngine');

const router = express.Router();

// Generate referral
router.post('/generate/:consultationId', auth, async (req, res) => {
  try {
    const consultation = await Consultation.findById(req.params.consultationId).populate('patient');
    if (!consultation) return res.status(404).json({ error: 'Consultation not found' });

    const { referralTo = 'District Hospital', notes = '' } = req.body;
    const patient = consultation.patient;
    const facilities = triageEngine.getNearestFacilities(consultation.triageResult.urgencyLevel);

    const referral = {
      referralId: 'REF-' + Date.now().toString(36).toUpperCase(),
      generatedAt: new Date().toISOString(),
      patient: {
        name: patient.name,
        age: patient.age,
        gender: patient.gender,
        village: patient.village,
        phone: patient.phone,
        medicalHistory: patient.medicalHistory,
        allergies: patient.allergies
      },
      consultation: {
        date: consultation.createdAt,
        symptoms: consultation.symptoms,
        duration: consultation.durationOfIllness,
        temperature: consultation.temperature,
        triageResult: consultation.triageResult,
        guidance: consultation.guidance
      },
      referralTo,
      referringWorker: req.user.name,
      urgency: consultation.triageResult.urgencyLevel,
      facilities,
      notes,
      instructions: getTransportInstructions(consultation.triageResult.urgencyLevel)
    };

    // Update consultation
    consultation.referralGenerated = true;
    consultation.referralTo = referralTo;
    consultation.status = 'referred';
    await consultation.save();

    res.json({ success: true, referral });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate referral', details: err.message });
  }
});

function getTransportInstructions(urgencyLevel) {
  const instructions = {
    critical: 'Call 108 IMMEDIATELY. Do not use private transport. Keep patient conscious and still. Do not give food or water.',
    high: 'Transport to hospital within 2 hours. Call ahead: 104. Keep patient comfortable. Carry this referral slip.',
    medium: 'Visit PHC/CHC within 24 hours. Carry this referral document. Take prescribed medicines.',
    low: 'Visit PHC within 3 days if no improvement. Follow home care guidance.'
  };
  return instructions[urgencyLevel] || instructions.medium;
}

module.exports = router;
