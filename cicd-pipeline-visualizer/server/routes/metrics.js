const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { calculateDORAMetrics } = require('../services/metricsService');

// Get overall metrics dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - days);
    
    // Get pipeline summary
    const pipelineStats = await db.query(`
      SELECT 
        COUNT(*) as total_pipelines,
        COUNT(CASE WHEN platform = 'github_actions' THEN 1 END) as github_pipelines,
        COUNT(CASE WHEN platform = 'gitlab_ci' THEN 1 END) as gitlab_pipelines,
        COUNT(CASE WHEN platform = 'jenkins' THEN 1 END) as jenkins_pipelines
      FROM pipelines
    `);
    
    // Get run statistics
    const runStats = await db.query(`
      SELECT 
        COUNT(*) as total_runs,
        COUNT(CASE WHEN status = 'completed' AND conclusion = 'success' THEN 1 END) as successful_runs,
        COUNT(CASE WHEN status = 'completed' AND conclusion = 'failure' THEN 1 END) as failed_runs,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_runs,
        COUNT(CASE WHEN status = 'queued' THEN 1 END) as queued_runs,
        AVG(CASE WHEN duration_seconds IS NOT NULL THEN duration_seconds END) as avg_duration
      FROM pipeline_runs 
      WHERE started_at >= $1
    `, [since]);
    
    // Get daily run trends
    const dailyTrends = await db.query(`
      SELECT 
        DATE(started_at) as date,
        COUNT(*) as total_runs,
        COUNT(CASE WHEN status = 'completed' AND conclusion = 'success' THEN 1 END) as successful_runs,
        COUNT(CASE WHEN status = 'completed' AND conclusion = 'failure' THEN 1 END) as failed_runs,
        AVG(CASE WHEN duration_seconds IS NOT NULL THEN duration_seconds END) as avg_duration
      FROM pipeline_runs 
      WHERE started_at >= $1
      GROUP BY DATE(started_at)
      ORDER BY date DESC
      LIMIT 30
    `, [since]);
    
    // Calculate overall DORA metrics
    const doraMetrics = await calculateDORAMetrics(null, days);
    
    res.json({
      summary: {
        pipelines: pipelineStats.rows[0],
        runs: {
          ...runStats.rows[0],
          success_rate: runStats.rows[0].total_runs > 0 ? 
            (runStats.rows[0].successful_runs / runStats.rows[0].total_runs * 100).toFixed(2) : 0
        },
        dora_metrics: doraMetrics
      },
      trends: {
        daily: dailyTrends.rows.reverse() // Reverse to show chronological order
      },
      insights: {
        failing_pipelines: [],
        slowest_pipelines: []
      },
      period_days: days
    });
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
  }
});

// Get DORA metrics for all pipelines
router.get('/dora', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const metrics = await calculateDORAMetrics(null, days);
    
    res.json({
      metrics,
      period_days: days,
      calculated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error calculating DORA metrics:', error);
    res.status(500).json({ error: 'Failed to calculate DORA metrics' });
  }
});

module.exports = router;