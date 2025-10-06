import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

// Components
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import Dashboard from './pages/Dashboard';
import Pipelines from './pages/Pipelines';
import PipelineDetail from './pages/PipelineDetail';
import Metrics from './pages/Metrics';
import Settings from './pages/Settings';

// Context
import { SocketContext } from './context/SocketContext';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
      transports: ['websocket'],
      timeout: 20000,
    });

    newSocket.on('connect', () => {
      console.log('📡 Connected to server');
      setIsConnected(true);
      toast.success('Connected to server');
    });

    newSocket.on('disconnect', () => {
      console.log('📡 Disconnected from server');
      setIsConnected(false);
      toast.error('Disconnected from server');
    });

    newSocket.on('connect_error', (error) => {
      console.error('📡 Connection error:', error);
      setIsConnected(false);
    });

    // Listen for real-time updates
    newSocket.on('pipeline-created', (data) => {
      toast.success(`New pipeline created: ${data.name}`);
    });

    newSocket.on('pipeline-updated', (data) => {
      toast.success(`Pipeline updated: ${data.name}`);
    });

    newSocket.on('pipeline-synced', (data) => {
      toast.success(`Pipeline synced: ${data.total_runs} runs, ${data.total_jobs} jobs`);
    });

    newSocket.on('alert-created', (data) => {
      const severityColors = {
        high: 'error',
        medium: 'warning',
        low: 'success'
      };
      toast[severityColors[data.severity] || 'error'](
        `Alert: ${data.message}`,
        { duration: 6000 }
      );
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    in: { opacity: 1, x: 0 },
    out: { opacity: 0, x: -20 }
  };

  const pageTransition = {
    type: 'tween',
    ease: 'anticipate',
    duration: 0.4
  };

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      <div className="min-h-screen bg-gray-50">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        {/* Main content */}
        <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-16'}`}>
          {/* Header */}
          <Header 
            onMenuClick={toggleSidebar}
            isConnected={isConnected}
          />
          
          {/* Page content */}
          <main className="p-6">
            <AnimatePresence mode="wait">
              <Routes>
                <Route 
                  path="/" 
                  element={
                    <motion.div
                      initial="initial"
                      animate="in"
                      exit="out"
                      variants={pageVariants}
                      transition={pageTransition}
                    >
                      <Dashboard />
                    </motion.div>
                  } 
                />
                <Route 
                  path="/pipelines" 
                  element={
                    <motion.div
                      initial="initial"
                      animate="in"
                      exit="out"
                      variants={pageVariants}
                      transition={pageTransition}
                    >
                      <Pipelines />
                    </motion.div>
                  } 
                />
                <Route 
                  path="/pipelines/:id" 
                  element={
                    <motion.div
                      initial="initial"
                      animate="in"
                      exit="out"
                      variants={pageVariants}
                      transition={pageTransition}
                    >
                      <PipelineDetail />
                    </motion.div>
                  } 
                />
                <Route 
                  path="/metrics" 
                  element={
                    <motion.div
                      initial="initial"
                      animate="in"
                      exit="out"
                      variants={pageVariants}
                      transition={pageTransition}
                    >
                      <Metrics />
                    </motion.div>
                  } 
                />
                <Route 
                  path="/settings" 
                  element={
                    <motion.div
                      initial="initial"
                      animate="in"
                      exit="out"
                      variants={pageVariants}
                      transition={pageTransition}
                    >
                      <Settings />
                    </motion.div>
                  } 
                />
              </Routes>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </SocketContext.Provider>
  );
}

export default App;