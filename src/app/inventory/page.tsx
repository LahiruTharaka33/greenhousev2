'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import InventoryForm from '@/components/InventoryForm';
import MoveToCustomerInventoryForm from '@/components/MoveToCustomerInventoryForm';

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

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showMoveForm, setShowMoveForm] = useState(false);
  const [movingItem, setMovingItem] = useState<InventoryItem | null>(null);
  const [moveLoading, setMoveLoading] = useState(false);

  // Fetch inventory
  const fetchInventory = async () => {
    try {
      const response = await fetch('/api/inventory');
      if (response.ok) {
        const data = await response.json();
        setInventory(data);
      } else {
        console.error('Failed to fetch inventory');
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // Handle form submission
  const handleSubmit = async (itemData: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    setFormLoading(true);
    try {
      const url = editingItem 
        ? `/api/inventory/${editingItem.id}`
        : '/api/inventory';
      
      const method = editingItem ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemData),
      });

      if (response.ok) {
        await fetchInventory();
        setShowForm(false);
        setEditingItem(null);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save inventory item');
      }
    } catch (error) {
      console.error('Error saving inventory item:', error);
      alert('Failed to save inventory item');
    } finally {
      setFormLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this inventory item?')) {
      return;
    }

    setDeleteLoading(itemId);
    try {
      const response = await fetch(`/api/inventory/${itemId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchInventory();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete inventory item');
      }
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      alert('Failed to delete inventory item');
    } finally {
      setDeleteLoading(null);
    }
  };

  // Handle edit
  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setShowForm(true);
  };

  // Handle move to customer inventory
  const handleMove = (item: InventoryItem) => {
    setMovingItem(item);
    setShowMoveForm(true);
  };

  // Handle move submission
  const handleMoveSubmit = async (moveData: { customerId: string; quantity: number }) => {
    if (!movingItem) return;
    
    setMoveLoading(true);
    try {
      const response = await fetch('/api/inventory/move-to-customer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inventoryId: movingItem.id,
          customerId: moveData.customerId,
          quantity: moveData.quantity,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        await fetchInventory(); // Refresh inventory to show updated quantities
        setShowMoveForm(false);
        setMovingItem(null);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to move inventory to customer');
      }
    } catch (error) {
      console.error('Error moving inventory to customer:', error);
      alert('Failed to move inventory to customer');
    } finally {
      setMoveLoading(false);
    }
  };

  // Filter inventory based on search term and type
  const filteredInventory = inventory.filter(item =>
    (item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
     item.itemId.toLowerCase().includes(searchTerm.toLowerCase()) ||
     item.description?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterType === '' || item.itemType === filterType)
  );

  // Get unique item types for filter
  const itemTypes = [...new Set(inventory.map(item => item.itemType))];

  // Calculate total quantity
  const totalQuantity = inventory.reduce((sum, item) => sum + item.quantity, 0);

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
                  Main Inventory
                </h1>
                <p className="text-gray-600">
                  Manage your greenhouse inventory and supplies
                </p>
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 shadow-sm"
              >
                <span>+</span>
                <span>Add Item</span>
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
                    <p className="text-2xl font-bold text-gray-900">{inventory.length}</p>
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Categories</p>
                    <p className="text-2xl font-bold text-gray-900">{itemTypes.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 placeholder-gray-500"
                />
              </div>
              <div className="sm:w-48">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
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

        {/* Inventory Content */}
        <div className="px-4 pb-6">
          <div className="max-w-7xl mx-auto">
            {loading ? (
              <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading inventory...</p>
              </div>
            ) : filteredInventory.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
                <div className="text-6xl mb-4">📦</div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  {searchTerm || filterType ? 'No items found' : 'No inventory items yet'}
                </h2>
                <p className="text-gray-600 mb-6">
                  {searchTerm || filterType 
                    ? 'Try adjusting your search or filter terms'
                    : 'Get started by adding your first inventory item'
                  }
                </p>
                {!searchTerm && !filterType && (
                  <button
                    onClick={() => setShowForm(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg transition-colors shadow-sm"
                  >
                    Add Your First Item
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredInventory.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-3 sm:space-y-0">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {item.itemName}
                          </h3>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                            {item.itemId}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">Type:</span>
                            <span className="ml-1 text-gray-600">{item.itemType}</span>
                          </div>
                          
                          <div>
                            <span className="font-medium text-gray-700">Quantity:</span>
                            <span className="ml-1 text-gray-600">{item.quantity}</span>
                          </div>
                          
                          <div>
                            <span className="font-medium text-gray-700">Stored:</span>
                            <span className="ml-1 text-gray-600">{formatDate(item.storedDate)}</span>
                          </div>
                          
                          {item.description && (
                            <div className="sm:col-span-2 lg:col-span-3">
                              <span className="font-medium text-gray-700">Description:</span>
                              <span className="ml-1 text-gray-600">{item.description}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                        <button
                          onClick={() => handleMove(item)}
                          disabled={item.quantity <= 0}
                          className="px-4 py-2 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          title={item.quantity <= 0 ? 'No quantity available to move' : 'Move to Customer Inventory'}
                        >
                          Move
                        </button>
                        <button
                          onClick={() => handleEdit(item)}
                          className="px-4 py-2 text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={deleteLoading === item.id}
                          className="px-4 py-2 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-md transition-colors font-medium disabled:opacity-50"
                        >
                          {deleteLoading === item.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Inventory Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl border border-gray-200">
              <InventoryForm
                item={editingItem || undefined}
                onSubmit={handleSubmit}
                onCancel={() => {
                  setShowForm(false);
                  setEditingItem(null);
                }}
                isLoading={formLoading}
              />
            </div>
          </div>
        )}

        {/* Move to Customer Inventory Form Modal */}
        {showMoveForm && movingItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl border border-gray-200">
              <MoveToCustomerInventoryForm
                inventoryItem={movingItem}
                onSubmit={handleMoveSubmit}
                onCancel={() => {
                  setShowMoveForm(false);
                  setMovingItem(null);
                }}
                isLoading={moveLoading}
              />
            </div>
          </div>
        )}
      </main>
    </Layout>
  );
} 