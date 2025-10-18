'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import TunnelForm from '@/components/TunnelForm';

interface Customer {
  id: string;
  customerId: string;
  customerName: string;
  company?: string;
  cultivationType?: string;
  cultivationName?: string;
  noOfTunnel: number;
  location?: string;
  email?: string;
  phone?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

interface Tunnel {
  id: string;
  tunnelId: string;
  tunnelName: string;
  description?: string;
  customerId: string;
  cultivationType?: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
  customer: Customer;
}

export default function TunnelsPage() {
  const [tunnels, setTunnels] = useState<Tunnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTunnel, setEditingTunnel] = useState<Tunnel | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCustomer, setFilterCustomer] = useState('');
  const [filterCultivationType, setFilterCultivationType] = useState('');

  // Fetch tunnels
  const fetchTunnels = async () => {
    try {
      const response = await fetch('/api/tunnels');
      if (response.ok) {
        const data = await response.json();
        setTunnels(data);
      } else {
        console.error('Failed to fetch tunnels');
      }
    } catch (error) {
      console.error('Error fetching tunnels:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTunnels();
  }, []);

  // Handle form submission
  const handleSubmit = async (tunnelData: Omit<Tunnel, 'id' | 'createdAt' | 'updatedAt' | 'customer'>) => {
    setFormLoading(true);
    try {
      const url = editingTunnel 
        ? `/api/tunnels/${editingTunnel.id}`
        : '/api/tunnels';
      
      const method = editingTunnel ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tunnelData),
      });

      if (response.ok) {
        await fetchTunnels();
        setShowForm(false);
        setEditingTunnel(null);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save tunnel');
      }
    } catch (error) {
      console.error('Error saving tunnel:', error);
      alert('Failed to save tunnel');
    } finally {
      setFormLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (tunnelId: string) => {
    if (!confirm('Are you sure you want to delete this tunnel?')) {
      return;
    }

    setDeleteLoading(tunnelId);
    try {
      const response = await fetch(`/api/tunnels/${tunnelId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchTunnels();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete tunnel');
      }
    } catch (error) {
      console.error('Error deleting tunnel:', error);
      alert('Failed to delete tunnel');
    } finally {
      setDeleteLoading(null);
    }
  };

  // Handle edit
  const handleEdit = (tunnel: Tunnel) => {
    setEditingTunnel(tunnel);
    setShowForm(true);
  };

  // Filter tunnels based on search term and filters
  const filteredTunnels = tunnels.filter(tunnel =>
    (tunnel.tunnelName.toLowerCase().includes(searchTerm.toLowerCase()) ||
     tunnel.tunnelId.toLowerCase().includes(searchTerm.toLowerCase()) ||
     tunnel.description?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterCustomer === '' || tunnel.customerId === filterCustomer) &&
    (filterCultivationType === '' || tunnel.cultivationType === filterCultivationType)
  );

  // Get unique customers and cultivation types for filters
  const customers = [...new Set(tunnels.map(tunnel => tunnel.customer))];
  const cultivationTypes = [...new Set(tunnels.map(tunnel => tunnel.cultivationType).filter(Boolean))];

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Layout>
      <main className="min-h-screen bg-gray-50 text-gray-900">
        {/* Header with Safe Zone */}
        <div className="bg-white border-b border-gray-200 pl-[72px] pr-4 lg:pl-6 lg:pr-6 py-4 md:py-6 shadow-sm sticky top-0 z-30 backdrop-blur-sm bg-white/95">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-0.5 truncate">
                  Tunnels Management
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 truncate">
                  Manage your greenhouse tunnels and cultivation areas
                </p>
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white px-3 sm:px-4 md:px-6 py-2.5 min-h-[44px] min-w-[44px] rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-1 sm:gap-2 shadow-sm whitespace-nowrap flex-shrink-0"
              >
                <span className="text-base sm:text-lg">+</span>
                <span className="hidden sm:inline text-sm md:text-base">Add Tunnel</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards with Safe Zone */}
        <div className="pl-[72px] pr-4 lg:pl-6 lg:pr-6 py-4 md:py-6 animate-fade-in-up">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
              <div className="bg-white rounded-lg shadow-sm border p-3 md:p-4 hover:shadow-md transition-all duration-200">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                    <svg className="w-5 h-5 md:w-6 md:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Tunnels</p>
                    <p className="text-2xl font-bold text-gray-900">{tunnels.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Customers</p>
                    <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Cultivation Types</p>
                    <p className="text-2xl font-bold text-gray-900">{cultivationTypes.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mb-4 md:mb-6">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search tunnels..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 min-h-[44px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm sm:text-base text-gray-900 placeholder-gray-500 transition-all"
                />
              </div>
              <div className="sm:w-48">
                <select
                  value={filterCustomer}
                  onChange={(e) => setFilterCustomer(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 min-h-[44px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm sm:text-base text-gray-900 transition-all"
                >
                  <option value="">All Customers</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.customerName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:w-48">
                <select
                  value={filterCultivationType}
                  onChange={(e) => setFilterCultivationType(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900"
                >
                  <option value="">All Types</option>
                  {cultivationTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Tunnels Content */}
        <div className="pl-[72px] pr-4 lg:pl-6 lg:pr-6 pb-4 md:pb-6">
          <div className="max-w-7xl mx-auto">
            {loading ? (
              <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading tunnels...</p>
              </div>
            ) : filteredTunnels.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
                <div className="text-6xl mb-4">🏗️</div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  {searchTerm || filterCustomer || filterCultivationType ? 'No tunnels found' : 'No tunnels yet'}
                </h2>
                <p className="text-gray-600 mb-6">
                  {searchTerm || filterCustomer || filterCultivationType 
                    ? 'Try adjusting your search or filter terms'
                    : 'Get started by adding your first tunnel'
                  }
                </p>
                {!searchTerm && !filterCustomer && !filterCultivationType && (
                  <button
                    onClick={() => setShowForm(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg transition-colors shadow-sm"
                  >
                    Add Your First Tunnel
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTunnels.map((tunnel) => (
                  <div
                    key={tunnel.id}
                    className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-3 sm:space-y-0">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {tunnel.tunnelName}
                          </h3>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                            {tunnel.tunnelId}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">Customer:</span>
                            <span className="ml-1 text-gray-600">{tunnel.customer.customerName}</span>
                          </div>
                          
                          
                          <div>
                            <span className="font-medium text-gray-700">Cultivation:</span>
                            <span className="ml-1 text-gray-600">{tunnel.cultivationType || 'Not specified'}</span>
                          </div>
                          
                          <div>
                            <span className="font-medium text-gray-700">Location:</span>
                            <span className="ml-1 text-gray-600">{tunnel.location || 'Not specified'}</span>
                          </div>
                          
                          <div>
                            <span className="font-medium text-gray-700">Created:</span>
                            <span className="ml-1 text-gray-600">{formatDate(tunnel.createdAt)}</span>
                          </div>
                          
                          {tunnel.description && (
                            <div className="sm:col-span-2 lg:col-span-3">
                              <span className="font-medium text-gray-700">Description:</span>
                              <span className="ml-1 text-gray-600">{tunnel.description}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                        <button
                          onClick={() => handleEdit(tunnel)}
                          className="px-4 py-2 text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(tunnel.id)}
                          disabled={deleteLoading === tunnel.id}
                          className="px-4 py-2 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-md transition-colors font-medium disabled:opacity-50"
                        >
                          {deleteLoading === tunnel.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tunnel Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl border border-gray-200">
              <TunnelForm
                tunnel={editingTunnel || undefined}
                onSubmit={handleSubmit}
                onCancel={() => {
                  setShowForm(false);
                  setEditingTunnel(null);
                }}
                isLoading={formLoading}
              />
            </div>
          </div>
        )}
      </main>
    </Layout>
  );
} 