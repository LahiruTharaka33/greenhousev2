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
  deliveryCost?: number;
  commission?: number;
  other?: number;
  notes?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

interface FinancialRecordFormProps {
  record?: FinancialRecord;
  onSubmit: (data: Omit<FinancialRecord, 'id' | 'createdAt' | 'updatedAt' | 'rate'>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function FinancialRecordForm({ record, onSubmit, onCancel, isLoading = false }: FinancialRecordFormProps) {
  const [formData, setFormData] = useState({
    date: '',
    totalIncome: '',
    quantity: '',
    harvestingCost: '',
    deliveryCost: '',
    commission: '',
    other: '',
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
        totalIncome: record.totalIncome.toString(),
        quantity: record.quantity.toString(),
        harvestingCost: record.harvestingCost.toString(),
        deliveryCost: (record as any).deliveryCost?.toString() || '0',
        commission: (record as any).commission?.toString() || '0',
        other: (record as any).other?.toString() || '0',
        notes: record.notes || '',
      });
    }
  }, [record]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    if (!formData.totalIncome || parseFloat(formData.totalIncome) <= 0) {
      newErrors.totalIncome = 'Total Income must be a positive number';
    }

    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      newErrors.quantity = 'Quantity must be a positive number';
    }

    if (formData.harvestingCost && (isNaN(parseFloat(formData.harvestingCost)) || parseFloat(formData.harvestingCost) < 0)) {
      newErrors.harvestingCost = 'Harvesting cost must be a positive number';
    }

    if (formData.deliveryCost && (isNaN(parseFloat(formData.deliveryCost)) || parseFloat(formData.deliveryCost) < 0)) {
      newErrors.deliveryCost = 'Delivery cost must be a positive number';
    }

    if (formData.commission && (isNaN(parseFloat(formData.commission)) || parseFloat(formData.commission) < 0)) {
      newErrors.commission = 'Commission must be a positive number';
    }

    if (formData.other && (isNaN(parseFloat(formData.other)) || parseFloat(formData.other) < 0)) {
      newErrors.other = 'Other cost must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Additional validation before submission
    if (!formData.date || !formData.totalIncome || !formData.quantity) {
      alert('Please fill in all required fields');
      return;
    }

    if (isNaN(parseFloat(formData.totalIncome)) || isNaN(parseFloat(formData.quantity))) {
      alert('Total Income and Quantity must be valid numbers');
      return;
    }

    if (parseFloat(formData.totalIncome) < 0 || parseFloat(formData.quantity) <= 0) {
      alert('Total Income must be positive and Quantity must be greater than 0');
      return;
    }
    
    if (validateForm()) {
      const totalCosts = 
        (formData.harvestingCost ? parseFloat(formData.harvestingCost) : 0) +
        (formData.deliveryCost ? parseFloat(formData.deliveryCost) : 0) +
        (formData.commission ? parseFloat(formData.commission) : 0) +
        (formData.other ? parseFloat(formData.other) : 0);
      
      const netIncome = parseFloat(formData.totalIncome) - totalCosts;
      const calculatedRate = formData.quantity ? netIncome / parseFloat(formData.quantity) : 0;

      // Create a copy of the data to prevent mutations
      const submitData = {
        date: formData.date,
        totalIncome: parseFloat(formData.totalIncome),
        quantity: parseFloat(formData.quantity),
        harvestingCost: formData.harvestingCost ? parseFloat(formData.harvestingCost) : 0,
        chemicalCost: 0, // Keep for backward compatibility
        fertilizerCost: 0, // Keep for backward compatibility
        rent: 0, // Keep for backward compatibility
        deliveryCost: formData.deliveryCost ? parseFloat(formData.deliveryCost) : 0,
        commission: formData.commission ? parseFloat(formData.commission) : 0,
        other: formData.other ? parseFloat(formData.other) : 0,
        notes: formData.notes || undefined,
      };

      console.log('Submitting data:', submitData); // Debug log
      onSubmit(submitData);
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

  const totalCosts = 
    (formData.harvestingCost ? parseFloat(formData.harvestingCost) : 0) +
    (formData.deliveryCost ? parseFloat(formData.deliveryCost) : 0) +
    (formData.commission ? parseFloat(formData.commission) : 0) +
    (formData.other ? parseFloat(formData.other) : 0);
  
  const netIncome = formData.totalIncome ? parseFloat(formData.totalIncome) - totalCosts : 0;
  const rate = formData.quantity && formData.totalIncome 
    ? (netIncome / parseFloat(formData.quantity)).toFixed(2)
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
            <label htmlFor="totalIncome" className="block text-sm font-medium text-gray-700 mb-1">
              Total Income (Rs) *
            </label>
            <input
              type="number"
              id="totalIncome"
              name="totalIncome"
              value={formData.totalIncome}
              onChange={handleChange}
              step="0.01"
              min="0"
              required
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                errors.totalIncome ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="0.00"
            />
            {errors.totalIncome && <p className="text-red-500 text-xs mt-1">{errors.totalIncome}</p>}
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

        {/* Rate Display */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-md p-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-emerald-800">Rate (per kg):</span>
            <span className="text-lg font-semibold text-emerald-900">Rs {rate}</span>
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
            <label htmlFor="deliveryCost" className="block text-sm font-medium text-gray-700 mb-1">
              Delivery Cost
            </label>
            <input
              type="number"
              id="deliveryCost"
              name="deliveryCost"
              value={formData.deliveryCost}
              onChange={handleChange}
              step="0.01"
              min="0"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                errors.deliveryCost ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="0.00"
            />
            {errors.deliveryCost && <p className="text-red-500 text-xs mt-1">{errors.deliveryCost}</p>}
          </div>

          <div>
            <label htmlFor="commission" className="block text-sm font-medium text-gray-700 mb-1">
              Commission
            </label>
            <input
              type="number"
              id="commission"
              name="commission"
              value={formData.commission}
              onChange={handleChange}
              step="0.01"
              min="0"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                errors.commission ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="0.00"
            />
            {errors.commission && <p className="text-red-500 text-xs mt-1">{errors.commission}</p>}
          </div>

          <div>
            <label htmlFor="other" className="block text-sm font-medium text-gray-700 mb-1">
              Other
            </label>
            <input
              type="number"
              id="other"
              name="other"
              value={formData.other}
              onChange={handleChange}
              step="0.01"
              min="0"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                errors.other ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="0.00"
            />
            {errors.other && <p className="text-red-500 text-xs mt-1">{errors.other}</p>}
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

