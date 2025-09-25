'use client';

import { useState, useEffect } from 'react';

interface Item {
  id: string;
  itemId: string;
  itemName: string;
  itemCategory: string;
  unit: string;
  createdAt: string;
  updatedAt: string;
}

interface ItemFormProps {
  item?: Item;
  onSubmit: (data: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ItemForm({ item, onSubmit, onCancel, isLoading = false }: ItemFormProps) {
  const [formData, setFormData] = useState({
    itemId: '',
    itemName: '',
    itemCategory: '',
    unit: 'pieces',
  });

  useEffect(() => {
    if (item) {
      setFormData({
        itemId: item.itemId,
        itemName: item.itemName,
        itemCategory: item.itemCategory,
        unit: item.unit || 'pieces',
      });
    }
  }, [item]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          {item ? 'Edit Item' : 'Add New Item'}
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
            Item ID *
          </label>
          <input
            type="text"
            id="itemId"
            name="itemId"
            value={formData.itemId}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="Enter item ID"
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
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="Enter item name"
          />
        </div>

        <div>
          <label htmlFor="itemCategory" className="block text-sm font-medium text-gray-700 mb-1">
            Item Category *
          </label>
          <select
            id="itemCategory"
            name="itemCategory"
            value={formData.itemCategory}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="">Select a category</option>
            <option value="Seeds">Seeds</option>
            <option value="Fertilizers">Fertilizers</option>
            <option value="Pesticides">Pesticides</option>
            <option value="Tools">Tools</option>
            <option value="Equipment">Equipment</option>
            <option value="Containers">Containers</option>
            <option value="Soil">Soil</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1">
            Unit of Measurement *
          </label>
          <select
            id="unit"
            name="unit"
            value={formData.unit}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="pieces">Pieces (Countable Units)</option>
            <option value="liters">Liters (L)</option>
            <option value="milliliters">Milliliters (mL)</option>
            <option value="kilograms">Kilograms (kg)</option>
            <option value="grams">Grams (g)</option>
            <option value="meters">Meters (m)</option>
            <option value="centimeters">Centimeters (cm)</option>
          </select>
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
            {isLoading ? 'Saving...' : (item ? 'Update Item' : 'Add Item')}
          </button>
        </div>
      </form>
    </div>
  );
}
