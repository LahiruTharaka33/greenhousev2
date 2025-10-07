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
  scheduledEndDate?: string; // Optional end date for date range
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
      scheduledEndDate: '',
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
        scheduledEndDate: '',
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

    // Validate date ranges
    for (const item of validItems) {
      if (item.scheduledEndDate && item.scheduledDate) {
        const startDate = new Date(item.scheduledDate);
        const endDate = new Date(item.scheduledEndDate);
        if (endDate < startDate) {
          alert('End date cannot be earlier than start date');
          return;
        }
      }
    }

    // Expand date ranges into individual schedule items
    const expandedItems: ScheduleItem[] = [];
    
    validItems.forEach(item => {
      if (item.scheduledEndDate && item.scheduledDate) {
        // Create schedule for date range
        const startDate = new Date(item.scheduledDate);
        const endDate = new Date(item.scheduledEndDate);
        
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
          expandedItems.push({
            ...item,
            id: `${item.id}_${currentDate.toISOString().split('T')[0]}`,
            scheduledDate: currentDate.toISOString().split('T')[0],
            scheduledEndDate: undefined // Remove end date for individual items
          });
          currentDate.setDate(currentDate.getDate() + 1);
        }
      } else {
        // Single date schedule
        expandedItems.push({
          ...item,
          scheduledEndDate: undefined // Remove end date for single items
        });
      }
    });

    onSubmit({
      customerId: selectedCustomerId,
      items: expandedItems
    });
  };

  if (loadingData) {
    return <div className="text-center py-4">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          {initialData ? 'Edit Schedule' : 'Create New Schedule'}
        </h2>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Customer *
          </label>
          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900"
            required
          >
            <option value="">Select a customer</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.customerName} {customer.company ? `(${customer.company})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Schedule Items */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Schedule Items *
            </label>
            <button
              type="button"
              onClick={addScheduleItem}
              className="px-3 py-1 text-sm bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
            >
              + Add Item
            </button>
          </div>

          <div className="space-y-4">
            {scheduleItems.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-900">Item {index + 1}</h4>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Item Selection */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Item *</label>
                    <select
                      value={item.itemId}
                      onChange={(e) => updateScheduleItem(index, 'itemId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900"
                      required
                    >
                      <option value="">Select an item</option>
                      {items.map((itm) => (
                        <option key={itm.id} value={itm.id}>
                          {itm.itemName} ({itm.itemCategory})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Start Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                    <input
                      type="date"
                      value={item.scheduledDate}
                      onChange={(e) => updateScheduleItem(index, 'scheduledDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900"
                      required
                    />
                  </div>

                  {/* End Date (Optional) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date <span className="text-gray-500">(Optional - for date range)</span>
                    </label>
                    <input
                      type="date"
                      value={item.scheduledEndDate || ''}
                      onChange={(e) => updateScheduleItem(index, 'scheduledEndDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900"
                      min={item.scheduledDate || undefined}
                    />
                  </div>

                  {/* Time */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
                    <input
                      type="time"
                      value={item.scheduledTime}
                      onChange={(e) => updateScheduleItem(index, 'scheduledTime', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900"
                      required
                    />
                  </div>
                </div>
                
                {/* Second row for Quantity */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  {/* Quantity */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateScheduleItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900"
                    />
                  </div>
                  
                  {/* Date Range Preview */}
                  {item.scheduledDate && item.scheduledEndDate && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date Range Preview</label>
                      <div className="px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-md text-sm text-emerald-800">
                        {(() => {
                          const startDate = new Date(item.scheduledDate);
                          const endDate = new Date(item.scheduledEndDate);
                          const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                          return `${diffDays} schedule(s) will be created from ${item.scheduledDate} to ${item.scheduledEndDate}`;
                        })()}
                      </div>
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={item.notes}
                    onChange={(e) => updateScheduleItem(index, 'notes', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900"
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
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : (initialData ? 'Update Schedule' : 'Create Schedule')}
          </button>
        </div>
      </form>
    </div>
  );
}
