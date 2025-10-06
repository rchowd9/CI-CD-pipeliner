import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Search, 
  GitBranch, 
  Clock, 
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { pipelinesAPI } from '../services/api';
import { useSocket } from '../context/SocketContext';

const Pipelines = () => {
  const { socket } = useSocket();
  const [pipelines, setPipelines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPipelines();
    
    if (socket) {
      socket.on('pipeline-created', handlePipelineUpdate);
      socket.on('pipeline-updated', handlePipelineUpdate);
      
      return () => {
        socket.off('pipeline-created', handlePipelineUpdate);
        socket.off('pipeline-updated', handlePipelineUpdate);
      };
    }
  }, [socket]);

  const fetchPipelines = async () => {
    try {
      setLoading(true);
      const response = await pipelinesAPI.getAll({ limit: 50 });
      setPipelines(response.data.pipelines);
    } catch (error) {
      console.error('Error fetching pipelines:', error);
      toast.error('Failed to load pipelines');
    } finally {
      setLoading(false);
    }
  };

  const handlePipelineUpdate = () => {
    fetchPipelines();
  };

  const refreshData = () => {
    fetchPipelines();
    toast.success('Pipelines refreshed');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="spinner"
        />
        <span className="ml-2 text-gray-600">Loading pipelines...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pipelines</h1>
          <p className="text-gray-600">Manage and monitor your CI/CD pipelines</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={refreshData}
            className="btn-secondary"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <button className="btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            Add Pipeline
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="card">
        <div className="card-body">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search pipelines..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Pipelines Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {pipelines.map((pipeline, index) => (
          <motion.div
            key={pipeline.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card hover:shadow-lg transition-shadow duration-200"
          >
            <div className="card-body">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
                      <GitBranch className="h-5 w-5 text-primary-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      <Link 
                        to={`/pipelines/${pipeline.id}`}
                        className="hover:text-primary-600 transition-colors"
                      >
                        {pipeline.name}
                      </Link>
                    </h3>
                    <p className="text-sm text-gray-500 capitalize">
                      {pipeline.platform.replace('_', ' ')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {pipeline.success_rate}%
                  </div>
                  <div className="text-sm text-gray-500">Success Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {pipeline.avg_duration ? Math.round(pipeline.avg_duration / 60) : 0}m
                  </div>
                  <div className="text-sm text-gray-500">Avg Duration</div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-1 text-sm text-gray-500">
                  <Clock className="h-4 w-4" />
                  <span>Updated {new Date(pipeline.updated_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {pipelines.length === 0 && (
        <div className="text-center py-12">
          <GitBranch className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No pipelines found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by adding your first pipeline.
          </p>
          <div className="mt-6">
            <button className="btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              Add Pipeline
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pipelines;