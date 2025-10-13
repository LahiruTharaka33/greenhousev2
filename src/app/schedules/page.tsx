'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Layout from '@/components/Layout';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import MQTTTerminalNotification from '@/components/MQTTTerminalNotification';
import { PublishSummary } from '@/lib/schedulePublisher';

interface Customer {
  id: string;
  customerId: string;
  customerName: string;
  company?: string;
}

interface Tunnel {
  id: string;
  tunnelId: string;
  tunnelName: string;
  description?: string;
}

interface Item {
  id: string;
  itemId: string;
  itemName: string;
  itemCategory: string;
  unit?: string;  // Added this line
}

interface ScheduleItem {
  id: string;
  customerId: string;
  customerName: string;
  tunnelId: string;
  tunnelName: string;
  itemId: string;
  itemName: string;
  unit?: string;
  scheduledDate: string;
  scheduledTime: string;
  quantity: number;
  water: string;
  notes?: string;
}

interface SavedSchedule {
  id: string;
  customerId: string;
  itemId: string;
  tunnelId?: string;
  scheduledDate: string;
  scheduledEndDate?: string;
  scheduledTime: string;
  quantity: number;
  water: string;
  notes?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: string;
    customerId: string;
    customerName: string;
    company?: string;
  };
  item: {
    id: string;
    itemId: string;
    itemName: string;
    itemCategory: string;
    unit?: string;
  };
  tunnel?: {
    id: string;
    tunnelId: string;
    tunnelName: string;
    description?: string;
  };
}

export default function SchedulesPage() {
  const { data: session, status } = useSession();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [tunnels, setTunnels] = useState<Tunnel[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedTunnelId, setSelectedTunnelId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Authentication check moved after all hooks to avoid conditional hooks and TS narrowing issues

  // Saved schedules state
  const [savedSchedules, setSavedSchedules] = useState<SavedSchedule[]>([]);
  const [loadingSavedSchedules, setLoadingSavedSchedules] = useState(false);
  const [activeTab, setActiveTab] = useState<'create' | 'view'>('create');
  const [filterTunnels, setFilterTunnels] = useState<Tunnel[]>([]);

  // MQTT Terminal Notification state
  const [mqttNotification, setMqttNotification] = useState<{
    show: boolean;
    result: PublishSummary | null;
  }>({
    show: false,
    result: null
  });

  // Filter state
  const [filters, setFilters] = useState({
    customer: '',
    tunnel: '',
    fertilizer: '',
    status: '',
    dateFrom: '',
    dateTo: ''
  });

  // Form state
  const [formData, setFormData] = useState({
    date: '',
    endDate: '',
    fertilizerId: '',
    quantity: 1,
    water: '',
    time: '',
    notes: ''
  });

  // Track selected fertilizer unit
  const [selectedFertilizerUnit, setSelectedFertilizerUnit] = useState('');

  // Edit and delete states
  const [editingSchedule, setEditingSchedule] = useState<SavedSchedule | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  // Fetch saved schedules with optional filtering
  const fetchSavedSchedules = useCallback(async (useFilters = false) => {
    setLoadingSavedSchedules(true);
    try {
      let url = '/api/schedules';
      
      if (useFilters) {
        const params = new URLSearchParams();
        if (filters.customer) params.append('customerId', filters.customer);
        if (filters.tunnel) params.append('tunnelId', filters.tunnel);
        if (filters.fertilizer) params.append('itemId', filters.fertilizer);
        if (filters.status) params.append('status', filters.status);
        if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
        if (filters.dateTo) params.append('dateTo', filters.dateTo);
        
        if (params.toString()) {
          url += `?${params.toString()}`;
        }
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setSavedSchedules(data);
      } else {
        console.error('Failed to fetch saved schedules');
      }
    } catch (error) {
      console.error('Error fetching saved schedules:', error);
    } finally {
      setLoadingSavedSchedules(false);
    }
  }, [filters]);

  // Apply filters (now using server-side filtering)
  const applyFilters = useCallback(() => {
    fetchSavedSchedules(true);
  }, [fetchSavedSchedules]);

  // Handle delete schedule
  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) {
      return;
    }

    setDeleteLoading(scheduleId);
    try {
      const response = await fetch(`/api/schedules/${scheduleId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Refresh the schedules list
        await fetchSavedSchedules();
        alert('Schedule deleted successfully');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete schedule');
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
      alert('Failed to delete schedule');
    } finally {
      setDeleteLoading(null);
    }
  };

  // Handle edit schedule
  const handleEditSchedule = (schedule: SavedSchedule) => {
    setEditingSchedule(schedule);
    // Switch to create tab and populate form
    setActiveTab('create');
    setSelectedCustomerId(schedule.customer.id);
    setSelectedTunnelId(schedule.tunnel?.id || '');
    setShowForm(true);
    
    // Populate form with schedule data
    setFormData({
      date: schedule.scheduledDate.split('T')[0], // Convert to YYYY-MM-DD format
      endDate: schedule.scheduledEndDate ? schedule.scheduledEndDate.split('T')[0] : '',
      fertilizerId: schedule.item.id,
      quantity: schedule.quantity,
      water: schedule.water,
      time: schedule.scheduledTime,
      notes: schedule.notes || ''
    });
    
    // Set the unit for the selected fertilizer
    setSelectedFertilizerUnit(schedule.item.unit || '');
  };

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customersResponse, itemsResponse] = await Promise.all([
          fetch('/api/customers'),
          fetch('/api/items')
        ]);

        if (customersResponse.ok) {
          const customersData = await customersResponse.json();
          setCustomers(customersData);
        }

        if (itemsResponse.ok) {
          const itemsData = await itemsResponse.json();
          // Filter for fertilizer and related items
          const filteredItems = itemsData.filter((item: Item) => 
            item.itemCategory.toLowerCase().includes('fertilizer') ||
            item.itemCategory.toLowerCase().includes('chemical') ||
            item.itemCategory.toLowerCase().includes('nutrient')
          );
          setItems(filteredItems);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session && session.user.role === 'admin') {
      fetchData();
      fetchSavedSchedules(false);
    }
  }, [session, fetchSavedSchedules]);

  // Fetch tunnels when customer is selected
  useEffect(() => {
    const fetchTunnels = async () => {
      if (!selectedCustomerId) {
        setTunnels([]);
        setSelectedTunnelId('');
        return;
      }

      try {
        const response = await fetch(`/api/tunnels/by-customer/${selectedCustomerId}`);
        if (response.ok) {
          const tunnelsData = await response.json();
          setTunnels(tunnelsData);
        }
      } catch (error) {
        console.error('Error fetching tunnels:', error);
      }
    };

    fetchTunnels();
  }, [selectedCustomerId]);

  // Load schedules when switching to view tab
  useEffect(() => {
    if (activeTab === 'view' && savedSchedules.length === 0) {
      fetchSavedSchedules(false);
    }
  }, [activeTab, fetchSavedSchedules, savedSchedules.length]);

  // Real-time filtering: Apply filters automatically when filter values change
  useEffect(() => {
    if (activeTab === 'view') {
      // Add a small delay to debounce rapid filter changes
      const timeoutId = setTimeout(() => {
        // Check if any filters are set
        const hasFilters = filters.customer || filters.tunnel || filters.fertilizer || filters.status || filters.dateFrom || filters.dateTo;
        
        if (hasFilters) {
          // Apply filters immediately when any filter value changes
          fetchSavedSchedules(true);
        } else {
          // If no filters are set, load all schedules
          fetchSavedSchedules(false);
        }
      }, 300); // 300ms debounce delay

      return () => clearTimeout(timeoutId);
    }
  }, [filters, activeTab, fetchSavedSchedules]);

  // Fetch tunnels for filter when customer filter changes
  const selectedCustomerFilter = filters.customer;
  
  useEffect(() => {
    const fetchFilterTunnels = async () => {
      if (selectedCustomerFilter) {
        const tunnelsData = await getFilterTunnels(selectedCustomerFilter);
        setFilterTunnels(tunnelsData);
      } else {
        setFilterTunnels([]);
      }
    };

    fetchFilterTunnels();
  }, [selectedCustomerFilter]);

  // Early returns after all hooks
  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!session) {
    redirect('/login');
  }
  if (session.user.role !== 'admin') {
    redirect('/user/dashboard');
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const handleCustomerChange = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setSelectedTunnelId('');
  };

  const handleCreateClick = () => {
    if (!selectedCustomerId || !selectedTunnelId) {
      alert('Please select both customer and tunnel');
      return;
    }
    setShowForm(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.date || !formData.fertilizerId || !formData.time || !formData.water) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate date range if end date is provided
    if (formData.endDate && formData.date) {
      const startDate = new Date(formData.date);
      const endDate = new Date(formData.endDate);
      if (endDate < startDate) {
        alert('End date cannot be earlier than start date');
        return;
      }
    }

    const customer = customers.find(c => c.id === selectedCustomerId);
    const tunnel = tunnels.find(t => t.id === selectedTunnelId);
    const item = items.find(i => i.id === formData.fertilizerId);

    if (!customer || !tunnel || !item) {
      alert('Invalid selection');
      return;
    }

    // Create schedule items for date range or single date
    const newScheduleItems: ScheduleItem[] = [];
    
    if (formData.endDate && formData.date) {
      // Create schedules for date range
      const startDate = new Date(formData.date);
      const endDate = new Date(formData.endDate);
      
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        newScheduleItems.push({
          id: `${Date.now()}_${currentDate.toISOString().split('T')[0]}`,
          customerId: selectedCustomerId,
          customerName: customer.customerName,
          tunnelId: selectedTunnelId,
          tunnelName: tunnel.tunnelName,
          itemId: formData.fertilizerId,
          itemName: item.itemName,
          unit: item.unit,
          scheduledDate: currentDate.toISOString().split('T')[0],
          scheduledTime: formData.time,
          quantity: formData.quantity,
          water: formData.water,
          notes: formData.notes
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }
    } else {
      // Single date schedule
      newScheduleItems.push({
        id: Date.now().toString(),
        customerId: selectedCustomerId,
        customerName: customer.customerName,
        tunnelId: selectedTunnelId,
        tunnelName: tunnel.tunnelName,
        itemId: formData.fertilizerId,
        itemName: item.itemName,
        unit: item.unit,
        scheduledDate: formData.date,
        scheduledTime: formData.time,
        quantity: formData.quantity,
        water: formData.water,
        notes: formData.notes
      });
    }

    if (editingSchedule) {
      // For edit mode, we'll update the schedule directly via API
      setSaving(true);
      try {
        const response = await fetch(`/api/schedules/${editingSchedule.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customerId: selectedCustomerId,
            itemId: formData.fertilizerId,
            scheduledDate: formData.date,
            scheduledTime: formData.time,
            quantity: formData.quantity,
            water: formData.water,
            notes: formData.notes
          }),
        });

        if (response.ok) {
          // Refresh saved schedules
          await fetchSavedSchedules();
          alert('Schedule updated successfully!');
          
          // Reset form and close
          setFormData({
            date: '',
            endDate: '',
            fertilizerId: '',
            quantity: 1,
            water: '',
            time: '',
            notes: ''
          });
          setShowForm(false);
          setSelectedFertilizerUnit('');
          setEditingSchedule(null);
        } else {
          const error = await response.json();
          alert(error.error || 'Failed to update schedule');
        }
      } catch (error) {
        console.error('Error updating schedule:', error);
        alert('Failed to update schedule');
      } finally {
        setSaving(false);
      }
    } else {
      // For create mode, add to local list
      setScheduleItems([...scheduleItems, ...newScheduleItems]);
      setFormData({
        date: '',
        endDate: '',
        fertilizerId: '',
        quantity: 1,
        water: '',
        time: '',
        notes: ''
      });
      setShowForm(false);
      setSelectedFertilizerUnit('');
    }
  };

  const handleSaveAll = async () => {
    if (scheduleItems.length === 0) {
      alert('No schedules to save');
      return;
    }

    setSaving(true);
    try {
      // Prepare batch data
      const batchData = scheduleItems.map(item => ({
        customerId: item.customerId,
        itemId: item.itemId,
        tunnelId: item.tunnelId,
        scheduledDate: item.scheduledDate,
        scheduledTime: item.scheduledTime,
        quantity: item.quantity,
        water: item.water,
        notes: item.notes
      }));

      console.log('Making API call to:', window.location.origin + '/api/schedules');
      console.log('Current window location:', window.location.href);
      
      const response = await fetch('/api/schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(batchData),
      });

      const result = await response.json();

      if (response.ok) {
        // Show MQTT terminal notification if MQTT publishing occurred
        if (result.mqttPublish) {
          setMqttNotification({
            show: true,
            result: result.mqttPublish
          });
        }

        if (response.status === 207) {
          // Partial success
          const successMessage = `${result.message}`;
          const mqttMessage = result.mqttPublish?.overallSuccess 
            ? '\n✅ ESP32 data sent successfully!' 
            : result.mqttPublish 
              ? '\n⚠️ ESP32 data partially sent - check terminal for details'
              : '';
          alert(successMessage + mqttMessage);
        } else {
          // Full success
          const mqttMessage = result.mqttPublish?.overallSuccess 
            ? '\n✅ ESP32 data sent successfully!' 
            : result.mqttPublish 
              ? '\n⚠️ ESP32 data partially sent - check terminal for details'
              : '';
          alert(`All ${batchData.length} schedules saved successfully!` + mqttMessage);
        }
        
        setScheduleItems([]);
        setSelectedCustomerId('');
        setSelectedTunnelId('');
        // Refresh saved schedules to show the newly created ones
        fetchSavedSchedules(false);
      } else {
        console.error('Error response:', result);
        alert(result.error || 'Failed to save schedules');
      }
    } catch (error) {
      console.error('Error saving schedules:', error);
      alert('Failed to save schedules');
    } finally {
      setSaving(false);
    }
  };

  const removeScheduleItem = (id: string) => {
    setScheduleItems(scheduleItems.filter(item => item.id !== id));
  };

  // Get unique tunnels for the selected customer in filters
  const getFilterTunnels = async (customerId: string) => {
    if (!customerId) return [];
    try {
      const response = await fetch(`/api/tunnels/by-customer/${customerId}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error fetching filter tunnels:', error);
    }
    return [];
  };


  const resetFilters = () => {
    setFilters({
      customer: '',
      tunnel: '',
      fertilizer: '',
      status: '',
      dateFrom: '',
      dateTo: ''
    });
    // Fetch all schedules without filters
    fetchSavedSchedules(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Layout>
      {/* MQTT Terminal Notification */}
      <MQTTTerminalNotification
        publishResult={mqttNotification.result}
        show={mqttNotification.show}
        onClose={() => setMqttNotification({ show: false, result: null })}
      />

      <main className="min-h-screen bg-gray-50 text-gray-900">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-6 shadow-sm">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  🌱 Fertilizer Scheduler
                </h1>
                <p className="text-gray-600">
                  Schedule fertilizer applications for customer tunnels
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-4 py-4">
          <div className="max-w-7xl mx-auto">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('create')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'create'
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Create Schedules
                </button>
                <button
                  onClick={() => setActiveTab('view')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'view'
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  View & Manage Schedules ({savedSchedules.length})
                </button>
              </nav>
            </div>
          </div>
        </div>

        {/* Create Schedules Tab */}
        {activeTab === 'create' && (
          <>
            {/* Customer and Tunnel Selection */}
            <div className="px-4 py-6">
              <div className="max-w-7xl mx-auto">
                <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer *
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => handleCustomerChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900"
              >
                <option value="">Select Customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.customerName} {customer.company ? `(${customer.company})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tunnel *
              </label>
              <select
                value={selectedTunnelId}
                onChange={(e) => setSelectedTunnelId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900"
                disabled={!selectedCustomerId}
              >
                <option value="">Select Tunnel</option>
                {tunnels.map((tunnel) => (
                  <option key={tunnel.id} value={tunnel.id}>
                    {tunnel.tunnelName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <button
                onClick={handleCreateClick}
                disabled={!selectedCustomerId || !selectedTunnelId}
                className="w-full px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Schedule
              </button>
            </div>
          </div>
        </div>

        {/* Schedule Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {editingSchedule ? 'Edit Schedule' : 'New Schedule'}
            </h2>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    📅 End Date <span className="text-gray-500">(Optional)</span>
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900"
                    min={formData.date || undefined}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    🧪 Fertilizer Type *
                  </label>
                  <select
                    value={formData.fertilizerId}
                    onChange={(e) => {
                      const selectedItem = items.find(item => item.id === e.target.value);
                      setSelectedFertilizerUnit(selectedItem?.unit || '');
                      setFormData({...formData, fertilizerId: e.target.value});
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900"
                    required
                  >
                    <option value="">Select Fertilizer</option>
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.itemName} ({item.itemCategory})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    📦 Quantity {selectedFertilizerUnit && `(${selectedFertilizerUnit})`}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.quantity}
                      onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 1})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900"
                      placeholder={selectedFertilizerUnit ? `Enter quantity in ${selectedFertilizerUnit}` : 'Enter quantity'}
                    />
                    {selectedFertilizerUnit && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 text-sm font-medium">
                          {selectedFertilizerUnit}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    💧 Water (L) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.water}
                      onChange={(e) => setFormData({...formData, water: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      placeholder="Enter water amount"
                      required
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 text-sm font-medium">L</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ⏰ Time *
                  </label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({...formData, time: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  📝 Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  rows={2}
                />
              </div>

              {/* Date Range Preview */}
              {formData.date && formData.endDate && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <div className="text-sm text-blue-800">
                    <strong>📊 Schedule Preview:</strong>
                    {(() => {
                      const startDate = new Date(formData.date);
                      const endDate = new Date(formData.endDate);
                      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                      return ` ${diffDays} schedule(s) will be created from ${formData.date} to ${formData.endDate} at ${formData.time || '[time not set]'}`;
                    })()}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingSchedule(null);
                    setSelectedFertilizerUnit('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : (editingSchedule ? '💾 Update' : '💾 Save')}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Schedule List */}
        {scheduleItems.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Scheduled Items</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tunnel
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fertilizer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {scheduleItems.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.customerName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.tunnelName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.scheduledDate} at {item.scheduledTime}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.itemName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.quantity} {item.unit && `(${item.unit})`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => removeScheduleItem(item.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Save All Button */}
        {scheduleItems.length > 0 && (
          <div className="flex justify-end">
            <button
              onClick={handleSaveAll}
              disabled={saving}
              className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {saving ? 'Saving...' : '💾 Save All Schedules'}
            </button>
          </div>
        )}

        {scheduleItems.length === 0 && !showForm && (
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <p className="text-gray-900">Select a customer and tunnel, then click "Create Schedule" to get started.</p>
          </div>
        )}
              </div>
            </div>
          </>
        )}

        {/* View & Manage Schedules Tab */}
        {activeTab === 'view' && (
          <>
            {/* Filters */}
            <div className="px-4 py-6">
              <div className="max-w-7xl mx-auto">
                <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">🔍 Filter Schedules</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {/* Customer Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                  <select
                    value={filters.customer}
                    onChange={(e) => setFilters({...filters, customer: e.target.value, tunnel: ''})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900"
                  >
                    <option value="">All Customers</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.customerName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tunnel Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tunnel</label>
                  <select
                    value={filters.tunnel}
                    onChange={(e) => setFilters({...filters, tunnel: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900"
                    disabled={!filters.customer}
                  >
                    <option value="">All Tunnels</option>
                    {filterTunnels.map((tunnel) => (
                      <option key={tunnel.id} value={tunnel.id}>
                        {tunnel.tunnelName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Fertilizer Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fertilizer</label>
                  <select
                    value={filters.fertilizer}
                    onChange={(e) => setFilters({...filters, fertilizer: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900"
                  >
                    <option value="">All Fertilizers</option>
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.itemName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({...filters, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900"
                  >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Date From */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900"
                  />
                </div>

                {/* Date To */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900"
                    min={filters.dateFrom || undefined}
                  />
                </div>
              </div>

              {/* Filter Actions */}
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-gray-600">
                  Showing {savedSchedules.length} schedule{savedSchedules.length !== 1 ? 's' : ''}
                  {(filters.customer || filters.tunnel || filters.fertilizer || filters.status || filters.dateFrom || filters.dateTo) && (
                    <span className="ml-1 text-emerald-600 font-medium">
                      (filtered in real-time)
                    </span>
                  )}
                  {loadingSavedSchedules && (
                    <span className="ml-1 text-blue-600">
                      ⏳ Updating...
                    </span>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={resetFilters}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    🔄 Reset Filters
                  </button>
                  <button
                    onClick={applyFilters}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
                    disabled={loadingSavedSchedules}
                  >
                    {loadingSavedSchedules ? '⏳ Refreshing...' : '🔄 Refresh Filters'}
                  </button>
                  <button
                    onClick={() => fetchSavedSchedules(false)}
                    className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-md hover:bg-emerald-700"
                    disabled={loadingSavedSchedules}
                  >
                    {loadingSavedSchedules ? '⏳ Refreshing...' : '🔄 Refresh All'}
                  </button>
                </div>
              </div>
            </div>

            {/* Saved Schedules List */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">📋 Saved Schedules</h2>
              
              {loadingSavedSchedules ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading schedules...</p>
                </div>
              ) : savedSchedules.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">No schedules found matching the current filters.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tunnel
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fertilizer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date & Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {savedSchedules.map((schedule) => (
                        <tr key={schedule.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div>
                              <div className="font-medium">{schedule.customer.customerName}</div>
                              {schedule.customer.company && (
                                <div className="text-gray-500">{schedule.customer.company}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {schedule.tunnel ? schedule.tunnel.tunnelName : 'No Tunnel'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div>
                              <div className="font-medium">{schedule.item.itemName}</div>
                              <div className="text-gray-500">{schedule.item.itemCategory}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div>
                              <div>{formatDate(schedule.scheduledDate)}</div>
                              <div className="text-gray-500">at {schedule.scheduledTime}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {schedule.quantity} {schedule.item.unit && `(${schedule.item.unit})`}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(schedule.status)}`}>
                              {schedule.status.charAt(0).toUpperCase() + schedule.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => handleEditSchedule(schedule)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Edit
                              </button>
                              <button 
                                onClick={() => handleDeleteSchedule(schedule.id)}
                                disabled={deleteLoading === schedule.id}
                                className="text-red-600 hover:text-red-900 disabled:opacity-50"
                              >
                                {deleteLoading === schedule.id ? 'Deleting...' : 'Delete'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
              </div>
            </div>
          </>
        )}
      </main>
    </Layout>
  );
}