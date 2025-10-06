const cron = require('node-cron');
const db = require('../config/database');
const { calculateDORAMetrics } = require('./metricsService');

/**
 * Initialize all cron jobs for the application
 * @param {Object} io - Socket.IO instance for real-time updates
 */
const initializeCronJobs = (io) => {
  console.log('🕒 Initializing cron jobs...');
  
  // Update DORA metrics every hour
  cron.schedule('0 * * * *', async () => {
    console.log('📊 Updating DORA metrics...');
    try {
      await updateAllDORAMetrics();
      console.log('✅ DORA metrics updated successfully');
    } catch (error) {
      console.error('❌ Failed to update DORA metrics:', error);
    }
  });
  
  // Clean up old data every day at 2 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('🧹 Cleaning up old data...');
    try {
      await cleanupOldData();
      console.log('✅ Old data cleaned up successfully');
    } catch (error) {
      console.error('❌ Failed to cleanup old data:', error);
    }
  });
  
  // Generate alerts every 30 minutes
  cron.schedule('*/30 * * * *', async () => {
    console.log('🚨 Checking for alerts...');
    try {
      await generateAlerts(io);
      console.log('✅ Alerts checked successfully');
    } catch (error) {
      console.error('❌ Failed to generate alerts:', error);
    }
  });
  
  console.log('✅ All cron jobs initialized');
};

/**
 * Update DORA metrics for all pipelines
 */
const updateAllDORAMetrics = async () => {
  try {
    // Get all active pipelines
    const pipelines = await db.query(`
      SELECT id FROM pipelines 
      WHERE updated_at >= CURRENT_DATE - INTERVAL '7 days'
    `);
    
    for (const pipeline of pipelines.rows) {
      await calculateDORAMetrics(pipeline.id, 30);
    }
  } catch (error) {
    console.error('Error updating DORA metrics:', error);
    throw error;
  }
};

/**
 * Clean up old data to keep database size manageable
 */
const cleanupOldData = async () => {
  try {
    // Keep pipeline runs for 90 days
    const oldRunsResult = await db.query(`
      DELETE FROM pipeline_runs 
      WHERE started_at < CURRENT_DATE - INTERVAL '90 days'
    `);
    console.log(`🗑️ Deleted ${oldRunsResult.rowCount} old pipeline runs`);
    
    // Keep DORA metrics for 1 year
    const oldMetricsResult = await db.query(`
      DELETE FROM dora_metrics 
      WHERE date < CURRENT_DATE - INTERVAL '1 year'
    `);
    console.log(`🗑️ Deleted ${oldMetricsResult.rowCount} old DORA metrics`);
    
    // Keep resolved alerts for 30 days
    const oldAlertsResult = await db.query(`
      DELETE FROM alerts 
      WHERE is_resolved = true 
        AND resolved_at < CURRENT_DATE - INTERVAL '30 days'
    `);
    console.log(`🗑️ Deleted ${oldAlertsResult.rowCount} old resolved alerts`);
    
    // Vacuum analyze to optimize database
    await db.query('VACUUM ANALYZE');
    console.log('🧹 Database optimized');
    
  } catch (error) {
    console.error('Error cleaning up old data:', error);
    throw error;
  }
};

/**
 * Generate alerts based on pipeline performance
 */
const generateAlerts = async (io) => {
  try {
    // Check for high failure rates
    const highFailureRate = await db.query(`
      SELECT 
        p.id as pipeline_id,
        p.name as pipeline_name,
        COUNT(pr.id) as total_runs,
        COUNT(CASE WHEN pr.conclusion = 'failure' THEN 1 END) as failed_runs,
        ROUND(
          COUNT(CASE WHEN pr.conclusion = 'failure' THEN 1 END)::decimal / 
          COUNT(pr.id) * 100, 2
        ) as failure_rate
      FROM pipelines p
      JOIN pipeline_runs pr ON p.id = pr.pipeline_id
      WHERE pr.started_at >= CURRENT_DATE - INTERVAL '24 hours'
      GROUP BY p.id, p.name
      HAVING COUNT(pr.id) >= 3 
        AND ROUND(
          COUNT(CASE WHEN pr.conclusion = 'failure' THEN 1 END)::decimal / 
          COUNT(pr.id) * 100, 2
        ) > 50
    `);
    
    for (const pipeline of highFailureRate.rows) {
      // Check if alert already exists
      const existingAlert = await db.query(`
        SELECT id FROM alerts 
        WHERE pipeline_id = $1 
          AND alert_type = 'high_failure_rate' 
          AND is_resolved = false
          AND created_at >= CURRENT_DATE - INTERVAL '1 day'
      `, [pipeline.pipeline_id]);
      
      if (existingAlert.rows.length === 0) {
        await db.query(`
          INSERT INTO alerts (pipeline_id, alert_type, severity, message)
          VALUES ($1, 'high_failure_rate', 'high', $2)
        `, [
          pipeline.pipeline_id,
          `Pipeline "${pipeline.pipeline_name}" has ${pipeline.failure_rate}% failure rate in the last 24 hours`
        ]);
        
        // Emit real-time alert
        io.emit('alert-created', {
          pipeline_id: pipeline.pipeline_id,
          type: 'high_failure_rate',
          severity: 'high',
          message: `Pipeline "${pipeline.pipeline_name}" has high failure rate`
        });
      }
    }
    
  } catch (error) {
    console.error('Error generating alerts:', error);
    throw error;
  }
};

module.exports = {
  initializeCronJobs,
  updateAllDORAMetrics,
  cleanupOldData,
  generateAlerts
};