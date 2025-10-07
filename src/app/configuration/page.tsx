'use client';

import { useState, useEffect, useCallback } from 'react';
import Layout from '@/components/Layout';

interface Customer {
  id: string;
  customerId: string;
  customerName: string;
  company?: string;
}

interface TankConfig {
  id: string;
  tankName: string;
  itemType: string;
  itemId: string | null;
  item?: {
    id: string;
    itemName: string;
    itemCategory: string;
  } | null;
}

interface Tunnel {
  id: string;
  tunnelId: string;
  tunnelName: string;
  clientId: string | null;
  tankConfigs: TankConfig[];
}

interface TunnelMapping {
  customer: Customer;
  tunnels: Tunnel[];
}

interface CustomerTunnel {
  id: string;
  tunnelId: string;
  tunnelName: string;
  description?: string;
  cultivationType?: string;
  location?: string;
}

interface Item {
  id: string;
  itemId: string;
  itemName: string;
  itemCategory: string;
  unit: string;
}

export default function ConfigurationPage() {
  const [mappings, setMappings] = useState<Record<string, TunnelMapping>>({});
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [filteredTunnels, setFilteredTunnels] = useState<CustomerTunnel[]>([]);
  const [selectedTunnelId, setSelectedTunnelId] = useState('');
  const [clientId, setClientId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingTunnels, setLoadingTunnels] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [visibleTankConfigs, setVisibleTankConfigs] = useState<Set<string>>(new Set());
  const [showAddMappingForm, setShowAddMappingForm] = useState(false);
  const [savingTankConfigs, setSavingTankConfigs] = useState<Set<string>>(new Set());
  const [tankConfigTimeouts, setTankConfigTimeouts] = useState<Map<string, NodeJS.Timeout>>(new Map());

  // Fetch mappings, customers, and items
  useEffect(() => {
    fetchMappings();
    fetchCustomers();
    fetchItems();
  }, []);

  // Fetch tunnels when customer is selected
  useEffect(() => {
    if (selectedCustomerId) {
      fetchCustomerTunnels(selectedCustomerId);
    } else {
      setFilteredTunnels([]);
      setSelectedTunnelId('');
    }
  }, [selectedCustomerId]);

  const fetchMappings = async () => {
    try {
      const response = await fetch('/api/configuration/mappings');
      if (response.ok) {
        const data = await response.json();
        setMappings(data);
      } else {
        console.error('Failed to fetch mappings');
      }
    } catch (error) {
      console.error('Error fetching mappings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers');
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchItems = async () => {
    try {
      const response = await fetch('/api/items');
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoadingItems(false);
    }
  };

  const fetchCustomerTunnels = async (customerId: string) => {
    setLoadingTunnels(true);
    try {
      const response = await fetch(`/api/tunnels/by-customer/${customerId}`);
      if (response.ok) {
        const data = await response.json();
        setFilteredTunnels(data);
      }
    } catch (error) {
      console.error('Error fetching customer tunnels:', error);
    } finally {
      setLoadingTunnels(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTunnelId) return;

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/configuration/mappings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tunnelId: selectedTunnelId,
          clientId: clientId.trim() || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: data.message });
        await fetchMappings(); // Refresh mappings
        setClientId('');
        setSelectedTunnelId('');
        setSelectedCustomerId('');
        setShowAddMappingForm(false); // Hide form after successful submission
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      console.error('Error saving mapping:', error);
      setMessage({ type: 'error', text: 'Failed to save mapping' });
    } finally {
      setSaving(false);
    }
  };

  const handleClearAssignment = async (tunnelId: string) => {
    if (!confirm('Are you sure you want to clear this client ID assignment?')) {
      return;
    }

    try {
      const response = await fetch('/api/configuration/mappings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tunnelId: tunnelId,
          clientId: null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: data.message });
        await fetchMappings(); // Refresh mappings
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      console.error('Error clearing assignment:', error);
      setMessage({ type: 'error', text: 'Failed to clear assignment' });
    }
  };

  const handleEditMapping = (customerId: string, tunnelId: string, currentClientId: string | null) => {
    setSelectedCustomerId(customerId);
    setSelectedTunnelId(tunnelId);
    setClientId(currentClientId || '');
    setShowAddMappingForm(true); // Show the form when editing
  };

  const debouncedTankConfiguration = useCallback(async (tunnelId: string, tankName: string, itemType: string, itemId?: string) => {
    const tankKey = `${tunnelId}-${tankName}`;
    
    // Add to saving state
    setSavingTankConfigs(prev => new Set([...prev, tankKey]));
    
    // Optimistically update the UI
    const selectedItem = itemType === 'fertilizer' 
      ? items.find(item => item.id === itemId)
      : null;

    const optimisticConfig = {
      id: `temp-${Date.now()}`,
      tankName,
      itemType,
      itemId: itemType === 'fertilizer' ? (itemId || null) : null,
      item: selectedItem ? {
        id: selectedItem.id,
        itemName: selectedItem.itemName,
        itemCategory: selectedItem.itemCategory
      } : null
    };

    // Update the UI immediately
    setMappings(prevMappings => {
      const newMappings = { ...prevMappings };
      Object.values(newMappings).forEach(mapping => {
        mapping.tunnels.forEach(tunnel => {
          if (tunnel.id === tunnelId) {
            // Remove existing config for this tank
            tunnel.tankConfigs = tunnel.tankConfigs?.filter(config => config.tankName !== tankName) || [];
            // Add new config
            tunnel.tankConfigs.push(optimisticConfig);
          }
        });
      });
      return newMappings;
    });

    try {
      const response = await fetch('/api/configuration/tanks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tunnelId,
          tankName,
          itemType,
          itemId: itemType === 'fertilizer' ? itemId : null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update with real data from server
        setMappings(prevMappings => {
          const newMappings = { ...prevMappings };
          Object.values(newMappings).forEach(mapping => {
            mapping.tunnels.forEach(tunnel => {
              if (tunnel.id === tunnelId) {
                // Replace optimistic config with real one
                tunnel.tankConfigs = tunnel.tankConfigs?.filter(config => config.tankName !== tankName) || [];
                tunnel.tankConfigs.push({
                  id: data.tankConfig.id,
                  tankName,
                  itemType,
                  itemId: data.tankConfig.itemId,
                  item: data.tankConfig.item
                });
              }
            });
          });
          return newMappings;
        });
        setMessage({ type: 'success', text: data.message });
      } else {
        // Revert optimistic update on error
        await fetchMappings();
        setMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      console.error('Error configuring tank:', error);
      // Revert optimistic update on error
      await fetchMappings();
      setMessage({ type: 'error', text: 'Failed to configure tank' });
    } finally {
      // Remove from saving state
      setSavingTankConfigs(prev => {
        const newSet = new Set(prev);
        newSet.delete(tankKey);
        return newSet;
      });
    }
  }, [items]);

  const handleTankConfiguration = useCallback((tunnelId: string, tankName: string, itemType: string, itemId?: string) => {
    const tankKey = `${tunnelId}-${tankName}`;
    
    // Clear existing timeout for this tank
    const existingTimeout = tankConfigTimeouts.get(tankKey);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Optimistically update the UI immediately
    const selectedItem = itemType === 'fertilizer' 
      ? items.find(item => item.id === itemId)
      : null;

    const optimisticConfig = {
      id: `temp-${Date.now()}`,
      tankName,
      itemType,
      itemId: itemType === 'fertilizer' ? (itemId || null) : null,
      item: selectedItem ? {
        id: selectedItem.id,
        itemName: selectedItem.itemName,
        itemCategory: selectedItem.itemCategory
      } : null
    };

    // Update the UI immediately
    setMappings(prevMappings => {
      const newMappings = { ...prevMappings };
      Object.values(newMappings).forEach(mapping => {
        mapping.tunnels.forEach(tunnel => {
          if (tunnel.id === tunnelId) {
            // Remove existing config for this tank
            tunnel.tankConfigs = tunnel.tankConfigs?.filter(config => config.tankName !== tankName) || [];
            // Add new config
            tunnel.tankConfigs.push(optimisticConfig);
          }
        });
      });
      return newMappings;
    });

    // Set up debounced API call (300ms delay)
    const timeout = setTimeout(() => {
      debouncedTankConfiguration(tunnelId, tankName, itemType, itemId);
    }, 300);

    // Store timeout
    setTankConfigTimeouts(prev => new Map(prev.set(tankKey, timeout)));
  }, [debouncedTankConfiguration, items, tankConfigTimeouts]);

  const toggleTankConfigVisibility = (tunnelId: string) => {
    setVisibleTankConfigs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tunnelId)) {
        newSet.delete(tunnelId);
      } else {
        newSet.add(tunnelId);
      }
      return newSet;
    });
  };

  const toggleAllTankConfigs = () => {
    const allTunnelIds = Object.values(mappings)
      .flatMap(mapping => mapping.tunnels)
      .filter(tunnel => tunnel.clientId)
      .map(tunnel => tunnel.id);
    
    const allVisible = allTunnelIds.every(id => visibleTankConfigs.has(id));
    
    if (allVisible) {
      // Hide all
      setVisibleTankConfigs(new Set());
    } else {
      // Show all
      setVisibleTankConfigs(new Set(allTunnelIds));
    }
  };

  return (
    <Layout>
      <main className="min-h-screen bg-gray-50 text-gray-900">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-6 shadow-sm">
          <div className="max-w-7xl mx-auto">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Configuration
              </h1>
              <p className="text-gray-600">
                Manage client ID mappings for tunnel devices
              </p>
            </div>
          </div>
        </div>

        <div className="px-4 py-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Message */}
            {message && (
              <div className={`p-4 rounded-lg ${
                message.type === 'success' 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {message.text}
              </div>
            )}

            {/* Add/Update Mapping Form */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <span className="mr-2">⚙️</span>
                    {selectedTunnelId ? 'Update' : 'Add'} Client ID Mapping
                  </h2>
                  <button
                    onClick={() => setShowAddMappingForm(!showAddMappingForm)}
                    className="text-lg px-2 py-1 text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded transition-colors"
                    title={showAddMappingForm ? 'Hide form' : 'Show form'}
                  >
                    {showAddMappingForm ? '🔼' : '🔽'}
                  </button>
                </div>
              </div>
              
              {showAddMappingForm && (
                <div className="p-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="customer" className="block text-sm font-medium text-gray-700 mb-1">
                        Customer *
                      </label>
                      <select
                        id="customer"
                        value={selectedCustomerId}
                        onChange={(e) => setSelectedCustomerId(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      >
                        <option value="">Select a customer</option>
                        {customers.map(customer => (
                          <option key={customer.id} value={customer.id}>
                            {customer.customerId} - {customer.customerName} {customer.company ? `(${customer.company})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="tunnel" className="block text-sm font-medium text-gray-700 mb-1">
                        Tunnel *
                      </label>
                      <select
                        id="tunnel"
                        value={selectedTunnelId}
                        onChange={(e) => setSelectedTunnelId(e.target.value)}
                        required
                        disabled={!selectedCustomerId || loadingTunnels}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="">
                          {loadingTunnels ? 'Loading tunnels...' : 'Select a tunnel'}
                        </option>
                        {filteredTunnels.map(tunnel => (
                          <option key={tunnel.id} value={tunnel.id}>
                            {tunnel.tunnelId} - {tunnel.tunnelName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-1">
                        Client ID
                      </label>
                      <input
                        type="text"
                        id="clientId"
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="Enter client ID for device communication"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Leave empty to remove client ID assignment
                      </p>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCustomerId('');
                          setSelectedTunnelId('');
                          setClientId('');
                          setMessage(null);
                        }}
                        className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                      >
                        Reset
                      </button>
                      <button
                        type="submit"
                        disabled={saving || !selectedTunnelId}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saving ? 'Saving...' : (selectedTunnelId && clientId ? 'Update Mapping' : 'Clear Assignment')}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {/* Current Mappings */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <span className="mr-2">📋</span>
                    Current Client ID Mappings
                  </h2>
                  {!loading && Object.keys(mappings).length > 0 && (
                    <button
                      onClick={toggleAllTankConfigs}
                      className="text-sm px-3 py-1 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded transition-colors flex items-center space-x-1"
                    >
                      <span>🚰</span>
                      <span>
                        {Object.values(mappings)
                          .flatMap(mapping => mapping.tunnels)
                          .filter(tunnel => tunnel.clientId)
                          .every(tunnel => visibleTankConfigs.has(tunnel.id))
                          ? 'Hide All Tanks'
                          : 'Show All Tanks'
                        }
                      </span>
                    </button>
                  )}
                </div>
              </div>
              
              <div className="p-6">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading mappings...</p>
                  </div>
                ) : Object.keys(mappings).length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">🔧</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No mappings found</h3>
                    <p className="text-gray-600">Create your first client ID mapping below</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Object.values(mappings).map((mapping) => (
                      <div key={mapping.customer.id} className="border border-gray-200 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                          <span className="mr-2">👤</span>
                          {mapping.customer.customerName}
                          {mapping.customer.company && (
                            <span className="ml-2 text-sm text-gray-500">({mapping.customer.company})</span>
                          )}
                        </h3>
                        
                        <div className="space-y-4 ml-6">
                          {mapping.tunnels.map((tunnel) => (
                            <div key={tunnel.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-3">
                                  <span className="text-sm text-gray-500">🌱</span>
                                  <div>
                                    <span className="font-medium text-gray-900">{tunnel.tunnelName}</span>
                                    <span className="ml-2 text-sm text-gray-500">({tunnel.tunnelId})</span>
                                  </div>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                  {tunnel.clientId ? (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      {tunnel.clientId}
                                    </span>
                                  ) : (
                                    <span className="text-sm text-gray-400">Not assigned</span>
                                  )}
                                  
                                  <button
                                    onClick={() => handleEditMapping(mapping.customer.id, tunnel.id, tunnel.clientId)}
                                    className="text-xs px-2 py-1 text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded transition-colors"
                                  >
                                    Edit
                                  </button>
                                  
                                  {tunnel.clientId && (
                                    <button
                                      onClick={() => handleClearAssignment(tunnel.id)}
                                      className="text-xs px-2 py-1 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded transition-colors"
                                    >
                                      Clear
                                    </button>
                                  )}
                                  
                                  {/* Tank Configuration Toggle Button */}
                                  {tunnel.clientId && (
                                    <button
                                      onClick={() => toggleTankConfigVisibility(tunnel.id)}
                                      className="text-xs px-2 py-1 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded transition-colors flex items-center space-x-1"
                                      title={visibleTankConfigs.has(tunnel.id) ? 'Hide tank configurations' : 'Show tank configurations'}
                                    >
                                      <span>{visibleTankConfigs.has(tunnel.id) ? '🔼' : '🔽'}</span>
                                      <span>Tanks</span>
                                      {tunnel.tankConfigs && tunnel.tankConfigs.length > 0 && (
                                        <span className="inline-flex items-center justify-center w-4 h-4 text-xs bg-blue-200 text-blue-800 rounded-full">
                                          {tunnel.tankConfigs.length}
                                        </span>
                                      )}
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Tank Configurations - Only show if tunnel has a client ID and is visible */}
                              {tunnel.clientId && visibleTankConfigs.has(tunnel.id) && (
                                <div className="mt-3 pt-3 border-t border-gray-300">
                                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                                    <span>🚰</span>
                                    <span>Tank Configurations</span>
                                  </h4>
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {['Tank A', 'Tank B', 'Tank C'].map((tankName) => {
                                      const existingConfig = tunnel.tankConfigs?.find(config => config.tankName === tankName);
                                      const tankKey = `${tunnel.id}-${tankName}`;
                                      const isSaving = savingTankConfigs.has(tankKey);
                                      
                                      return (
                                        <div key={tankName} className="bg-white p-3 rounded border">
                                          <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center space-x-1">
                                            <span>{tankName}</span>
                                            {isSaving && (
                                              <span className="inline-block w-3 h-3 border border-emerald-600 border-t-transparent rounded-full animate-spin"></span>
                                            )}
                                          </label>
                                          <select
                                            value={existingConfig ? 
                                              (existingConfig.itemType === 'water' ? 'water' : existingConfig.itemId || '') 
                                              : ''
                                            }
                                            onChange={(e) => {
                                              const value = e.target.value;
                                              if (value === 'water') {
                                                handleTankConfiguration(tunnel.id, tankName, 'water');
                                              } else if (value) {
                                                handleTankConfiguration(tunnel.id, tankName, 'fertilizer', value);
                                              }
                                            }}
                                            className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-50"
                                            disabled={loadingItems || isSaving}
                                          >
                                            <option value="">Select...</option>
                                            <option value="water">Water</option>
                                            {items
                                              .filter(item => item.itemCategory === 'Fertilizers')
                                              .map(item => (
                                                <option key={item.id} value={item.id}>
                                                  {item.itemName} ({item.unit})
                                                </option>
                                              ))
                                            }
                                          </select>
                                          {existingConfig && (
                                            <div className="mt-1 text-xs text-gray-500">
                                              Current: {existingConfig.itemType === 'water' ? 'Water' : existingConfig.item?.itemName || 'Unknown'}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>
    </Layout>
  );
}
