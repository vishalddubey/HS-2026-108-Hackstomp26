const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Patient = require('../models/Patient');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Create patient
router.post('/', auth, [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('age').isInt({ min: 0, max: 150 }).withMessage('Valid age required'),
  body('gender').isIn(['male', 'female', 'other']).withMessage('Valid gender required'),
  body('village').trim().notEmpty().withMessage('Village is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const patient = await Patient.create({ ...req.body, registeredBy: req.user._id });
    res.status(201).json({ success: true, patient });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create patient', details: err.message });
  }
});

// Get all patients
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, village, highRisk } = req.query;
    const filter = {};
    if (search) filter.$text = { $search: search };
    if (village) filter.village = new RegExp(village, 'i');
    if (highRisk === 'true') filter.isHighRisk = true;

    const patients = await Patient.find(filter)
      .populate('registeredBy', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Patient.countDocuments(filter);
    res.json({ patients, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

// Get single patient
router.get('/:id', auth, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id)
      .populate('registeredBy', 'name')
      .populate('consultations');
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    res.json({ patient });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch patient' });
  }
});

// Update patient
router.put('/:id', auth, async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    res.json({ success: true, patient });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update patient' });
  }
});

// Bulk sync (for offline records)
router.post('/sync', auth, async (req, res) => {
  try {
    const { patients } = req.body;
    const results = [];

    for (const p of patients) {
      const existing = await Patient.findOne({ offlineId: p.offlineId });
      if (existing) {
        results.push({ offlineId: p.offlineId, status: 'skipped', _id: existing._id });
      } else {
        const created = await Patient.create({ ...p, registeredBy: req.user._id, synced: true });
        results.push({ offlineId: p.offlineId, status: 'created', _id: created._id });
      }
    }

    res.json({ success: true, results });
  } catch (err) {
    res.status(500).json({ error: 'Sync failed', details: err.message });
  }
});

module.exports = router;
