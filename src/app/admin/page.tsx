'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw, FileText, CheckCircle, XCircle, BarChart3, Zap, TrendingUp, Shield, Database, Upload, Activity, Settings, Users, Clock, Eye, EyeOff, Menu, X } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';

interface IndexStatus {
  isIndexed: boolean;
  chunkCount: number;
  documents: string[];
}

interface EvalResult {
  question: string;
  expectedSources: string[];
  actualSources: string[];
  passed: boolean;
}

interface EvalSummary {
  totalTests: number;
  passedTests: number;
  results: EvalResult[];
}

interface UploadStatus {
  success: boolean;
  message: string;
  files?: string[];
}

interface MonitoringStats {
  totalRequests: number;
  requestsByHour: Record<string, number>;
  averageResponseTime: number;
  errorRate: number;
  topQueries: Array<{ query: string; count: number }>;
  citationsUsed: Record<string, number>;
}

export default function AdminPage() {
  const { success, error } = useToast();
  const [isReindexing, setIsReindexing] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [indexStatus, setIndexStatus] = useState<IndexStatus | null>(null);
  const [evalResults, setEvalResults] = useState<EvalSummary | null>(null);
  const [monitoringStats, setMonitoringStats] = useState<MonitoringStats | null>(null);
  const [authToken, setAuthToken] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const loadIndexStatus = async () => {
    try {
      const response = await fetch('/api/index');
      if (response.ok) {
        const status = await response.json();
        setIndexStatus(status);
      }
    } catch (error) {
      console.error('Error loading index status:', error);
    }
  };

  const loadMonitoringStats = async () => {
    if (!isAuthenticated) return;

    try {
      const response = await fetch('/api/monitoring', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      if (response.ok) {
        const stats = await response.json();
        setMonitoringStats(stats);
      }
    } catch (error) {
      console.error('Error loading monitoring stats:', error);
    }
  };

  const resetMonitoringStats = async () => {
    if (!isAuthenticated) return;

    try {
      const response = await fetch('/api/monitoring', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      if (response.ok) {
        success('Stats Reset', 'Monitoring statistics have been reset successfully');
        setMonitoringStats(null);
      } else {
        error('Reset Failed', 'Failed to reset monitoring stats');
      }
    } catch (err) {
      console.error('Error resetting monitoring stats:', err);
      error('Reset Error', 'An error occurred while resetting monitoring stats');
    }
  };

  useEffect(() => {
    loadIndexStatus();
    if (isAuthenticated) {
      loadMonitoringStats();
    }
  }, [isAuthenticated]);

  const handleAuthenticate = () => {
    if (authToken === (process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123')) {
      setIsAuthenticated(true);
      success('Authentication Successful', 'Welcome to the admin panel');
    } else {
      error('Authentication Failed', 'Invalid password provided');
    }
  };

  const handleReindex = async () => {
    if (!isAuthenticated) {
      error('Authentication Required', 'Please authenticate first');
      return;
    }

    setIsReindexing(true);
    setMessage('');

    try {
      const response = await fetch('/api/index', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      const result = await response.json();

      if (response.ok) {
        success('Reindexing Complete', 'Documents have been successfully reindexed');
        setIndexStatus(result);
      } else {
        error('Reindexing Failed', result.error || 'Failed to reindex documents');
      }
    } catch (err) {
      console.error('Error reindexing documents:', err);
      error('Reindexing Error', 'An error occurred while reindexing documents');
    } finally {
      setIsReindexing(false);
    }
  };

  const handleRunEvaluation = async () => {
    if (!isAuthenticated) {
      error('Authentication Required', 'Please authenticate first');
      return;
    }

    setIsEvaluating(true);
    setEvalResults(null);

    try {
      const response = await fetch('/api/eval', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      if (response.ok) {
        const results = await response.json();
        setEvalResults(results);
        success('Evaluation Complete', 'System evaluation has been completed successfully');
      } else {
        const errorData = await response.json();
        error('Evaluation Failed', errorData.error || 'Failed to run evaluation');
      }
    } catch (err) {
      console.error('Error running evaluation:', err);
      error('Evaluation Error', 'An error occurred while running the evaluation');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAuthenticated) {
      error('Authentication Required', 'Please authenticate first');
      return;
    }

    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setMessage('');

    try {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: formData
      });

      const result = await response.json();

      if (response.ok) {
        success('Upload Complete', 'Files have been uploaded and indexed successfully');
        // Refresh index status
        loadIndexStatus();
      } else {
        error('Upload Failed', result.error || 'Failed to upload files');
      }
    } catch (err) {
      console.error('Error uploading files:', err);
      error('Upload Error', 'An error occurred while uploading files');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Authentication Modal */}
      {!isAuthenticated && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Admin Authentication</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter admin password"
                      value={authToken}
                      onChange={(e) => setAuthToken(e.target.value)}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      onKeyDown={(e) => e.key === 'Enter' && handleAuthenticate()}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={handleAuthenticate}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Authenticate
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isAuthenticated && (
        <div className="flex h-screen">
          {/* Mobile Sidebar Overlay */}
          {isSidebarOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {/* Sidebar Navigation */}
          <div className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white shadow-sm border-r border-gray-200 transform transition-transform duration-300 ease-in-out ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0`}>
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-lg font-semibold text-gray-900">HelpDesk AI</h1>
                    <p className="text-sm text-gray-500">Admin Panel</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            <nav className="p-4 space-y-2">
              <a href="#overview" className="flex items-center space-x-3 px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100">
                <Database className="h-5 w-5" />
                <span>Overview</span>
              </a>
              <a href="#documents" className="flex items-center space-x-3 px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100">
                <FileText className="h-5 w-5" />
                <span>Documents</span>
              </a>
              <a href="#evaluation" className="flex items-center space-x-3 px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100">
                <BarChart3 className="h-5 w-5" />
                <span>Evaluation</span>
              </a>
              <a href="#monitoring" className="flex items-center space-x-3 px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100">
                <Activity className="h-5 w-5" />
                <span>Monitoring</span>
              </a>
              <a href="#settings" className="flex items-center space-x-3 px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100">
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </a>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-auto lg:ml-0">
            <div className="p-4 lg:p-8">
              {/* Header */}
              <div className="mb-6 lg:mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                    <p className="text-gray-600 mt-1">Manage your RAG system and monitor performance</p>
                  </div>
                  <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  >
                    <Menu className="h-6 w-6" />
                  </button>
                </div>
              </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
                  {/* Index Status Card */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                          <Database className="h-5 w-5 text-white" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900">Document Index</h2>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${indexStatus?.isIndexed ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className={`text-xs font-medium ${indexStatus?.isIndexed ? 'text-green-600' : 'text-red-600'}`}>
                          {indexStatus?.isIndexed ? 'Online' : 'Offline'}
                        </span>
                      </div>
                    </div>
  
                    {indexStatus && (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Status:</span>
                          <span className={`text-sm font-medium ${indexStatus.isIndexed ? 'text-green-600' : 'text-red-600'}`}>
                            {indexStatus.isIndexed ? 'Indexed' : 'Not Indexed'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Chunks:</span>
                          <span className="text-sm font-medium text-gray-900">{indexStatus.chunkCount}</span>
                        </div>
                        <div className="flex justify-between items-start">
                          <span className="text-sm text-gray-600">Documents:</span>
                          <div className="text-right">
                            {indexStatus.documents.map((doc, index) => (
                              <div key={index} className="text-xs text-gray-700">{doc}</div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
  
                    <button
                      onClick={handleReindex}
                      disabled={isReindexing}
                      className="w-full mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center space-x-2"
                    >
                      {isReindexing ? (
                        <div className="flex items-center space-x-2">
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Reindexing...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <RefreshCw className="h-4 w-4" />
                          <span className="text-sm">Reindex Documents</span>
                        </div>
                      )}
                    </button>
                  </div>
  
                  {/* File Upload Card */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                        <Upload className="h-5 w-5 text-white" />
                      </div>
                      <h2 className="text-lg font-semibold text-gray-900">Upload Documents</h2>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Upload new markdown files to add to the knowledge base. Files will be automatically indexed.
                    </p>
                    <div className="space-y-4">
                      <input
                        type="file"
                        multiple
                        accept=".md"
                        onChange={handleFileUpload}
                        disabled={isUploading || !isAuthenticated}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100 disabled:opacity-50"
                      />
                      {isUploading && (
                        <div className="flex items-center space-x-3 text-purple-600 bg-purple-50 p-3 rounded-md border border-purple-200">
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span className="text-sm font-medium">Uploading and indexing documents...</span>
                        </div>
                      )}
                    </div>
                  </div>
  
                  {/* Documents Card */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                        <FileText className="h-5 w-5 text-white" />
                      </div>
                      <h2 className="text-lg font-semibold text-gray-900">Current Documents</h2>
                    </div>
                    <div className="space-y-3">
                      {indexStatus?.documents.map((doc, index) => (
                        <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors duration-200">
                          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <FileText className="h-4 w-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">{doc}</div>
                            <div className="text-xs text-gray-600">
                              {doc === 'pricing.md' && 'Pricing and plan information'}
                              {doc === 'refunds.md' && 'Refund policy and procedures'}
                              {doc === 'getting-started.md' && 'Quick start guide and setup'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
  
                  {/* Evaluation Card */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                          <BarChart3 className="h-5 w-5 text-white" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900">System Evaluation</h2>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-xs font-medium text-green-600">Ready</span>
                      </div>
                    </div>
  
                    <p className="text-sm text-gray-600 mb-4">
                      Run automated tests to verify the RAG system is working correctly and retrieving relevant documents.
                    </p>
  
                    <button
                      onClick={handleRunEvaluation}
                      disabled={isEvaluating}
                      className="w-full bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center space-x-2"
                    >
                      {isEvaluating ? (
                        <div className="flex items-center space-x-2">
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Running Tests...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <BarChart3 className="h-4 w-4" />
                          <span className="text-sm">Run Evaluation</span>
                        </div>
                      )}
                    </button>
  
                    {evalResults && (
                      <div className="mt-6 space-y-4">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                          <span className="text-sm font-medium">Test Results:</span>
                          <span className={`text-sm font-bold ${evalResults.passedTests === evalResults.totalTests ? 'text-green-600' : 'text-yellow-600'}`}>
                            {evalResults.passedTests}/{evalResults.totalTests} passed
                          </span>
                        </div>
  
                        <div className="space-y-3">
                          {evalResults.results.map((result, index) => (
                            <div key={index} className="p-3 border border-gray-200 rounded-md">
                              <div className="flex items-center justify-between mb-2">
                                <div className="text-sm font-medium text-gray-900">
                                  {result.question}
                                </div>
                                {result.passed ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-500" />
                                )}
                              </div>
                              <div className="text-xs text-gray-600 space-y-1">
                                <div>Expected: {result.expectedSources.join(', ') || 'No sources'}</div>
                                <div>Actual: {result.actualSources.join(', ') || 'No sources'}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
  
                  {/* Monitoring Stats */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                          <Activity className="h-5 w-5 text-white" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900">Usage Monitoring</h2>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-xs font-medium text-green-600">Active</span>
                        <button
                          onClick={loadMonitoringStats}
                          className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-md transition-colors duration-200"
                        >
                          Refresh
                        </button>
                      </div>
                    </div>
  
                    {monitoringStats && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
                            <div className="text-2xl font-bold text-blue-600">{monitoringStats.totalRequests}</div>
                            <div className="text-sm text-blue-800 font-medium flex items-center space-x-1">
                              <Users className="h-4 w-4" />
                              <span>Total Requests</span>
                            </div>
                          </div>
                          <div className="bg-green-50 p-4 rounded-md border border-green-200">
                            <div className="text-2xl font-bold text-green-600">{(monitoringStats.averageResponseTime / 1000).toFixed(1)}s</div>
                            <div className="text-sm text-green-800 font-medium flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>Avg Response Time</span>
                            </div>
                          </div>
                        </div>
  
                        <div className="space-y-3">
                          <h3 className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                            <span>Top Queries</span>
                          </h3>
                          {monitoringStats.topQueries.slice(0, 3).map((query, index) => (
                            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors duration-200">
                              <span className="truncate flex-1 text-sm font-medium text-gray-900">{query.query}</span>
                              <span className="bg-orange-500 text-white px-2 py-1 rounded text-xs font-bold">{query.count}x</span>
                            </div>
                          ))}
                        </div>
  
                        <button
                          onClick={resetMonitoringStats}
                          className="w-full bg-red-50 text-red-700 px-4 py-2 rounded-md hover:bg-red-100 transition-colors duration-200 text-sm font-medium border border-red-200"
                        >
                          Reset Stats
                        </button>
                      </div>
                    )}
                  </div>
  
                  {/* Quick Actions */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                        <Settings className="h-5 w-5 text-white" />
                      </div>
                      <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      <Link
                        href="/"
                        className="bg-blue-50 text-blue-700 px-4 py-2 rounded-md hover:bg-blue-100 transition-colors duration-200 text-center text-sm font-medium border border-blue-200"
                      >
                        Go to Chat Interface
                      </Link>
                      <button
                        onClick={loadIndexStatus}
                        className="bg-gray-50 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-100 transition-colors duration-200 text-sm font-medium border border-gray-200"
                      >
                        Refresh Status
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }