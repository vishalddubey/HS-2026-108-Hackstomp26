const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  patientId: {
    type: String,
    unique: true,
    default: () => 'PAT-' + Date.now().toString(36).toUpperCase()
  },
  name: { type: String, required: true, trim: true },
  age: { type: Number, required: true, min: 0, max: 150 },
  gender: { type: String, enum: ['male', 'female', 'other'], required: true },
  village: { type: String, required: true, trim: true },
  phone: { type: String, trim: true },
  medicalHistory: { type: String, trim: true, default: '' },
  allergies: { type: String, trim: true, default: '' },
  bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'], default: 'unknown' },
  registeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  consultations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Consultation' }],
  isHighRisk: { type: Boolean, default: false },
  lastVisit: { type: Date },
  offlineId: { type: String }, // for offline sync
  synced: { type: Boolean, default: true }
}, { timestamps: true });

patientSchema.index({ name: 'text', village: 'text' });
patientSchema.index({ village: 1 });
patientSchema.index({ isHighRisk: 1 });

module.exports = mongoose.model('Patient', patientSchema);
