'use client';

import { useState, useEffect } from 'react';

interface Customer {
  id: string;
  customerId: string;
  customerName: string;
  company?: string;
}

interface Item {
  id: string;
  itemId: string;
  itemName: string;
  itemCategory: string;
}

interface ScheduleItem {
  id: string;
  itemId: string;
  scheduledDate: string;
  scheduledTime: string;
  quantity: number;
  notes: string;
}

interface ScheduleFormProps {
  onSubmit: (scheduleData: { customerId: string; items: ScheduleItem[] }) => void;
  onCancel: () => void;
  loading?: boolean;
  initialData?: any;
}

export default function ScheduleForm({ onSubmit, onCancel, loading = false, initialData }: ScheduleFormProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([
    {
      id: '',
      itemId: '',
      scheduledDate: '',
      scheduledTime: '',
      quantity: 1,
      notes: ''
    }
  ]);
  const [loadingData, setLoadingData] = useState(true);

  // Fetch customers and items
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
        setLoadingData(false);
      }
    };

    fetchData();
  }, []);

  // Initialize form with existing data if editing
  useEffect(() => {
    if (initialData) {
      setSelectedCustomerId(initialData.customerId);
      setScheduleItems(initialData.items || []);
    }
  }, [initialData]);

  const addScheduleItem = () => {
    setScheduleItems([
      ...scheduleItems,
      {
        id: '',
        itemId: '',
        scheduledDate: '',
        scheduledTime: '',
        quantity: 1,
        notes: ''
      }
    ]);
  };

  const removeScheduleItem = (index: number) => {
    if (scheduleItems.length > 1) {
      setScheduleItems(scheduleItems.filter((_, i) => i !== index));
    }
  };

  const updateScheduleItem = (index: number, field: keyof ScheduleItem, value: any) => {
    const updatedItems = [...scheduleItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setScheduleItems(updatedItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCustomerId) {
      alert('Please select a customer');
      return;
    }

    const validItems = scheduleItems.filter(item => 
      item.itemId && item.scheduledDate && item.scheduledTime
    );

    if (validItems.length === 0) {
      alert('Please add at least one schedule item');
      return;
    }

    onSubmit({
      customerId: selectedCustomerId,
      items: validItems
    });
  };

  if (loadingData) {
    return <div className="text-center py-4">Loading...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-2xl font-semibold text-black mb-6">
        {initialData ? 'Edit Schedule' : 'Create New Schedule'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Selection */}
        <div>
          <label className="block text-sm font-medium text-black mb-2">
            Customer *
          </label>
          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
            required
          >
            <option value="" className="text-black">Select a customer</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id} className="text-black">
                {customer.customerName} {customer.company ? `(${customer.company})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Schedule Items */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-medium text-black">
              Schedule Items *
            </label>
            <button
              type="button"
              onClick={addScheduleItem}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              + Add Item
            </button>
          </div>

          <div className="space-y-4">
            {scheduleItems.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-black">Item {index + 1}</h4>
                  {scheduleItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeScheduleItem(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Item Selection */}
                  <div>
                    <label className="block text-sm text-black mb-1">Item *</label>
                    <select
                      value={item.itemId}
                      onChange={(e) => updateScheduleItem(index, 'itemId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                      required
                    >
                      <option value="" className="text-black">Select an item</option>
                      {items.map((itm) => (
                        <option key={itm.id} value={itm.id} className="text-black">
                          {itm.itemName} ({itm.itemCategory})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="block text-sm text-black mb-1">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateScheduleItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    />
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block text-sm text-black mb-1">Date *</label>
                    <input
                      type="date"
                      value={item.scheduledDate}
                      onChange={(e) => updateScheduleItem(index, 'scheduledDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                      required
                    />
                  </div>

                  {/* Time */}
                  <div>
                    <label className="block text-sm text-black mb-1">Time *</label>
                    <input
                      type="time"
                      value={item.scheduledTime}
                      onChange={(e) => updateScheduleItem(index, 'scheduledTime', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                      required
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="mt-3">
                  <label className="block text-sm text-black mb-1">Notes</label>
                  <textarea
                    value={item.notes}
                    onChange={(e) => updateScheduleItem(index, 'notes', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    rows={2}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-black bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : (initialData ? 'Update Schedule' : 'Create Schedule')}
          </button>
        </div>
      </form>
    </div>
  );
}
