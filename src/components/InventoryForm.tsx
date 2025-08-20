'use client';

import { useState, useEffect } from 'react';

interface InventoryItem {
  id: string;
  itemId: string;
  itemType: string;
  itemName: string;
  description?: string;
  quantity: number;
  storedDate: string;
  createdAt: string;
  updatedAt: string;
}

interface InventoryFormProps {
  item?: InventoryItem;
  onSubmit: (data: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const itemTypes = [
  'Seeds',
  'Fertilizers',
  'Pesticides',
  'Tools',
  'Equipment',
  'Packaging',
  'Other'
];

export default function InventoryForm({ item, onSubmit, onCancel, isLoading }: InventoryFormProps) {
  const [formData, setFormData] = useState({
    itemId: '',
    itemType: '',
    itemName: '',
    description: '',
    quantity: 0,
  });

  useEffect(() => {
    if (item) {
      setFormData({
        itemId: item.itemId,
        itemType: item.itemType,
        itemName: item.itemName,
        description: item.description || '',
        quantity: item.quantity,
      });
    }
  }, [item]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' ? parseInt(value) || 0 : value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {item ? 'Edit Inventory Item' : 'Add Inventory Item'}
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
            {/* Item ID */}
            <div>
              <label htmlFor="itemId" className="block text-sm font-medium text-gray-700 mb-1">
                Item ID *
              </label>
              <input
                type="text"
                id="itemId"
                name="itemId"
                value={formData.itemId}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter item ID"
              />
            </div>

            {/* Item Type */}
            <div>
              <label htmlFor="itemType" className="block text-sm font-medium text-gray-700 mb-1">
                Item Type *
              </label>
              <select
                id="itemType"
                name="itemType"
                value={formData.itemType}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Select item type</option>
                {itemTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Item Name */}
            <div>
              <label htmlFor="itemName" className="block text-sm font-medium text-gray-700 mb-1">
                Item Name *
              </label>
              <input
                type="text"
                id="itemName"
                name="itemName"
                value={formData.itemName}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter item name"
              />
            </div>

            {/* Description */}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter item description"
              />
            </div>

            {/* Quantity */}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter quantity"
              />
            </div>

            {/* Form Actions */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Saving...' : (item ? 'Update' : 'Add')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 