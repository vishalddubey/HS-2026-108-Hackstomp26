const express = require('express');
const { body, validationResult } = require('express-validator');
const Consultation = require('../models/Consultation');
const Patient = require('../models/Patient');
const { auth } = require('../middleware/auth');
const triageEngine = require('../services/triageEngine');

const router = express.Router();

// Run triage
router.post('/analyze', auth, [
  body('patientId').notEmpty().withMessage('Patient ID required'),
  body('symptoms').isArray({ min: 1 }).withMessage('At least one symptom required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { patientId, symptoms, symptomNotes, durationOfIllness, temperature } = req.body;

    const patient = await Patient.findById(patientId);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    // Run triage analysis
    const triageResult = triageEngine.analyze({
      symptoms,
      age: patient.age,
      gender: patient.gender,
      medicalHistory: patient.medicalHistory,
      temperature,
      durationOfIllness
    });

    // Create consultation record
    const consultation = await Consultation.create({
      patient: patientId,
      healthWorker: req.user._id,
      symptoms,
      symptomNotes,
      durationOfIllness,
      temperature,
      triageResult,
      guidance: triageEngine.getGuidance(triageResult),
      referralGenerated: ['high', 'critical'].includes(triageResult.urgencyLevel)
    });

    // Update patient
    const updateData = { lastVisit: new Date() };
    if (['high', 'critical'].includes(triageResult.urgencyLevel)) {
      updateData.isHighRisk = true;
    }
    await Patient.findByIdAndUpdate(patientId, { 
      $push: { consultations: consultation._id },
      ...updateData
    });

    res.json({ 
      success: true, 
      consultation,
      triageResult,
      guidance: consultation.guidance,
      requiresReferral: ['high', 'critical'].includes(triageResult.urgencyLevel)
    });
  } catch (err) {
    res.status(500).json({ error: 'Triage analysis failed', details: err.message });
  }
});

// Get consultation by ID
router.get('/consultation/:id', auth, async (req, res) => {
  try {
    const consultation = await Consultation.findById(req.params.id).populate('patient', 'name age gender village');
    if (!consultation) return res.status(404).json({ error: 'Consultation not found' });
    res.json({ consultation });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch consultation' });
  }
});

module.exports = router;
