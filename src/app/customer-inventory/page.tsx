'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import CustomerInventoryForm from '@/components/CustomerInventoryForm';

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

export default function CustomerInventoryPage() {
  const [customerInventory, setCustomerInventory] = useState<CustomerInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingInventory, setEditingInventory] = useState<CustomerInventory | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCustomer, setFilterCustomer] = useState('');
  const [filterItemType, setFilterItemType] = useState('');

  // Fetch customer inventory
  const fetchCustomerInventory = async () => {
    try {
      const response = await fetch('/api/customer-inventory');
      if (response.ok) {
        const data = await response.json();
        setCustomerInventory(data);
      } else {
        console.error('Failed to fetch customer inventory');
      }
    } catch (error) {
      console.error('Error fetching customer inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerInventory();
  }, []);

  // Handle form submission
  const handleSubmit = async (inventoryData: Omit<CustomerInventory, 'id' | 'createdAt' | 'updatedAt' | 'customer' | 'item'>) => {
    setFormLoading(true);
    try {
      const url = editingInventory 
        ? `/api/customer-inventory/${editingInventory.id}`
        : '/api/customer-inventory';
      
      const method = editingInventory ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inventoryData),
      });

      if (response.ok) {
        await fetchCustomerInventory();
        setShowForm(false);
        setEditingInventory(null);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save customer inventory');
      }
    } catch (error) {
      console.error('Error saving customer inventory:', error);
      alert('Failed to save customer inventory');
    } finally {
      setFormLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (inventoryId: string) => {
    if (!confirm('Are you sure you want to delete this customer inventory item?')) {
      return;
    }

    setDeleteLoading(inventoryId);
    try {
      const response = await fetch(`/api/customer-inventory/${inventoryId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchCustomerInventory();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete customer inventory item');
      }
    } catch (error) {
      console.error('Error deleting customer inventory item:', error);
      alert('Failed to delete customer inventory item');
    } finally {
      setDeleteLoading(null);
    }
  };

  // Handle edit
  const handleEdit = (inventory: CustomerInventory) => {
    setEditingInventory(inventory);
    setShowForm(true);
  };

  // Filter customer inventory based on search term and filters
  const filteredInventory = customerInventory.filter(inventory =>
    (inventory.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
     inventory.itemId.toLowerCase().includes(searchTerm.toLowerCase()) ||
     inventory.customer.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
     inventory.description?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterCustomer === '' || inventory.customerId === filterCustomer) &&
    (filterItemType === '' || inventory.itemType === filterItemType)
  );

  // Get unique customers and item types for filters
  const customers = [...new Set(customerInventory.map(inventory => inventory.customer))];
  const itemTypes = [...new Set(customerInventory.map(inventory => inventory.itemType))];

  // Calculate total quantity
  const totalQuantity = customerInventory.reduce((sum, inventory) => sum + inventory.quantity, 0);

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Layout>
      <main className="min-h-screen bg-gray-50 text-gray-900">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-6 shadow-sm">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  Customer Inventory
                </h1>
                <p className="text-gray-600">
                  Manage customer-specific inventory and item allocations
                </p>
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 shadow-sm"
              >
                <span>+</span>
                <span>Add Customer Inventory</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="px-4 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Items</p>
                    <p className="text-2xl font-bold text-gray-900">{customerInventory.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Quantity</p>
                    <p className="text-2xl font-bold text-gray-900">{totalQuantity}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Customers</p>
                    <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search customer inventory..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 placeholder-gray-500"
                />
              </div>
              <div className="sm:w-48">
                <select
                  value={filterCustomer}
                  onChange={(e) => setFilterCustomer(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900"
                >
                  <option value="">All Customers</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.customerName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:w-48">
                <select
                  value={filterItemType}
                  onChange={(e) => setFilterItemType(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900"
                >
                  <option value="">All Types</option>
                  {itemTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Inventory Content */}
        <div className="px-4 pb-6">
          <div className="max-w-7xl mx-auto">
            {loading ? (
              <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading customer inventory...</p>
              </div>
            ) : filteredInventory.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
                <div className="text-6xl mb-4">📦</div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  {searchTerm || filterCustomer || filterItemType ? 'No items found' : 'No customer inventory yet'}
                </h2>
                <p className="text-gray-600 mb-6">
                  {searchTerm || filterCustomer || filterItemType 
                    ? 'Try adjusting your search or filter terms'
                    : 'Get started by adding your first customer inventory item'
                  }
                </p>
                {!searchTerm && !filterCustomer && !filterItemType && (
                  <button
                    onClick={() => setShowForm(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg transition-colors shadow-sm"
                  >
                    Add Your First Customer Inventory
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredInventory.map((inventory) => (
                  <div
                    key={inventory.id}
                    className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-3 sm:space-y-0">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {inventory.itemName}
                          </h3>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                            {inventory.itemId}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">Customer:</span>
                            <span className="ml-1 text-gray-600">{inventory.customer.customerName}</span>
                          </div>
                          
                          <div>
                            <span className="font-medium text-gray-700">Item Type:</span>
                            <span className="ml-1 text-gray-600">{inventory.itemType}</span>
                          </div>
                          
                          <div>
                            <span className="font-medium text-gray-700">Quantity:</span>
                            <span className="ml-1 text-gray-600">{inventory.quantity}</span>
                          </div>
                          
                          <div>
                            <span className="font-medium text-gray-700">Created:</span>
                            <span className="ml-1 text-gray-600">{formatDate(inventory.createdAt)}</span>
                          </div>
                          
                          {inventory.description && (
                            <div className="sm:col-span-2 lg:col-span-3">
                              <span className="font-medium text-gray-700">Description:</span>
                              <span className="ml-1 text-gray-600">{inventory.description}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                        <button
                          onClick={() => handleEdit(inventory)}
                          className="px-4 py-2 text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(inventory.id)}
                          disabled={deleteLoading === inventory.id}
                          className="px-4 py-2 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-md transition-colors font-medium disabled:opacity-50"
                        >
                          {deleteLoading === inventory.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Customer Inventory Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl border border-gray-200">
              <CustomerInventoryForm
                customerInventory={editingInventory || undefined}
                onSubmit={handleSubmit}
                onCancel={() => {
                  setShowForm(false);
                  setEditingInventory(null);
                }}
                isLoading={formLoading}
              />
            </div>
          </div>
        )}
      </main>
    </Layout>
  );
}
