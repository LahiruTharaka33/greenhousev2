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

interface Item {
  id: string;
  itemId: string;
  itemName: string;
  itemCategory: string;
}

interface ScheduleItem {
  id: string;
  customerId: string;
  customerName: string;
  tunnelId: string;
  tunnelName: string;
  itemId: string;
  itemName: string;
  scheduledDate: string;
  scheduledTime: string;
  quantity: number;
  notes?: string;
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

  // Form state
  const [formData, setFormData] = useState({
    date: '',
    fertilizerId: '',
    quantity: 1,
    time: '',
    notes: ''
  });

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
    }
  }, [session]);

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

  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!session || session.user.role !== 'admin') {
    redirect('/login');
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

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.date || !formData.fertilizerId || !formData.time) {
      alert('Please fill in all required fields');
      return;
    }

    const customer = customers.find(c => c.id === selectedCustomerId);
    const tunnel = tunnels.find(t => t.id === selectedTunnelId);
    const item = items.find(i => i.id === formData.fertilizerId);

    if (!customer || !tunnel || !item) {
      alert('Invalid selection');
      return;
    }

    const newScheduleItem: ScheduleItem = {
      id: Date.now().toString(),
      customerId: selectedCustomerId,
      customerName: customer.customerName,
      tunnelId: selectedTunnelId,
      tunnelName: tunnel.tunnelName,
      itemId: formData.fertilizerId,
      itemName: item.itemName,
      scheduledDate: formData.date,
      scheduledTime: formData.time,
      quantity: formData.quantity,
      notes: formData.notes
    };

    setScheduleItems([...scheduleItems, newScheduleItem]);
    setFormData({
      date: '',
      fertilizerId: '',
      quantity: 1,
      time: '',
      notes: ''
    });
    setShowForm(false);
  };

  const handleSaveAll = async () => {
    if (scheduleItems.length === 0) {
      alert('No schedules to save');
      return;
    }

    setSaving(true);
    try {
      const promises = scheduleItems.map(item => 
        fetch('/api/schedules', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customerId: item.customerId,
            itemId: item.itemId,
            tunnelId: item.tunnelId,
            scheduledDate: item.scheduledDate,
            scheduledTime: item.scheduledTime,
            quantity: item.quantity,
            notes: item.notes
          }),
        })
      );

      const responses = await Promise.all(promises);
      const hasError = responses.some(response => !response.ok);

      if (hasError) {
        alert('Some schedules failed to save. Please try again.');
      } else {
        alert('All schedules saved successfully!');
        setScheduleItems([]);
        setSelectedCustomerId('');
        setSelectedTunnelId('');
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

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <Layout>
      <main className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">
            🌱 Fertilizer Scheduler
          </h1>
          <p className="text-lg text-black">
            Schedule fertilizer applications for customer tunnels
          </p>
        </div>

        {/* Customer and Tunnel Selection */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Customer *
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => handleCustomerChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
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
              <label className="block text-sm font-medium text-black mb-2">
                Tunnel *
              </label>
              <select
                value={selectedTunnelId}
                onChange={(e) => setSelectedTunnelId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
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
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                📅 Create Schedule
              </button>
            </div>
          </div>
        </div>

        {/* Schedule Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h2 className="text-xl font-semibold text-black mb-4">New Schedule</h2>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    📅 Date *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    🧪 Fertilizer Type *
                  </label>
                  <select
                    value={formData.fertilizerId}
                    onChange={(e) => setFormData({...formData, fertilizerId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
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
                  <label className="block text-sm font-medium text-black mb-1">
                    📦 Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 1})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    ⏰ Time *
                  </label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({...formData, time: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  📝 Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  rows={2}
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm font-medium text-black bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  💾 Save
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Schedule List */}
        {scheduleItems.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h2 className="text-xl font-semibold text-black mb-4">Scheduled Items</h2>
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        {item.customerName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        {item.tunnelName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        {item.scheduledDate} at {item.scheduledTime}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        {item.itemName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        {item.quantity}
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
            <p className="text-black">Select a customer and tunnel, then click "Create Schedule" to get started.</p>
          </div>
        )}
      </main>
    </Layout>
  );
}