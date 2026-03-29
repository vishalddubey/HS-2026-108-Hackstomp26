const express = require('express');
const Patient = require('../models/Patient');
const Consultation = require('../models/Consultation');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/stats', auth, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - Number(days));

    const [
      totalPatients,
      highRiskPatients,
      recentConsultations,
      urgencyBreakdown,
      topSymptoms,
      villageCounts,
      recentActivity
    ] = await Promise.all([
      Patient.countDocuments(),
      Patient.countDocuments({ isHighRisk: true }),
      Consultation.countDocuments({ createdAt: { $gte: since } }),
      Consultation.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: '$triageResult.urgencyLevel', count: { $sum: 1 } } }
      ]),
      Consultation.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $unwind: '$symptoms' },
        { $group: { _id: '$symptoms.name', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 }
      ]),
      Patient.aggregate([
        { $group: { _id: '$village', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      Consultation.find({ createdAt: { $gte: since } })
        .populate('patient', 'name village age')
        .sort({ createdAt: -1 })
        .limit(10)
        .select('patient triageResult.urgencyLevel createdAt status')
    ]);

    // Daily trend
    const dailyTrend = await Consultation.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          highRisk: {
            $sum: {
              $cond: [{ $in: ['$triageResult.urgencyLevel', ['high', 'critical']] }, 1, 0]
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const urgencyMap = {};
    urgencyBreakdown.forEach(u => { urgencyMap[u._id] = u.count; });

    res.json({
      overview: {
        totalPatients,
        highRiskPatients,
        recentConsultations,
        followUpCases: await Consultation.countDocuments({ status: 'follow-up' }),
        referralsMade: await Consultation.countDocuments({ referralGenerated: true, createdAt: { $gte: since } })
      },
      urgencyBreakdown: {
        low: urgencyMap.low || 0,
        medium: urgencyMap.medium || 0,
        high: urgencyMap.high || 0,
        critical: urgencyMap.critical || 0
      },
      topSymptoms: topSymptoms.map(s => ({ symptom: s._id, count: s.count })),
      villageData: villageCounts.map(v => ({ village: v._id, patients: v.count })),
      dailyTrend,
      recentActivity
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats', details: err.message });
  }
});

module.exports = router;
