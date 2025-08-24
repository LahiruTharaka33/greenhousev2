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

interface CustomerInventory {
  id: string;
  itemId: string;
  itemType: string;
  itemName: string;
  description?: string;
  customerId: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
  customer: Customer;
  item: Item;
}

interface CustomerInventoryFormProps {
  customerInventory?: CustomerInventory;
  onSubmit: (data: Omit<CustomerInventory, 'id' | 'createdAt' | 'updatedAt' | 'customer' | 'item'>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function CustomerInventoryForm({ customerInventory, onSubmit, onCancel, isLoading = false }: CustomerInventoryFormProps) {
  const [formData, setFormData] = useState({
    itemId: '',
    itemType: '',
    itemName: '',
    customerId: '',
    description: '',
    quantity: 0,
  });
  const [items, setItems] = useState<Item[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [loadingCustomers, setLoadingCustomers] = useState(true);

  // Fetch available items for dropdown
  useEffect(() => {
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

    fetchItems();
  }, []);

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
      } finally {
        setLoadingCustomers(false);
      }
    };

    fetchCustomers();
  }, []);

  useEffect(() => {
    if (customerInventory) {
      setFormData({
        itemId: customerInventory.itemId,
        itemType: customerInventory.itemType,
        itemName: customerInventory.itemName,
        customerId: customerInventory.customerId,
        description: customerInventory.description || '',
        quantity: customerInventory.quantity,
      });
    }
  }, [customerInventory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'itemId') {
      // Auto-populate item details when an item is selected
      const selectedItem = items.find(item => item.itemId === value);
      if (selectedItem) {
        setFormData(prev => ({
          ...prev,
          itemId: selectedItem.itemId,
          itemName: selectedItem.itemName,
          itemType: selectedItem.itemCategory, // Map category to type
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: value,
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'quantity' ? parseInt(value) || 0 : value,
      }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          {customerInventory ? 'Edit Customer Inventory' : 'Add Customer Inventory'}
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
            Select Item *
          </label>
          <select
            id="itemId"
            name="itemId"
            value={formData.itemId}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            disabled={loadingItems}
          >
            <option value="">
              {loadingItems ? 'Loading items...' : 'Select an item'}
            </option>
            {items.map(item => (
              <option key={item.id} value={item.itemId}>
                {item.itemId} - {item.itemName} ({item.itemCategory})
              </option>
            ))}
          </select>
          {items.length === 0 && !loadingItems && (
            <p className="text-sm text-red-600 mt-1">
              No items available. Please add items first in the Items page.
            </p>
          )}
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
          <label htmlFor="itemType" className="block text-sm font-medium text-gray-700 mb-1">
            Item Type *
          </label>
          <input
            type="text"
            id="itemType"
            name="itemType"
            value={formData.itemType}
            readOnly
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700"
            placeholder="Will be auto-filled from selected item"
          />
        </div>

        <div>
          <label htmlFor="itemName" className="block text-sm font-medium text-gray-700 mb-1">
            Item Name *
          </label>
          <input
            type="text"
            id="itemName"
            name="itemName"
            value={formData.itemName}
            readOnly
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700"
            placeholder="Will be auto-filled from selected item"
          />
        </div>

        <div>
          <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
            Quantity *
          </label>
          <input
            type="number"
            id="quantity"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            required
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="Enter quantity"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="Enter description"
          />
        </div>

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
            disabled={isLoading}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving...' : (customerInventory ? 'Update Customer Inventory' : 'Add Customer Inventory')}
          </button>
        </div>
      </form>
    </div>
  );
}
