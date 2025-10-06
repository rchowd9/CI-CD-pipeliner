const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { calculateDORAMetrics } = require('../services/metricsService');

// Get all pipelines
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, platform } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT p.*, 
             COUNT(pr.id) as total_runs,
             COUNT(CASE WHEN pr.status = 'completed' AND pr.conclusion = 'success' THEN 1 END) as successful_runs,
             COUNT(CASE WHEN pr.status = 'completed' AND pr.conclusion = 'failure' THEN 1 END) as failed_runs,
             AVG(CASE WHEN pr.duration_seconds IS NOT NULL THEN pr.duration_seconds END) as avg_duration
      FROM pipelines p
      LEFT JOIN pipeline_runs pr ON p.id = pr.pipeline_id
      WHERE 1=1
    `;
    
    const params = [];
    if (platform) {
      query += ` AND p.platform = $${params.length + 1}`;
      params.push(platform);
    }
    
    query += `
      GROUP BY p.id
      ORDER BY p.updated_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    params.push(parseInt(limit), offset);
    
    const result = await db.query(query, params);
    
    // Calculate success rate for each pipeline
    const pipelines = result.rows.map(pipeline => ({
      ...pipeline,
      success_rate: pipeline.total_runs > 0 ? 
        ((pipeline.successful_runs / pipeline.total_runs) * 100).toFixed(2) : 0,
      avg_duration: pipeline.avg_duration ? Math.round(pipeline.avg_duration) : null
    }));
    
    res.json({
      pipelines,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: pipelines.length
      }
    });
  } catch (error) {
    console.error('Error fetching pipelines:', error);
    res.status(500).json({ error: 'Failed to fetch pipelines' });
  }
});

// Get pipeline by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get pipeline details
    const pipelineResult = await db.query(
      'SELECT * FROM pipelines WHERE id = $1',
      [id]
    );
    
    if (pipelineResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pipeline not found' });
    }
    
    const pipeline = pipelineResult.rows[0];
    
    // Get recent runs
    const runsResult = await db.query(`
      SELECT * FROM pipeline_runs 
      WHERE pipeline_id = $1 
      ORDER BY started_at DESC 
      LIMIT 20
    `, [id]);
    
    // Get DORA metrics for the last 30 days
    const metricsResult = await db.query(`
      SELECT * FROM dora_metrics 
      WHERE pipeline_id = $1 
      AND date >= CURRENT_DATE - INTERVAL '30 days'
      ORDER BY date DESC
    `, [id]);
    
    res.json({
      pipeline,
      recent_runs: runsResult.rows,
      dora_metrics: metricsResult.rows
    });
  } catch (error) {
    console.error('Error fetching pipeline:', error);
    res.status(500).json({ error: 'Failed to fetch pipeline' });
  }
});

// Create new pipeline
router.post('/', async (req, res) => {
  try {
    const { name, platform, repository_url, webhook_url, config } = req.body;
    
    if (!name || !platform || !repository_url) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, platform, repository_url' 
      });
    }
    
    const result = await db.query(`
      INSERT INTO pipelines (name, platform, repository_url, webhook_url, config)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [name, platform, repository_url, webhook_url, config]);
    
    // Emit real-time update
    const io = req.app.get('io');
    io.emit('pipeline-created', result.rows[0]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating pipeline:', error);
    if (error.code === '23505') { // Unique constraint violation
      res.status(409).json({ error: 'Pipeline with this name and repository already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create pipeline' });
    }
  }
});

module.exports = router;