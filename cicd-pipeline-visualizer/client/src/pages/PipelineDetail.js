import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  GitBranch, 
  Clock, 
  CheckCircle, 
  XCircle, 
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { pipelinesAPI } from '../services/api';

const PipelineDetail = () => {
  const { id } = useParams();
  const [pipeline, setPipeline] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPipelineData();
  }, [id]);

  const fetchPipelineData = async () => {
    try {
      setLoading(true);
      const response = await pipelinesAPI.getById(id);
      setPipeline(response.data);
    } catch (error) {
      console.error('Error fetching pipeline data:', error);
      toast.error('Failed to load pipeline data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="spinner"
        />
        <span className="ml-2 text-gray-600">Loading pipeline...</span>
      </div>
    );
  }

  if (!pipeline) {
    return (
      <div className="text-center py-12">
        <XCircle className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Pipeline not found</h3>
        <p className="mt-1 text-sm text-gray-500">The pipeline you're looking for doesn't exist.</p>
        <div className="mt-6">
          <Link to="/pipelines" className="btn-primary">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Pipelines
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link 
            to="/pipelines" 
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{pipeline.pipeline.name}</h1>
            <p className="text-gray-600 capitalize">
              {pipeline.pipeline.platform.replace('_', ' ')} • 
              Updated {new Date(pipeline.pipeline.updated_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <button onClick={fetchPipelineData} className="btn-secondary">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Pipeline Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Pipeline Information</h3>
          </div>
          <div className="card-body">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Platform</dt>
                <dd className="mt-1 text-sm text-gray-900 capitalize">
                  {pipeline.pipeline.platform.replace('_', ' ')}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Repository</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <a 
                    href={pipeline.pipeline.repository_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-500"
                  >
                    {pipeline.pipeline.repository_url}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Created</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(pipeline.pipeline.created_at).toLocaleDateString()}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(pipeline.pipeline.updated_at).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Quick Stats</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Total Runs</span>
                <span className="text-lg font-semibold text-gray-900">
                  {pipeline.recent_runs.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Success Rate</span>
                <span className="text-lg font-semibold text-green-600">
                  {pipeline.recent_runs.length > 0 
                    ? ((pipeline.recent_runs.filter(r => r.conclusion === 'success').length / pipeline.recent_runs.length) * 100).toFixed(1)
                    : 0}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Avg Duration</span>
                <span className="text-lg font-semibold text-gray-900">
                  {pipeline.recent_runs.length > 0
                    ? Math.round(pipeline.recent_runs.reduce((sum, run) => sum + (run.duration_seconds || 0), 0) / pipeline.recent_runs.length / 60)
                    : 0}m
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        </div>
        <div className="card-body">
          <div className="space-y-3">
            {pipeline.recent_runs.slice(0, 5).map((run) => (
              <div key={run.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {run.status === 'completed' && run.conclusion === 'success' ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : run.status === 'completed' && run.conclusion === 'failure' ? (
                    <XCircle className="h-4 w-4 text-red-500" />
                  ) : (
                    <Clock className="h-4 w-4 text-blue-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Run #{run.run_id}
                    </p>
                    <p className="text-sm text-gray-500">
                      {run.branch} • {run.commit_sha?.substring(0, 7)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-900">
                    {Math.round((run.duration_seconds || 0) / 60)}m
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(run.started_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PipelineDetail;