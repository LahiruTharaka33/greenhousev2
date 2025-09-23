'use client';

import { useState, useEffect } from 'react';

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

interface Tunnel {
  id: string;
  tunnelId: string;
  tunnelName: string;
  description?: string;
  customerId: string;
  cultivationType?: string;
  location?: string;
  clientId?: string;
  createdAt: string;
  updatedAt: string;
  customer: Customer;
}

interface TunnelFormProps {
  tunnel?: Tunnel;
  onSubmit: (data: Omit<Tunnel, 'id' | 'createdAt' | 'updatedAt' | 'customer'>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const cultivationTypes = [
  'Vegetables',
  'Fruits',
  'Herbs',
  'Flowers',
  'Mixed Crops',
  'Hydroponics',
  'Aquaponics',
  'Other'
];

export default function TunnelForm({ tunnel, onSubmit, onCancel, isLoading = false }: TunnelFormProps) {
  const [formData, setFormData] = useState({
    tunnelId: '',
    tunnelName: '',
    description: '',
    customerId: '',
    cultivationType: '',
    location: '',
    clientId: '',
  });
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);

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
    if (tunnel) {
      setFormData({
        tunnelId: tunnel.tunnelId,
        tunnelName: tunnel.tunnelName,
        description: tunnel.description || '',
        customerId: tunnel.customerId,
        cultivationType: tunnel.cultivationType || '',
        location: tunnel.location || '',
        clientId: tunnel.clientId || '',
      });
    }
  }, [tunnel]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
          {tunnel ? 'Edit Tunnel' : 'Add New Tunnel'}
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
          <label htmlFor="tunnelId" className="block text-sm font-medium text-gray-700 mb-1">
            Tunnel ID *
          </label>
          <input
            type="text"
            id="tunnelId"
            name="tunnelId"
            value={formData.tunnelId}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="Enter tunnel ID"
          />
        </div>

        <div>
          <label htmlFor="tunnelName" className="block text-sm font-medium text-gray-700 mb-1">
            Tunnel Name *
          </label>
          <input
            type="text"
            id="tunnelName"
            name="tunnelName"
            value={formData.tunnelName}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="Enter tunnel name"
          />
        </div>

        <div>
          <label htmlFor="customerId" className="block text-sm font-medium text-gray-700 mb-1">
            Customer *
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
          <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-1">
            Client ID
          </label>
          <input
            type="text"
            id="clientId"
            name="clientId"
            value={formData.clientId}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="Enter client ID for device communication"
          />
          <p className="text-sm text-gray-500 mt-1">
            Optional: Used for MQTT device communication. Can be assigned later by admin.
          </p>
        </div>

        <div>
          <label htmlFor="cultivationType" className="block text-sm font-medium text-gray-700 mb-1">
            Cultivation Type
          </label>
          <select
            id="cultivationType"
            name="cultivationType"
            value={formData.cultivationType}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="">Select cultivation type</option>
            {cultivationTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
            Location
          </label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="Enter tunnel location"
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
            placeholder="Enter tunnel description"
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
            {isLoading ? 'Saving...' : (tunnel ? 'Update Tunnel' : 'Add Tunnel')}
          </button>
        </div>
      </form>
    </div>
  );
}
