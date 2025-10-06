import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  RefreshCw,
  Download,
  Filter
} from 'lucide-react';
import toast from 'react-hot-toast';
import { metricsAPI } from '../services/api';

const Metrics = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');

  useEffect(() => {
    fetchMetrics();
  }, [timeRange]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await metricsAPI.getDORA({ days: timeRange });
      setMetrics(response.data);
    } catch (error) {
      console.error('Error fetching metrics:', error);
      toast.error('Failed to load metrics');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    fetchMetrics();
    toast.success('Metrics refreshed');
  };

  const exportMetrics = () => {
    if (!metrics) return;
    
    const dataStr = JSON.stringify(metrics, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `metrics-${timeRange}d.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast.success('Metrics exported successfully');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="spinner"
        />
        <span className="ml-2 text-gray-600">Loading metrics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Metrics & Analytics</h1>
          <p className="text-gray-600">Comprehensive analysis of your CI/CD pipeline performance</p>
        </div>
        <div className="flex items-center space-x-3">
          <button onClick={exportMetrics} className="btn-secondary">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          <button onClick={refreshData} className="btn-secondary">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <label className="text-sm font-medium text-gray-700">Time Range:</label>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                >
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                </select>
              </div>
            </div>

            <div className="text-sm text-gray-500">
              Data updated {metrics?.calculated_at ? new Date(metrics.calculated_at).toLocaleString() : 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* DORA Metrics */}
      {metrics && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* DORA Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card"
            >
              <div className="card-body text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {metrics.metrics.deployment_frequency.toFixed(1)}
                </div>
                <div className="text-sm text-gray-500">Deployment Frequency</div>
                <div className="text-xs text-gray-400 mt-1">deployments/day</div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card"
            >
              <div className="card-body text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {metrics.metrics.lead_time_for_changes}m
                </div>
                <div className="text-sm text-gray-500">Lead Time for Changes</div>
                <div className="text-xs text-gray-400 mt-1">average minutes</div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card"
            >
              <div className="card-body text-center">
                <div className="text-3xl font-bold text-yellow-600 mb-2">
                  {metrics.metrics.mean_time_to_recovery}m
                </div>
                <div className="text-sm text-gray-500">Mean Time to Recovery</div>
                <div className="text-xs text-gray-400 mt-1">average minutes</div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="card"
            >
              <div className="card-body text-center">
                <div className="text-3xl font-bold text-red-600 mb-2">
                  {metrics.metrics.change_failure_rate.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-500">Change Failure Rate</div>
                <div className="text-xs text-gray-400 mt-1">percentage</div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {!metrics && !loading && (
        <div className="text-center py-12">
          <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No metrics available</h3>
          <p className="mt-1 text-sm text-gray-500">
            Metrics will appear once you have pipeline data to analyze.
          </p>
        </div>
      )}
    </div>
  );
};

export default Metrics;