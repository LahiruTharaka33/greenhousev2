'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';

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

interface FertilizerType {
  id: string;
  itemId: string;
  itemName: string;
  itemCategory: string;
  unit: string;
}

interface Release {
  id?: string;
  time: string;
  releaseQuantity: number;
}

interface ScheduleV2 {
  id: string;
  customerId: string;
  tunnelId: string;
  scheduledDate: string;
  fertilizerTypeId: string;
  quantity: number;
  water: number;
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
  tunnel: {
    id: string;
    tunnelId: string;
    tunnelName: string;
    description?: string;
  };
  fertilizerType: {
    id: string;
    itemId: string;
    itemName: string;
    itemCategory: string;
    unit: string;
  };
  releases?: Release[];
}

export default function SchedulesV2Page() {
  const { data: session, status } = useSession();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [tunnels, setTunnels] = useState<Tunnel[]>([]);
  const [fertilizerTypes, setFertilizerTypes] = useState<FertilizerType[]>([]);
  const [schedules, setSchedules] = useState<ScheduleV2[]>([]);
  
  // Form state
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedTunnelId, setSelectedTunnelId] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [selectedFertilizerTypeId, setSelectedFertilizerTypeId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [water, setWater] = useState('');
  const [notes, setNotes] = useState('');
  
  // Release sub-list state
  const [releases, setReleases] = useState<Release[]>([
    { time: '', releaseQuantity: 0 }
  ]);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedFertilizerUnit, setSelectedFertilizerUnit] = useState('');
  const [editingSchedule, setEditingSchedule] = useState<ScheduleV2 | null>(null);
  const [activeTab, setActiveTab] = useState<'create' | 'view'>('create');


  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customersResponse, fertilizerTypesResponse, schedulesResponse] = await Promise.all([
          fetch('/api/customers'),
          fetch('/api/items'),
          fetch('/api/schedules-v2')
        ]);

        if (customersResponse.ok) {
          const customersData = await customersResponse.json();
          setCustomers(customersData);
        }

        if (fertilizerTypesResponse.ok) {
          const itemsData = await fertilizerTypesResponse.json();
          // Filter for fertilizer and related items
          const filteredItems = itemsData.filter((item: FertilizerType) => 
            item.itemCategory.toLowerCase().includes('fertilizer') ||
            item.itemCategory.toLowerCase().includes('chemical') ||
            item.itemCategory.toLowerCase().includes('nutrient')
          );
          setFertilizerTypes(filteredItems);
        }

        if (schedulesResponse.ok) {
          const schedulesData = await schedulesResponse.json();
          console.log('Fetched schedules data:', schedulesData);
          setSchedules(schedulesData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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

  // Update fertilizer unit when fertilizer type changes
  useEffect(() => {
    if (selectedFertilizerTypeId) {
      const selectedFertilizer = fertilizerTypes.find(f => f.id === selectedFertilizerTypeId);
      setSelectedFertilizerUnit(selectedFertilizer?.unit || '');
    } else {
      setSelectedFertilizerUnit('');
    }
  }, [selectedFertilizerTypeId, fertilizerTypes]);

  // Calculate total release quantity
  const totalReleaseQuantity = releases.reduce((sum, release) => {
    return sum + (Number(release.releaseQuantity) || 0);
  }, 0);

  // Check if total exceeds water limit
  const isReleaseQuantityValid = totalReleaseQuantity <= parseFloat(water || '0');

  // Add new release row
  const addReleaseRow = () => {
    setReleases([...releases, { time: '', releaseQuantity: 0 }]);
  };

  // Remove release row
  const removeReleaseRow = (index: number) => {
    if (releases.length > 1) {
      setReleases(releases.filter((_, i) => i !== index));
    }
  };

  // Update release row
  const updateReleaseRow = (index: number, field: keyof Release, value: any) => {
    const updatedReleases = [...releases];
    updatedReleases[index] = { ...updatedReleases[index], [field]: value };
    setReleases(updatedReleases);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCustomerId || !selectedTunnelId || !scheduledDate || !selectedFertilizerTypeId || !quantity || !water) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate release quantities
    if (!isReleaseQuantityValid) {
      alert(`Total release quantity (${totalReleaseQuantity}L) cannot exceed water amount (${water}L)`);
      return;
    }

    setSaving(true);
    try {
      const scheduleData = {
        customerId: selectedCustomerId,
        tunnelId: selectedTunnelId,
        scheduledDate,
        fertilizerTypeId: selectedFertilizerTypeId,
        quantity: parseFloat(quantity),
        water: parseFloat(water),
        notes: notes || '',
        releases: releases.filter(release => release.time && release.releaseQuantity > 0)
      };

      const url = editingSchedule ? `/api/schedules-v2/${editingSchedule.id}` : '/api/schedules-v2';
      const method = editingSchedule ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scheduleData),
      });

      if (response.ok) {
        const result = await response.json();
        const scheduleData = result.schedule || result;
        
        // Build success message
        let successMessage = '';
        if (editingSchedule) {
          successMessage = 'Schedule updated successfully!';
          // Update existing schedule in the list
          setSchedules(schedules.map(s => s.id === editingSchedule.id ? scheduleData : s));
          // Switch back to view tab to see the updated schedule
          setActiveTab('view');
        } else {
          successMessage = 'Schedule created successfully!';
          successMessage += '\n📅 Schedule will be sent to ESP32 at 11:45 AM UTC on the scheduled date.';
          // Add new schedule to the list
          setSchedules([scheduleData, ...schedules]);
        }
        
        alert(successMessage);
        
        // Reset form
        resetForm();
      } else {
        const error = await response.json();
        console.error('API Error:', error);
        alert(error.details || error.error || 'Failed to save schedule');
      }
    } catch (error) {
      console.error('Error saving schedule:', error);
      alert('Failed to save schedule');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setSelectedCustomerId('');
    setSelectedTunnelId('');
    setScheduledDate('');
    setSelectedFertilizerTypeId('');
    setQuantity('');
    setWater('');
    setNotes('');
    setEditingSchedule(null);
    setSelectedFertilizerUnit('');
    setReleases([{ time: '', releaseQuantity: 0 }]);
  };

  const handleEdit = (schedule: ScheduleV2) => {
    setEditingSchedule(schedule);
    setSelectedCustomerId(schedule.customerId);
    setSelectedTunnelId(schedule.tunnelId);
    setScheduledDate(schedule.scheduledDate.split('T')[0]);
    setSelectedFertilizerTypeId(schedule.fertilizerTypeId);
    setQuantity(schedule.quantity.toString());
    setWater(schedule.water.toString());
    setNotes(schedule.notes || '');
    
    // Ensure proper data type conversion for releases
    if (schedule.releases && schedule.releases.length > 0) {
      const convertedReleases = schedule.releases.map(release => ({
        id: release.id,
        time: release.time,
        releaseQuantity: parseFloat(release.releaseQuantity.toString()) || 0
      }));
      setReleases(convertedReleases);
    } else {
      setReleases([{ time: '', releaseQuantity: 0 }]);
    }
  };

  const handleDelete = async (scheduleId: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) {
      return;
    }

    try {
      const response = await fetch(`/api/schedules-v2/${scheduleId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSchedules(schedules.filter(s => s.id !== scheduleId));
        alert('Schedule deleted successfully');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete schedule');
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
      alert('Failed to delete schedule');
    }
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
      case 'sent':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Authentication checks - moved after all hooks
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

  return (
    <Layout>
      <main className="min-h-screen bg-gray-50 text-gray-900">
        {/* Header with Safe Zone - Sticky with backdrop blur */}
        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-200 pl-[72px] pr-4 lg:px-4 py-4 lg:py-6 shadow-sm animate-fade-in">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col space-y-2">
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                  🌱 New Schedule System
                </h1>
                <p className="text-sm sm:text-base text-gray-600 mt-1">
                  Create and manage fertilizer schedules with improved interface
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation with Safe Zone */}
        <div className="pl-[72px] pr-4 lg:px-4 py-4 bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-4 sm:space-x-8">
                <button
                  onClick={() => setActiveTab('create')}
                  className={`py-3 px-2 min-h-[44px] border-b-2 font-medium text-sm sm:text-base transition-colors ${
                    activeTab === 'create'
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 active:bg-gray-50'
                  }`}
                >
                  Create
                </button>
                <button
                  onClick={() => setActiveTab('view')}
                  className={`py-3 px-2 min-h-[44px] border-b-2 font-medium text-sm sm:text-base transition-colors ${
                    activeTab === 'view'
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 active:bg-gray-50'
                  }`}
                >
                  <span className="hidden sm:inline">View Schedules</span>
                  <span className="sm:hidden">View</span>
                  <span className="ml-1">({schedules.length})</span>
                </button>
              </nav>
            </div>
          </div>
        </div>

        {/* Content with Safe Zone */}
        <div className="pl-[72px] pr-4 lg:px-4 py-4 lg:py-6 animate-fade-in-up">
          <div className="max-w-7xl mx-auto space-y-4 lg:space-y-6">
            {/* Create Schedule Tab */}
            {activeTab === 'create' && (
              <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">
                {editingSchedule ? 'Edit Schedule' : 'Create New Schedule'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                {/* Header Section - Customer, Tunnel, Date */}
                <div className="border-b border-gray-200 pb-4 sm:pb-6">
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Schedule Head</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                    {/* Customer */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Customer *
                      </label>
                      <select
                        value={selectedCustomerId}
                        onChange={(e) => {
                          setSelectedCustomerId(e.target.value);
                          setSelectedTunnelId(''); // Reset tunnel when customer changes
                        }}
                        className="w-full px-3 py-3 min-h-[44px] border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 text-base"
                        required
                      >
                        <option value="">Select Customer</option>
                        {customers.map((customer) => (
                          <option key={customer.id} value={customer.id}>
                            {customer.customerName} {customer.company ? `(${customer.company})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Tunnel */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tunnel *
                      </label>
                      <select
                        value={selectedTunnelId}
                        onChange={(e) => setSelectedTunnelId(e.target.value)}
                        className="w-full px-3 py-3 min-h-[44px] border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 text-base"
                        disabled={!selectedCustomerId}
                        required
                      >
                        <option value="">Select Tunnel</option>
                        {tunnels.map((tunnel) => (
                          <option key={tunnel.id} value={tunnel.id}>
                            {tunnel.tunnelName}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date *
                      </label>
                      <input
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        className="w-full px-3 py-3 min-h-[44px] border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 text-base"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Details Section - Fertilizer, Quantity, Water */}
                <div>
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Schedule Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                    {/* Fertilizer Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fertilizer Type *
                      </label>
                      <select
                        value={selectedFertilizerTypeId}
                        onChange={(e) => setSelectedFertilizerTypeId(e.target.value)}
                        className="w-full px-3 py-3 min-h-[44px] border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 text-base"
                        required
                      >
                        <option value="">Select Fertilizer</option>
                        {fertilizerTypes.map((fertilizer) => (
                          <option key={fertilizer.id} value={fertilizer.id}>
                            {fertilizer.itemName} ({fertilizer.itemCategory})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quantity */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantity {selectedFertilizerUnit && `(${selectedFertilizerUnit})`} *
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          className="w-full px-3 py-3 min-h-[44px] border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 text-base pr-12"
                          placeholder={selectedFertilizerUnit ? `Enter in ${selectedFertilizerUnit}` : 'Enter quantity'}
                          required
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

                    {/* Water */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Water (L) *
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={water}
                          onChange={(e) => setWater(e.target.value)}
                          className="w-full px-3 py-3 min-h-[44px] border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-base pr-8"
                          placeholder="Enter water amount"
                          required
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 text-sm font-medium">L</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Release Sub-List */}
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 sm:mb-4">
                    <h3 className="text-base sm:text-lg font-medium text-gray-900">Release Schedule</h3>
                    <button
                      type="button"
                      onClick={addReleaseRow}
                      className="px-4 py-2 min-h-[44px] text-sm sm:text-base bg-blue-600 text-white rounded-md hover:bg-blue-700 active:bg-blue-800 transition-colors w-full sm:w-auto"
                    >
                      + Add Release
                    </button>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    {releases.map((release, index) => (
                      <div key={index} className="flex flex-col sm:flex-row sm:items-end gap-3 p-3 sm:p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Time
                          </label>
                          <input
                            type="time"
                            value={release.time}
                            onChange={(e) => updateReleaseRow(index, 'time', e.target.value)}
                            className="w-full px-3 py-3 min-h-[44px] border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-base"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Release Quantity (L)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              value={release.releaseQuantity}
                              onChange={(e) => updateReleaseRow(index, 'releaseQuantity', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-3 min-h-[44px] border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-base pr-8"
                              placeholder="Enter quantity"
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                              <span className="text-gray-500 text-sm font-medium">L</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex sm:items-end">
                          {releases.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeReleaseRow(index)}
                              className="w-full sm:w-auto px-4 py-2 min-h-[44px] text-sm sm:text-base text-red-600 hover:text-red-800 hover:bg-red-50 active:bg-red-100 rounded-md transition-colors font-medium"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Validation Summary */}
                  <div className="mt-3 sm:mt-4 p-3 sm:p-4 rounded-md border bg-white">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                      <span className="text-sm sm:text-base font-medium text-gray-700">
                        Total Release Quantity:
                      </span>
                      <span className={`text-base sm:text-lg font-bold ${isReleaseQuantityValid ? 'text-green-600' : 'text-red-600'}`}>
                        {totalReleaseQuantity.toFixed(1)}L / {water || '0'}L
                      </span>
                    </div>
                    {!isReleaseQuantityValid && (
                      <div className="mt-2 text-sm sm:text-base text-red-600 font-medium">
                        ⚠️ Total release quantity cannot exceed water amount
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-base"
                    rows={3}
                    placeholder="Add any additional notes..."
                  />
                </div>

                {/* Form Actions */}
                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="w-full sm:w-auto px-6 py-3 min-h-[44px] text-gray-700 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-md transition-colors font-medium"
                  >
                    {editingSchedule ? 'Cancel' : 'Reset'}
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full sm:w-auto px-6 py-3 min-h-[44px] bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {saving ? 'Saving...' : (editingSchedule ? 'Update Schedule' : 'Create Schedule')}
                  </button>
                </div>
              </form>
              </div>
            )}

            {/* View Schedules Tab */}
            {activeTab === 'view' && (
              <div className="space-y-4 sm:space-y-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Saved Schedules</h2>
              
              {schedules.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border">
                  <div className="text-gray-400 text-5xl sm:text-6xl mb-4">📅</div>
                  <p className="text-gray-600 text-base sm:text-lg font-medium">No schedules created yet.</p>
                  <p className="text-gray-500 text-sm sm:text-base mt-2 px-4">Create your first schedule using the "Create" tab.</p>
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-6">
                  {schedules.map((schedule) => (
                    <div key={schedule.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                      {/* Card Header */}
                      <div className="bg-gradient-to-r from-emerald-50 to-blue-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                              {schedule.customer.customerName}
                            </h3>
                            <p className="text-sm text-gray-600 truncate">{schedule.tunnel.tunnelName}</p>
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(schedule.status)} self-start sm:self-auto`}>
                            {schedule.status.charAt(0).toUpperCase() + schedule.status.slice(1)}
                          </span>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-4 sm:p-6 space-y-4">
                        {/* Schedule Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Date:</span>
                            <p className="font-medium text-gray-900">{formatDate(schedule.scheduledDate)}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Fertilizer:</span>
                            <p className="font-medium text-gray-900">{schedule.fertilizerType.itemName}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Quantity:</span>
                            <p className="font-medium text-gray-900">{schedule.quantity} {schedule.fertilizerType.unit}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Water:</span>
                            <p className="font-medium text-gray-900">{schedule.water}L</p>
                          </div>
                        </div>

                        {/* Release Schedule */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-3">Release Schedule</h4>
                          {schedule.releases && schedule.releases.length > 0 ? (
                            <div className="space-y-2">
                              {schedule.releases.map((release, index) => (
                                <div key={index} className="flex items-center justify-between bg-blue-50 px-3 py-2 rounded-md border border-blue-200">
                                  <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                                    <span className="text-sm font-medium text-gray-900">{release.time}</span>
                                  </div>
                                  <span className="text-sm font-semibold text-blue-600 flex-shrink-0 ml-2">{release.releaseQuantity}L</span>
                                </div>
                              ))}
                              <div className="mt-2 pt-2 border-t border-gray-200">
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-500">Total Release:</span>
                                  <span className="font-semibold text-gray-900">
                                    {schedule.releases.reduce((sum, r) => sum + r.releaseQuantity, 0)}L
                                  </span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-4 text-gray-400 text-sm">
                              <div className="text-2xl mb-1">💧</div>
                              No releases scheduled
                            </div>
                          )}
                        </div>

                        {/* Notes */}
                        {schedule.notes && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Notes</h4>
                            <p className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-md break-words">
                              {schedule.notes}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Card Footer */}
                      <div className="bg-gray-50 px-4 sm:px-6 py-3 border-t border-gray-200">
                        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
                          <button 
                            onClick={() => {
                              setActiveTab('create');
                              handleEdit(schedule);
                            }}
                            className="w-full sm:w-auto px-4 py-2 min-h-[44px] text-sm sm:text-base text-blue-600 hover:text-blue-800 hover:bg-blue-50 active:bg-blue-100 rounded-md transition-colors font-medium"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(schedule.id)}
                            className="w-full sm:w-auto px-4 py-2 min-h-[44px] text-sm sm:text-base text-red-600 hover:text-red-800 hover:bg-red-50 active:bg-red-100 rounded-md transition-colors font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              </div>
            )}
          </div>
        </div>

      </main>
    </Layout>
  );
}
