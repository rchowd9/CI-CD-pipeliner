const db = require('../config/database');
require('dotenv').config();

const createTables = async () => {
  try {
    console.log('🚀 Starting database migration...');
    
    // Create pipelines table
    await db.query(`
      CREATE TABLE IF NOT EXISTS pipelines (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        platform VARCHAR(50) NOT NULL,
        repository_url TEXT NOT NULL,
        webhook_url TEXT,
        config JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(name, repository_url)
      )
    `);

    // Create pipeline_runs table
    await db.query(`
      CREATE TABLE IF NOT EXISTS pipeline_runs (
        id SERIAL PRIMARY KEY,
        pipeline_id INTEGER REFERENCES pipelines(id) ON DELETE CASCADE,
        run_id VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL,
        conclusion VARCHAR(50),
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        duration_seconds INTEGER,
        trigger_event VARCHAR(100),
        trigger_actor VARCHAR(255),
        branch VARCHAR(255),
        commit_sha VARCHAR(40),
        commit_message TEXT,
        artifacts JSONB,
        logs_url TEXT,
        raw_data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(pipeline_id, run_id)
      )
    `);

    // Create pipeline_stages table
    await db.query(`
      CREATE TABLE IF NOT EXISTS pipeline_stages (
        id SERIAL PRIMARY KEY,
        pipeline_run_id INTEGER REFERENCES pipeline_runs(id) ON DELETE CASCADE,
        stage_name VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL,
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        duration_seconds INTEGER,
        log_url TEXT,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create metrics table for DORA metrics
    await db.query(`
      CREATE TABLE IF NOT EXISTS dora_metrics (
        id SERIAL PRIMARY KEY,
        pipeline_id INTEGER REFERENCES pipelines(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        deployment_frequency INTEGER DEFAULT 0,
        lead_time_for_changes INTEGER DEFAULT 0,
        mean_time_to_recovery INTEGER DEFAULT 0,
        change_failure_rate DECIMAL(5,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(pipeline_id, date)
      )
    `);

    // Create alerts table
    await db.query(`
      CREATE TABLE IF NOT EXISTS alerts (
        id SERIAL PRIMARY KEY,
        pipeline_id INTEGER REFERENCES pipelines(id) ON DELETE CASCADE,
        alert_type VARCHAR(100) NOT NULL,
        severity VARCHAR(20) NOT NULL,
        message TEXT NOT NULL,
        is_resolved BOOLEAN DEFAULT FALSE,
        resolved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better performance
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_pipeline_runs_pipeline_id 
      ON pipeline_runs(pipeline_id);
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_pipeline_runs_status 
      ON pipeline_runs(status);
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_pipeline_runs_started_at 
      ON pipeline_runs(started_at);
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_pipeline_stages_pipeline_run_id 
      ON pipeline_stages(pipeline_run_id);
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_dora_metrics_pipeline_date 
      ON dora_metrics(pipeline_id, date);
    `);

    console.log('✅ Database migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

// Run migration if called directly
if (require.main === module) {
  db.connect()
    .then(() => createTables())
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { createTables };