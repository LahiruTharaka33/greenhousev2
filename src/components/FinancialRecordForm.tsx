'use client';

import { useState, useEffect } from 'react';

interface FinancialRecord {
  id: string;
  date: string | Date;
  rate: number;
  quantity: number;
  totalIncome: number;
  harvestingCost: number;
  chemicalCost: number;
  fertilizerCost: number;
  rent: number;
  notes?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

interface FinancialRecordFormProps {
  record?: FinancialRecord;
  onSubmit: (data: Omit<FinancialRecord, 'id' | 'createdAt' | 'updatedAt' | 'totalIncome'>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function FinancialRecordForm({ record, onSubmit, onCancel, isLoading = false }: FinancialRecordFormProps) {
  const [formData, setFormData] = useState({
    date: '',
    rate: '',
    quantity: '',
    harvestingCost: '',
    chemicalCost: '',
    fertilizerCost: '',
    rent: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (record) {
      const dateValue = typeof record.date === 'string' 
        ? record.date.split('T')[0] 
        : record.date.toISOString().split('T')[0];
      
      setFormData({
        date: dateValue, // Format date for input
        rate: record.rate.toString(),
        quantity: record.quantity.toString(),
        harvestingCost: record.harvestingCost.toString(),
        chemicalCost: record.chemicalCost.toString(),
        fertilizerCost: record.fertilizerCost.toString(),
        rent: record.rent.toString(),
        notes: record.notes || '',
      });
    }
  }, [record]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    if (!formData.rate || parseFloat(formData.rate) <= 0) {
      newErrors.rate = 'Rate must be a positive number';
    }

    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      newErrors.quantity = 'Quantity must be a positive number';
    }

    if (formData.harvestingCost && (isNaN(parseFloat(formData.harvestingCost)) || parseFloat(formData.harvestingCost) < 0)) {
      newErrors.harvestingCost = 'Harvesting cost must be a positive number';
    }

    if (formData.chemicalCost && (isNaN(parseFloat(formData.chemicalCost)) || parseFloat(formData.chemicalCost) < 0)) {
      newErrors.chemicalCost = 'Chemical cost must be a positive number';
    }

    if (formData.fertilizerCost && (isNaN(parseFloat(formData.fertilizerCost)) || parseFloat(formData.fertilizerCost) < 0)) {
      newErrors.fertilizerCost = 'Fertilizer cost must be a positive number';
    }

    if (formData.rent && (isNaN(parseFloat(formData.rent)) || parseFloat(formData.rent) < 0)) {
      newErrors.rent = 'Rent must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit({
        date: formData.date,
        rate: parseFloat(formData.rate),
        quantity: parseFloat(formData.quantity),
        harvestingCost: formData.harvestingCost ? parseFloat(formData.harvestingCost) : 0,
        chemicalCost: formData.chemicalCost ? parseFloat(formData.chemicalCost) : 0,
        fertilizerCost: formData.fertilizerCost ? parseFloat(formData.fertilizerCost) : 0,
        rent: formData.rent ? parseFloat(formData.rent) : 0,
        notes: formData.notes || null,
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const totalIncome = formData.rate && formData.quantity 
    ? (parseFloat(formData.rate) * parseFloat(formData.quantity)).toFixed(2)
    : '0.00';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          {record ? 'Edit Financial Record' : 'Add New Financial Record'}
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
        {/* First Row - Main Fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
              Date *
            </label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                errors.date ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
          </div>

          <div>
            <label htmlFor="rate" className="block text-sm font-medium text-gray-700 mb-1">
              Rate (per kg) *
            </label>
            <input
              type="number"
              id="rate"
              name="rate"
              value={formData.rate}
              onChange={handleChange}
              step="0.01"
              min="0"
              required
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                errors.rate ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="0.00"
            />
            {errors.rate && <p className="text-red-500 text-xs mt-1">{errors.rate}</p>}
          </div>

          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
              Quantity (kg) *
            </label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              step="0.01"
              min="0"
              required
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                errors.quantity ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="0.00"
            />
            {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>}
          </div>
        </div>

        {/* Total Income Display */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-md p-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-emerald-800">Total Income:</span>
            <span className="text-lg font-semibold text-emerald-900">Rs {totalIncome}</span>
          </div>
        </div>

        {/* Second Row - Cost Fields */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="harvestingCost" className="block text-sm font-medium text-gray-700 mb-1">
              Harvesting Cost
            </label>
            <input
              type="number"
              id="harvestingCost"
              name="harvestingCost"
              value={formData.harvestingCost}
              onChange={handleChange}
              step="0.01"
              min="0"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                errors.harvestingCost ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="0.00"
            />
            {errors.harvestingCost && <p className="text-red-500 text-xs mt-1">{errors.harvestingCost}</p>}
          </div>

          <div>
            <label htmlFor="chemicalCost" className="block text-sm font-medium text-gray-700 mb-1">
              Chemical Cost
            </label>
            <input
              type="number"
              id="chemicalCost"
              name="chemicalCost"
              value={formData.chemicalCost}
              onChange={handleChange}
              step="0.01"
              min="0"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                errors.chemicalCost ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="0.00"
            />
            {errors.chemicalCost && <p className="text-red-500 text-xs mt-1">{errors.chemicalCost}</p>}
          </div>

          <div>
            <label htmlFor="fertilizerCost" className="block text-sm font-medium text-gray-700 mb-1">
              Fertilizer Cost
            </label>
            <input
              type="number"
              id="fertilizerCost"
              name="fertilizerCost"
              value={formData.fertilizerCost}
              onChange={handleChange}
              step="0.01"
              min="0"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                errors.fertilizerCost ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="0.00"
            />
            {errors.fertilizerCost && <p className="text-red-500 text-xs mt-1">{errors.fertilizerCost}</p>}
          </div>

          <div>
            <label htmlFor="rent" className="block text-sm font-medium text-gray-700 mb-1">
              Rent
            </label>
            <input
              type="number"
              id="rent"
              name="rent"
              value={formData.rent}
              onChange={handleChange}
              step="0.01"
              min="0"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                errors.rent ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="0.00"
            />
            {errors.rent && <p className="text-red-500 text-xs mt-1">{errors.rent}</p>}
          </div>
        </div>

        {/* Notes Field */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="Enter any additional notes..."
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
            {isLoading ? 'Saving...' : (record ? 'Update Record' : 'Add Record')}
          </button>
        </div>
      </form>
    </div>
  );
}

