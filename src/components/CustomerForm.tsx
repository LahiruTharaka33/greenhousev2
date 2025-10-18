'use client';

import { useState, useEffect } from 'react';

interface Customer {
  id?: string;
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
  password?: string;
  confirmPassword?: string;
}

interface CustomerFormProps {
  customer?: Customer;
  onSubmit: (customer: Customer) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function CustomerForm({ customer, onSubmit, onCancel, isLoading = false }: CustomerFormProps) {
  const [formData, setFormData] = useState<Customer>({
    customerId: '',
    customerName: '',
    company: '',
    cultivationType: '',
    cultivationName: '',
    noOfTunnel: 0,
    location: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState<Partial<Customer>>({});

  useEffect(() => {
    if (customer) {
      setFormData(customer);
    }
  }, [customer]);

  const validateForm = () => {
    const newErrors: Partial<Customer> = {};

    if (!formData.customerId.trim()) {
      newErrors.customerId = 'Customer ID is required';
    }

    if (!formData.customerName.trim()) {
      newErrors.customerName = 'Customer Name is required';
    }

    if (formData.noOfTunnel < 0) {
      newErrors.noOfTunnel = 'Number of tunnels cannot be negative';
    }

    // Only validate password for new customers (when creating a user account)
    if (!customer && formData.email) {
      if (!formData.password || formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }

      if (!formData.email.trim()) {
        newErrors.email = 'Email is required for user account creation';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'noOfTunnel' ? parseInt(value) || 0 : value
    }));
    
    // Clear error when user starts typing
    if (errors[name as keyof Customer]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-0 md:p-4 overflow-y-auto">
      <div className="bg-white md:rounded-lg shadow-xl max-w-2xl w-full min-h-screen md:min-h-0 md:max-h-[90vh] md:my-8 overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 md:p-6 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">
              {customer ? 'Edit Customer' : 'Add New Customer'}
            </h2>
            <button
              type="button"
              onClick={onCancel}
              className="md:hidden p-2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-4 md:p-6">
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {/* Customer ID */}
              <div>
                <label htmlFor="customerId" className="block text-sm font-medium text-gray-700 mb-2">
                  Customer ID *
                </label>
                <input
                  type="text"
                  id="customerId"
                  name="customerId"
                  value={formData.customerId}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 min-h-[44px] border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    errors.customerId ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter customer ID"
                />
                {errors.customerId && (
                  <p className="mt-1 text-sm text-red-600">{errors.customerId}</p>
                )}
              </div>

              {/* Customer Name */}
              <div>
                <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Name *
                </label>
                <input
                  type="text"
                  id="customerName"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 min-h-[44px] border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    errors.customerName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter customer name"
                />
                {errors.customerName && (
                  <p className="mt-1 text-sm text-red-600">{errors.customerName}</p>
                )}
              </div>

              {/* Company */}
              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                  Company
                </label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className="w-full px-4 py-3 min-h-[44px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Enter company name"
                />
              </div>

              {/* Cultivation Type */}
              <div>
                <label htmlFor="cultivationType" className="block text-sm font-medium text-gray-700 mb-2">
                  Cultivation Type
                </label>
                <input
                  type="text"
                  id="cultivationType"
                  name="cultivationType"
                  value={formData.cultivationType}
                  onChange={handleChange}
                  className="w-full px-4 py-3 min-h-[44px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Enter cultivation type"
                />
              </div>

              {/* Cultivation Name */}
              <div>
                <label htmlFor="cultivationName" className="block text-sm font-medium text-gray-700 mb-2">
                  Cultivation Name
                </label>
                <input
                  type="text"
                  id="cultivationName"
                  name="cultivationName"
                  value={formData.cultivationName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 min-h-[44px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Enter cultivation name"
                />
              </div>

              {/* Number of Tunnels */}
              <div>
                <label htmlFor="noOfTunnel" className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Tunnels
                </label>
                <input
                  type="number"
                  id="noOfTunnel"
                  name="noOfTunnel"
                  value={formData.noOfTunnel}
                  onChange={handleChange}
                  min="0"
                  className={`w-full px-4 py-3 min-h-[44px] border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    errors.noOfTunnel ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0"
                />
                {errors.noOfTunnel && (
                  <p className="mt-1 text-sm text-red-600">{errors.noOfTunnel}</p>
                )}
              </div>

              {/* Location */}
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-4 py-3 min-h-[44px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Enter location"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 min-h-[44px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Enter email address"
                />
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 min-h-[44px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Enter phone number"
                />
              </div>

              {/* Password - only show for new customers with email */}
              {!customer && formData.email && (
                <>
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                      Password *
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 min-h-[44px] border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        errors.password ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter password (min 6 characters)"
                      minLength={6}
                    />
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Password *
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 min-h-[44px] border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Confirm password"
                      minLength={6}
                    />
                    {errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Address */}
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Enter address"
              />
            </div>

            {/* Form Actions - Sticky on mobile */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 -mx-4 md:-mx-6 px-4 md:px-6 py-4 md:py-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 sm:gap-4">
              <button
                type="button"
                onClick={onCancel}
                className="w-full sm:w-auto px-6 py-3 min-h-[44px] text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-colors font-medium"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto px-6 py-3 min-h-[44px] bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 active:bg-emerald-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isLoading ? 'Saving...' : (customer ? 'Update Customer' : 'Add Customer')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 