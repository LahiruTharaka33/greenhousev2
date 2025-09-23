'use client';

import { useState, useEffect } from 'react';

interface Tunnel {
  id: string;
  tunnelId: string;
  tunnelName: string;
  clientId: string | null;
  customerId: string;
  customer: {
    customerName: string;
  };
}

interface TunnelClientIdManagerProps {
  isAdmin?: boolean;
}

export default function TunnelClientIdManager({ isAdmin = false }: TunnelClientIdManagerProps) {
  const [tunnels, setTunnels] = useState<Tunnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTunnel, setEditingTunnel] = useState<string | null>(null);
  const [clientIdInput, setClientIdInput] = useState('');
  const [saving, setSaving] = useState(false);

  // Fetch tunnels on component mount
  useEffect(() => {
    fetchTunnels();
  }, []);

  const fetchTunnels = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/tunnels');
      
      if (!response.ok) {
        throw new Error('Failed to fetch tunnels');
      }
      
      const data = await response.json();
      setTunnels(data.tunnels || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (tunnel: Tunnel) => {
    setEditingTunnel(tunnel.id);
    setClientIdInput(tunnel.clientId || '');
  };

  const handleCancelEdit = () => {
    setEditingTunnel(null);
    setClientIdInput('');
  };

  const handleSaveClientId = async (tunnelId: string) => {
    try {
      setSaving(true);
      
      const response = await fetch(`/api/admin/tunnels/${tunnelId}/client-id`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: clientIdInput.trim() || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update client ID');
      }

      // Update local state
      setTunnels(prev => prev.map(tunnel => 
        tunnel.id === tunnelId 
          ? { ...tunnel, clientId: clientIdInput.trim() || null }
          : tunnel
      ));

      setEditingTunnel(null);
      setClientIdInput('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save client ID');
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">Access denied. Admin privileges required.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          Tunnel Client ID Management
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Assign client IDs to tunnels for device communication
        </p>
      </div>

      {error && (
        <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-800 text-sm mt-2"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="p-6">
        {tunnels.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No tunnels found
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tunnel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tunnels.map((tunnel) => (
                  <tr key={tunnel.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {tunnel.tunnelName}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {tunnel.tunnelId}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {tunnel.customer.customerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingTunnel === tunnel.id ? (
                        <input
                          type="text"
                          value={clientIdInput}
                          onChange={(e) => setClientIdInput(e.target.value)}
                          placeholder="Enter client ID"
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          disabled={saving}
                        />
                      ) : (
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          tunnel.clientId 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {tunnel.clientId || 'Not assigned'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {editingTunnel === tunnel.id ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleSaveClientId(tunnel.id)}
                            disabled={saving}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50"
                          >
                            {saving ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            disabled={saving}
                            className="text-gray-600 hover:text-gray-900 disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEditClick(tunnel)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          {tunnel.clientId ? 'Edit' : 'Assign'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
