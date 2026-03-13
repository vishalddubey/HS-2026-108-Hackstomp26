const express = require('express');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get available symptoms list
router.get('/list', auth, (req, res) => {
  const symptoms = [
    { id: 'fever', label: 'Fever', icon: '🌡️', category: 'general', description: 'High body temperature' },
    { id: 'cough', label: 'Cough', icon: '😮‍💨', category: 'respiratory', description: 'Dry or wet cough' },
    { id: 'headache', label: 'Headache', icon: '🤕', category: 'neurological', description: 'Head pain or pressure' },
    { id: 'body_pain', label: 'Body Pain', icon: '💢', category: 'general', description: 'Muscle aches and pains' },
    { id: 'fatigue', label: 'Fatigue', icon: '😴', category: 'general', description: 'Extreme tiredness' },
    { id: 'chest_pain', label: 'Chest Pain', icon: '💔', category: 'cardiac', description: 'Pain or pressure in chest' },
    { id: 'breathing_difficulty', label: 'Breathing Difficulty', icon: '🫁', category: 'respiratory', description: 'Hard to breathe' },
    { id: 'vomiting', label: 'Vomiting', icon: '🤢', category: 'digestive', description: 'Nausea and vomiting' },
    { id: 'diarrhea', label: 'Diarrhea', icon: '🚽', category: 'digestive', description: 'Loose stools' },
    { id: 'rash', label: 'Rash / Skin Spots', icon: '🔴', category: 'skin', description: 'Skin redness or spots' },
    { id: 'joint_pain', label: 'Joint Pain', icon: '🦴', category: 'musculoskeletal', description: 'Pain in joints' },
    { id: 'sore_throat', label: 'Sore Throat', icon: '🗣️', category: 'respiratory', description: 'Throat pain or irritation' },
    { id: 'runny_nose', label: 'Runny Nose', icon: '🤧', category: 'respiratory', description: 'Nasal discharge' },
    { id: 'yellow_eyes', label: 'Yellow Eyes/Skin', icon: '👁️', category: 'hepatic', description: 'Yellowing of eyes or skin' },
    { id: 'abdominal_pain', label: 'Stomach Pain', icon: '🫀', category: 'digestive', description: 'Pain in stomach area' },
    { id: 'stiff_neck', label: 'Stiff Neck', icon: '🏋️', category: 'neurological', description: 'Neck stiffness or pain' },
    { id: 'confusion', label: 'Confusion', icon: '😵', category: 'neurological', description: 'Mental confusion or disorientation' },
    { id: 'pale_skin', label: 'Pale Skin', icon: '🫥', category: 'general', description: 'Unusual paleness' },
    { id: 'swelling', label: 'Swelling', icon: '🦵', category: 'general', description: 'Swelling in body parts' },
    { id: 'painful_urination', label: 'Painful Urination', icon: '🚱', category: 'urological', description: 'Burning sensation while urinating' },
    { id: 'chills', label: 'Chills/Shivering', icon: '🥶', category: 'general', description: 'Feeling cold and shivering' },
    { id: 'night_sweats', label: 'Night Sweats', icon: '💧', category: 'general', description: 'Sweating excessively at night' },
    { id: 'loss_of_consciousness', label: 'Loss of Consciousness', icon: '😶', category: 'emergency', description: 'Fainting or unconsciousness' },
    { id: 'seizure', label: 'Seizure / Fits', icon: '⚡', category: 'emergency', description: 'Uncontrolled shaking or fits' },
    { id: 'bleeding', label: 'Unusual Bleeding', icon: '🩸', category: 'emergency', description: 'Bleeding from anywhere' }
  ];

  res.json({ symptoms });
});

module.exports = router;
