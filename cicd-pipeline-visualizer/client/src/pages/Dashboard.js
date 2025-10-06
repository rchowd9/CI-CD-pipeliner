import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  TrendingUp, 
  Clock, 
  GitBranch,
  Zap,
  RefreshCw,
  XCircle
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import toast from 'react-hot-toast';
import { useSocket } from '../context/SocketContext';
import { metricsAPI } from '../services/api';

const Dashboard = () => {
  const { socket, isConnected } = useSocket();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    
    if (socket) {
      socket.on('pipeline-synced', handlePipelineUpdate);
      socket.on('alert-created', handleAlertUpdate);
      
      return () => {
        socket.off('pipeline-synced', handlePipelineUpdate);
        socket.off('alert-created', handleAlertUpdate);
      };
    }
  }, [socket]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await metricsAPI.getDashboard({ days: 30 });
      setDashboardData(response.data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handlePipelineUpdate = (data) => {
    toast.success(`Pipeline updated: ${data.total_runs} runs synced`);
    fetchDashboardData();
  };

  const handleAlertUpdate = (data) => {
    toast.error(`New alert: ${data.message}`);
  };

  const refreshData = () => {
    fetchDashboardData();
    toast.success('Dashboard data refreshed');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="spinner"
        />
        <span className="ml-2 text-gray-600">Loading dashboard...</span>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-12">
        <XCircle className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No data available</h3>
        <p className="mt-1 text-sm text-gray-500">Try refreshing or adding some pipelines.</p>
        <div className="mt-6">
          <button onClick={refreshData} className="btn-primary">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>
    );
  }

  const { summary, trends, insights, dora_metrics } = dashboardData;

  // Prepare chart data
  const successRateData = trends.daily.map(day => ({
    date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    successRate: day.total_runs > 0 ? (day.successful_runs / day.total_runs * 100).toFixed(1) : 0,
    totalRuns: day.total_runs,
    avgDuration: Math.round(day.avg_duration / 60) || 0
  }));

  const platformData = [
    { name: 'GitHub Actions', value: summary.pipelines.github_pipelines, color: '#24292e' },
    { name: 'GitLab CI', value: summary.pipelines.gitlab_pipelines, color: '#fc6d26' },
    { name: 'Jenkins', value: summary.pipelines.jenkins_pipelines, color: '#d24939' },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">
            Overview of your CI/CD pipeline performance
            {lastUpdated && (
              <span className="ml-2 text-sm text-gray-500">
                • Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
            isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            <div className={`h-2 w-2 rounded-full ${
              isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'
            }`} />
            <span>{isConnected ? 'Live' : 'Offline'}</span>
          </div>
          <button
            onClick={refreshData}
            className="btn-secondary"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div variants={itemVariants} className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <GitBranch className="h-8 w-8 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Pipelines</p>
                <p className="text-2xl font-bold text-gray-900">{summary.pipelines.total_pipelines}</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Activity className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900">{summary.runs.success_rate}%</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Avg Duration</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(summary.runs.avg_duration / 60) || 0}m
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Zap className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Runs</p>
                <p className="text-2xl font-bold text-gray-900">{summary.runs.total_runs}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* DORA Metrics */}
      <motion.div variants={itemVariants} className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">DORA Metrics</h3>
          <p className="text-sm text-gray-500">Key performance indicators for DevOps teams</p>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">
                {dora_metrics.deployment_frequency.toFixed(1)}
              </div>
              <div className="text-sm text-gray-500">Deployment Frequency</div>
              <div className="text-xs text-gray-400">deployments/day</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Math.round(dora_metrics.lead_time_for_changes)}
              </div>
              <div className="text-sm text-gray-500">Lead Time</div>
              <div className="text-xs text-gray-400">minutes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {dora_metrics.mean_time_to_recovery}
              </div>
              <div className="text-sm text-gray-500">MTTR</div>
              <div className="text-xs text-gray-400">minutes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {dora_metrics.change_failure_rate.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-500">Change Failure Rate</div>
              <div className="text-xs text-gray-400">percentage</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Success Rate Trend */}
        <motion.div variants={itemVariants} className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Success Rate Trend</h3>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={successRateData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [`${value}%`, name]}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="successRate" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Platform Distribution */}
        <motion.div variants={itemVariants} className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Platform Distribution</h3>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={platformData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {platformData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Dashboard;