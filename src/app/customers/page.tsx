'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import CustomerForm from '@/components/CustomerForm';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';

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

export default function CustomersPage() {
  const { data: session, status } = useSession();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch customers
  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers');
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      } else {
        console.error('Failed to fetch customers');
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session && session.user.role === 'admin') {
      fetchCustomers();
    }
  }, [session]);

  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!session || session.user.role !== 'admin') {
    redirect('/login');
  }

  // Handle form submission
  const handleSubmit = async (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
    setFormLoading(true);
    try {
      const url = editingCustomer 
        ? `/api/customers/${editingCustomer.id}`
        : '/api/customers';
      
      const method = editingCustomer ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerData),
      });

      if (response.ok) {
        await fetchCustomers();
        setShowForm(false);
        setEditingCustomer(null);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save customer');
      }
    } catch (error) {
      console.error('Error saving customer:', error);
      alert('Failed to save customer');
    } finally {
      setFormLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (customerId: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) {
      return;
    }

    setDeleteLoading(customerId);
    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchCustomers();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete customer');
      }
    } catch (error) {
      console.error('Error deleting customer:', error);
      alert('Failed to delete customer');
    } finally {
      setDeleteLoading(null);
    }
  };

  // Handle edit
  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setShowForm(true);
  };

  // Filter customers based on search term
  const filteredCustomers = customers.filter(customer =>
    customer.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.customerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <main className="min-h-screen bg-gray-50 text-gray-900">
        {/* Mobile-Optimized Header with Safe Zone */}
        <div className="bg-white border-b border-gray-200 pl-16 pr-4 lg:px-4 py-4 md:py-6 shadow-sm">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col space-y-3 md:space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                    Customers
                  </h1>
                  <p className="text-sm md:text-base text-gray-600">
                    Manage customer information and relationships
                  </p>
                </div>
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white px-4 md:px-6 py-2.5 md:py-3 min-h-[44px] rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 shadow-sm whitespace-nowrap"
                >
                  <span className="text-lg">+</span>
                  <span className="hidden sm:inline">Add Customer</span>
                  <span className="sm:hidden">Add</span>
                </button>
              </div>
              
              {/* Search Bar - Moved to header for mobile */}
              <div className="w-full">
                <input
                  type="text"
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 min-h-[44px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 placeholder-gray-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Customers Content with Safe Zone */}
        <div className="pl-16 pr-4 lg:px-4 py-4 md:py-6">
          <div className="max-w-7xl mx-auto">
            {loading ? (
              <div className="bg-white rounded-lg shadow-sm border p-6 md:p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                <p className="mt-4 text-sm md:text-base text-gray-600">Loading customers...</p>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border p-6 md:p-8 text-center">
                <div className="text-5xl md:text-6xl mb-4">👥</div>
                <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-3 md:mb-4">
                  {searchTerm ? 'No customers found' : 'No customers yet'}
                </h2>
                <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6">
                  {searchTerm 
                    ? 'Try adjusting your search terms'
                    : 'Get started by adding your first customer'
                  }
                </p>
                {!searchTerm && (
                  <button
                    onClick={() => setShowForm(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white px-6 py-3 min-h-[44px] rounded-lg transition-colors shadow-sm"
                  >
                    Add Your First Customer
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3 md:space-y-4">
                {filteredCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    className="bg-white rounded-lg shadow-sm border p-4 md:p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col space-y-3">
                      {/* Customer Header */}
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base md:text-lg font-semibold text-gray-900">
                          {customer.customerName}
                        </h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                          {customer.customerId}
                        </span>
                      </div>
                      
                      {/* Customer Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3 text-sm">
                        {customer.company && (
                          <div className="flex flex-wrap">
                            <span className="font-medium text-gray-700">Company:</span>
                            <span className="ml-1 text-gray-600 break-all">{customer.company}</span>
                          </div>
                        )}
                        
                        <div className="flex flex-wrap">
                          <span className="font-medium text-gray-700">Tunnels:</span>
                          <span className="ml-1 text-gray-600">{customer.noOfTunnel}</span>
                        </div>
                        
                        {customer.location && (
                          <div className="flex flex-wrap">
                            <span className="font-medium text-gray-700">Location:</span>
                            <span className="ml-1 text-gray-600 break-all">{customer.location}</span>
                          </div>
                        )}
                        
                        {customer.cultivationType && (
                          <div className="flex flex-wrap">
                            <span className="font-medium text-gray-700">Cultivation:</span>
                            <span className="ml-1 text-gray-600 break-all">{customer.cultivationType}</span>
                          </div>
                        )}
                        
                        {customer.email && (
                          <div className="flex flex-wrap sm:col-span-2">
                            <span className="font-medium text-gray-700">Email:</span>
                            <span className="ml-1 text-gray-600 break-all">{customer.email}</span>
                          </div>
                        )}
                        
                        {customer.phone && (
                          <div className="flex flex-wrap">
                            <span className="font-medium text-gray-700">Phone:</span>
                            <span className="ml-1 text-gray-600">{customer.phone}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-gray-100">
                        <button
                          onClick={() => handleEdit(customer)}
                          className="flex-1 sm:flex-initial px-4 py-2.5 min-h-[44px] text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 rounded-lg transition-colors font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(customer.id)}
                          disabled={deleteLoading === customer.id}
                          className="flex-1 sm:flex-initial px-4 py-2.5 min-h-[44px] text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 active:bg-red-200 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deleteLoading === customer.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Customer Form Modal */}
        {showForm && (
          <CustomerForm
            customer={editingCustomer || undefined}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingCustomer(null);
            }}
            isLoading={formLoading}
          />
        )}
      </main>
    </Layout>
  );
} 