const db = require('../config/database');

/**
 * Calculate DORA metrics for a specific pipeline or all pipelines
 * @param {number|null} pipelineId - Pipeline ID or null for all pipelines
 * @param {number} days - Number of days to look back
 * @returns {Object} DORA metrics
 */
const calculateDORAMetrics = async (pipelineId = null, days = 30) => {
  try {
    const since = new Date();
    since.setDate(since.getDate() - days);
    
    // Build query conditions
    let pipelineCondition = '';
    let params = [since];
    
    if (pipelineId) {
      pipelineCondition = 'AND pr.pipeline_id = $2';
      params.push(pipelineId);
    }
    
    // 1. Deployment Frequency (deployments per day)
    const deploymentFreqQuery = `
      SELECT 
        COUNT(*) as total_deployments,
        COUNT(DISTINCT DATE(pr.started_at)) as deployment_days
      FROM pipeline_runs pr
      WHERE pr.status = 'completed' 
        AND pr.conclusion = 'success'
        AND pr.started_at >= $1
        ${pipelineCondition}
    `;
    
    const deploymentFreq = await db.query(deploymentFreqQuery, params);
    const deploymentFrequency = deploymentFreq.rows[0].deployment_days > 0 ? 
      (deploymentFreq.rows[0].total_deployments / deploymentFreq.rows[0].deployment_days).toFixed(2) : 0;
    
    // 2. Lead Time for Changes (average time from commit to deployment)
    const leadTimeQuery = `
      SELECT 
        AVG(
          EXTRACT(EPOCH FROM (pr.started_at - pr.created_at)) / 3600
        ) as avg_lead_time_hours
      FROM pipeline_runs pr
      WHERE pr.status = 'completed' 
        AND pr.conclusion = 'success'
        AND pr.started_at >= $1
        AND pr.created_at IS NOT NULL
        ${pipelineCondition}
    `;
    
    const leadTime = await db.query(leadTimeQuery, params);
    const leadTimeForChanges = leadTime.rows[0].avg_lead_time_hours ? 
      Math.round(leadTime.rows[0].avg_lead_time_hours * 60) : 0; // Convert to minutes
    
    // 3. Mean Time to Recovery (average time to recover from failures)
    const mttrQuery = `
      WITH failure_recovery AS (
        SELECT 
          pr.pipeline_id,
          pr.started_at as failure_time,
          LEAD(pr.started_at) OVER (
            PARTITION BY pr.pipeline_id 
            ORDER BY pr.started_at
          ) as next_success_time,
          pr.conclusion
        FROM pipeline_runs pr
        WHERE pr.status = 'completed'
          AND pr.started_at >= $1
          ${pipelineCondition}
        ORDER BY pr.pipeline_id, pr.started_at
      )
      SELECT 
        AVG(
          EXTRACT(EPOCH FROM (next_success_time - failure_time)) / 60
        ) as avg_recovery_time_minutes
      FROM failure_recovery
      WHERE conclusion = 'failure' 
        AND next_success_time IS NOT NULL
    `;
    
    const mttr = await db.query(mttrQuery, params);
    const meanTimeToRecovery = mttr.rows[0].avg_recovery_time_minutes ? 
      Math.round(mttr.rows[0].avg_recovery_time_minutes) : 0;
    
    // 4. Change Failure Rate (percentage of deployments that result in failures)
    const changeFailureQuery = `
      SELECT 
        COUNT(*) as total_deployments,
        COUNT(CASE WHEN conclusion = 'failure' THEN 1 END) as failed_deployments
      FROM pipeline_runs pr
      WHERE pr.status = 'completed'
        AND pr.started_at >= $1
        ${pipelineCondition}
    `;
    
    const changeFailure = await db.query(changeFailureQuery, params);
    const changeFailureRate = changeFailure.rows[0].total_deployments > 0 ? 
      (changeFailure.rows[0].failed_deployments / changeFailure.rows[0].total_deployments * 100).toFixed(2) : 0;
    
    return {
      deployment_frequency: parseFloat(deploymentFrequency),
      lead_time_for_changes: leadTimeForChanges,
      mean_time_to_recovery: meanTimeToRecovery,
      change_failure_rate: parseFloat(changeFailureRate),
      calculated_at: new Date().toISOString(),
      period_days: days
    };
    
  } catch (error) {
    console.error('Error calculating DORA metrics:', error);
    throw error;
  }
};

module.exports = {
  calculateDORAMetrics
};