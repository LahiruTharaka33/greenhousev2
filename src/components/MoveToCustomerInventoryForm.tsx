'use client';

import { useState, useEffect } from 'react';

interface Item {
  id: string;
  itemId: string;
  itemName: string;
  itemCategory: string;
  createdAt: string;
  updatedAt: string;
}

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

interface MainInventoryItem {
  id: string;
  itemId: string;
  itemType: string;
  itemName: string;
  description?: string;
  quantity: number;
  storedDate: string;
  createdAt: string;
  updatedAt: string;
  item: Item;
}

interface MoveToCustomerInventoryFormProps {
  inventoryItem: MainInventoryItem;
  onSubmit: (data: { customerId: string; quantity: number }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function MoveToCustomerInventoryForm({ 
  inventoryItem, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: MoveToCustomerInventoryFormProps) {
  const [formData, setFormData] = useState({
    customerId: '',
    quantity: 0,
  });
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [error, setError] = useState('');

  // Fetch available customers for dropdown
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch('/api/customers');
        if (response.ok) {
          const data = await response.json();
          setCustomers(data);
        }
      } catch (error) {
        console.error('Error fetching customers:', error);
        setError('Failed to load customers');
      } finally {
        setLoadingCustomers(false);
      }
    };

    fetchCustomers();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate quantity
    if (formData.quantity <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }
    
    if (formData.quantity > inventoryItem.quantity) {
      setError(`Cannot move more than available quantity (${inventoryItem.quantity})`);
      return;
    }
    
    if (!formData.customerId) {
      setError('Please select a customer');
      return;
    }
    
    setError('');
    onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' ? parseInt(value) || 0 : value,
    }));
    setError(''); // Clear error when user makes changes
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          Move to Customer Inventory
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

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="itemId" className="block text-sm font-medium text-gray-700 mb-1">
            Item ID
          </label>
          <input
            type="text"
            id="itemId"
            value={inventoryItem.itemId}
            readOnly
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700"
          />
        </div>

        <div>
          <label htmlFor="itemName" className="block text-sm font-medium text-gray-700 mb-1">
            Item Name
          </label>
          <input
            type="text"
            id="itemName"
            value={inventoryItem.itemName}
            readOnly
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700"
          />
        </div>

        <div>
          <label htmlFor="availableQuantity" className="block text-sm font-medium text-gray-700 mb-1">
            Available Quantity
          </label>
          <input
            type="number"
            id="availableQuantity"
            value={inventoryItem.quantity}
            readOnly
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700"
          />
        </div>

        <div>
          <label htmlFor="customerId" className="block text-sm font-medium text-gray-700 mb-1">
            Select Customer *
          </label>
          <select
            id="customerId"
            name="customerId"
            value={formData.customerId}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            disabled={loadingCustomers}
          >
            <option value="">
              {loadingCustomers ? 'Loading customers...' : 'Select a customer'}
            </option>
            {customers.map(customer => (
              <option key={customer.id} value={customer.id}>
                {customer.customerId} - {customer.customerName} {customer.company ? `(${customer.company})` : ''}
              </option>
            ))}
          </select>
          {customers.length === 0 && !loadingCustomers && (
            <p className="text-sm text-red-600 mt-1">
              No customers available. Please add customers first in the Customers page.
            </p>
          )}
        </div>

        <div>
          <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
            Quantity to Move *
          </label>
          <input
            type="number"
            id="quantity"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            required
            min="1"
            max={inventoryItem.quantity}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder={`Enter quantity (max: ${inventoryItem.quantity})`}
          />
          <p className="text-sm text-gray-500 mt-1">
            Maximum available: {inventoryItem.quantity}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || loadingCustomers || customers.length === 0}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Moving...' : 'Move to Customer Inventory'}
          </button>
        </div>
      </form>
    </div>
  );
}
