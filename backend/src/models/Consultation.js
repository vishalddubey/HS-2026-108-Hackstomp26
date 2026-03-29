const mongoose = require('mongoose');

const consultationSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  healthWorker: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  symptoms: [{
    name: String,
    severity: { type: String, enum: ['mild', 'moderate', 'severe'], default: 'mild' },
    duration: String
  }],
  symptomNotes: { type: String },
  durationOfIllness: { type: String },
  temperature: { type: Number },
  triageResult: {
    possibleConditions: [{ name: String, confidence: Number }],
    urgencyLevel: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'low' },
    recommendation: String,
    riskScore: { type: Number, default: 0 },
    aiGenerated: { type: Boolean, default: false }
  },
  guidance: { type: String },
  referralGenerated: { type: Boolean, default: false },
  referralTo: { type: String },
  status: { type: String, enum: ['open', 'referred', 'resolved', 'follow-up'], default: 'open' },
  followUpDate: { type: Date },
  offlineId: { type: String },
  synced: { type: Boolean, default: true }
}, { timestamps: true });

consultationSchema.index({ patient: 1, createdAt: -1 });
consultationSchema.index({ 'triageResult.urgencyLevel': 1 });
consultationSchema.index({ healthWorker: 1 });

module.exports = mongoose.model('Consultation', consultationSchema);
