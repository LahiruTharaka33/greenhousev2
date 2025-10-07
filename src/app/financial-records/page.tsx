'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import FinancialRecordForm from '@/components/FinancialRecordForm';

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

export default function FinancialRecordsPage() {
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FinancialRecord | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState(() => {
    // Set default to current month (YYYY-MM format)
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [activeTab, setActiveTab] = useState<'records' | 'summary'>('records');

  // Fetch records
  const fetchRecords = async () => {
    try {
      const response = await fetch('/api/financial-records');
      if (response.ok) {
        const data = await response.json();
        setRecords(data);
      } else {
        console.error('Failed to fetch financial records');
      }
    } catch (error) {
      console.error('Error fetching financial records:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  // Handle form submission
  const handleSubmit = async (recordData: Omit<FinancialRecord, 'id' | 'createdAt' | 'updatedAt' | 'totalIncome'>) => {
    setFormLoading(true);
    try {
      const url = editingRecord 
        ? `/api/financial-records/${editingRecord.id}`
        : '/api/financial-records';
      
      const method = editingRecord ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(recordData),
      });

      if (response.ok) {
        await fetchRecords();
        setShowForm(false);
        setEditingRecord(null);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save financial record');
      }
    } catch (error) {
      console.error('Error saving financial record:', error);
      alert('Failed to save financial record');
    } finally {
      setFormLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (recordId: string) => {
    if (!confirm('Are you sure you want to delete this financial record?')) {
      return;
    }

    setDeleteLoading(recordId);
    try {
      const response = await fetch(`/api/financial-records/${recordId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchRecords();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete financial record');
      }
    } catch (error) {
      console.error('Error deleting financial record:', error);
      alert('Failed to delete financial record');
    } finally {
      setDeleteLoading(null);
    }
  };

  // Handle edit
  const handleEdit = (record: FinancialRecord) => {
    setEditingRecord(record);
    setShowForm(true);
  };

  // Filter records based on search term and date
  const filteredRecords = records.filter(record => {
    const matchesSearch = !searchTerm || (record.notes?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    const recordDate = new Date(record.date).toISOString().split('T')[0];
    const matchesDate = !dateFilter || recordDate.startsWith(dateFilter);
    return matchesSearch && matchesDate;
  });

  // Calculate totals - use filtered records for current month when in Records tab
  const recordsForStats = activeTab === 'records' ? filteredRecords : records;
  const totalIncome = recordsForStats.reduce((sum, record) => sum + record.totalIncome, 0);
  const totalCosts = recordsForStats.reduce((sum, record) => 
    sum + record.harvestingCost + record.chemicalCost + record.fertilizerCost + record.rent, 0);
  const netProfit = totalIncome - totalCosts;

  // Calculate monthly summary
  const monthlySummary = records.reduce((acc, record) => {
    const recordDate = new Date(record.date);
    const monthKey = `${recordDate.getFullYear()}-${String(recordDate.getMonth() + 1).padStart(2, '0')}`;
    const monthName = recordDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
    
    if (!acc[monthKey]) {
      acc[monthKey] = {
        month: monthName,
        monthKey,
        totalIncome: 0,
        totalCosts: 0,
        netProfit: 0,
        recordCount: 0
      };
    }
    
    acc[monthKey].totalIncome += record.totalIncome;
    acc[monthKey].totalCosts += record.harvestingCost + record.chemicalCost + record.fertilizerCost + record.rent;
    acc[monthKey].recordCount += 1;
    acc[monthKey].netProfit = acc[monthKey].totalIncome - acc[monthKey].totalCosts;
    
    return acc;
  }, {} as Record<string, {
    month: string;
    monthKey: string;
    totalIncome: number;
    totalCosts: number;
    netProfit: number;
    recordCount: number;
  }>);

  const monthlySummaryArray = Object.values(monthlySummary).sort((a, b) => 
    b.monthKey.localeCompare(a.monthKey)
  );

  // Format date
  const formatDate = (dateInput: string | Date) => {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `Rs ${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
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
                  Financial Records
                </h1>
                <p className="text-gray-600">
                  Track your harvest income and expenses
                </p>
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 shadow-sm"
              >
                <span>+</span>
                <span>Add Record</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-4 py-4">
          <div className="max-w-7xl mx-auto">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('records')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'records'
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Records
                </button>
                <button
                  onClick={() => setActiveTab('summary')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'summary'
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Monthly Summary
                </button>
              </nav>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="px-4 py-6">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'records' && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">Records Tab:</span> Showing data for {dateFilter ? new Date(dateFilter + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'current month'} only
                  </p>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Income</p>
                    <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalIncome)}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Costs</p>
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(totalCosts)}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${netProfit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                    <svg className={`w-6 h-6 ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Net Profit</p>
                    <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(netProfit)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Records</p>
                    <p className="text-2xl font-bold text-gray-900">{recordsForStats.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Filter - Only show for Records tab */}
            {activeTab === 'records' && (
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search by notes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 placeholder-gray-500"
                  />
                </div>
                <div className="sm:w-48 flex gap-2">
                  <input
                    type="month"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900"
                  />
                  {dateFilter && (
                    <button
                      onClick={() => setDateFilter('')}
                      className="px-3 py-2 text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      title="Clear date filter"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content based on active tab */}
        <div className="px-4 pb-6">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'records' ? (
              // Records Tab Content
              loading ? (
              <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading financial records...</p>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
                <div className="text-6xl mb-4">💰</div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  {searchTerm || dateFilter ? 'No records found' : 'No financial records yet'}
                </h2>
                <p className="text-gray-600 mb-6">
                  {searchTerm || dateFilter 
                    ? 'Try adjusting your search or filter terms'
                    : 'Get started by adding your first financial record'
                  }
                </p>
                {!searchTerm && !dateFilter && (
                  <button
                    onClick={() => setShowForm(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg transition-colors shadow-sm"
                  >
                    Add Your First Record
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rate (Rs/kg)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity (kg)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Income
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Costs
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Notes
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredRecords.map((record) => {
                        const totalCosts = record.harvestingCost + record.chemicalCost + record.fertilizerCost + record.rent;
                        return (
                          <tr key={record.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(record.date)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(record.rate)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {record.quantity} kg
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-emerald-600">
                              {formatCurrency(record.totalIncome)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="space-y-1">
                                {record.harvestingCost > 0 && (
                                  <div className="text-xs">Harvest: {formatCurrency(record.harvestingCost)}</div>
                                )}
                                {record.chemicalCost > 0 && (
                                  <div className="text-xs">Chemical: {formatCurrency(record.chemicalCost)}</div>
                                )}
                                {record.fertilizerCost > 0 && (
                                  <div className="text-xs">Fertilizer: {formatCurrency(record.fertilizerCost)}</div>
                                )}
                                {record.rent > 0 && (
                                  <div className="text-xs">Rent: {formatCurrency(record.rent)}</div>
                                )}
                                <div className="text-xs font-medium text-red-600">
                                  Total: {formatCurrency(totalCosts)}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                              {record.notes || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                              <button
                                onClick={() => handleEdit(record)}
                                className="text-emerald-600 hover:text-emerald-900"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(record.id)}
                                disabled={deleteLoading === record.id}
                                className="text-red-600 hover:text-red-900 disabled:opacity-50"
                              >
                                {deleteLoading === record.id ? 'Deleting...' : 'Delete'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )
            ) : (
              // Monthly Summary Tab Content
              loading ? (
                <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading monthly summary...</p>
                </div>
              ) : monthlySummaryArray.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
                  <div className="text-6xl mb-4">📊</div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                    No monthly data available
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Add some financial records to see monthly summaries
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Monthly Summary</h3>
                    <p className="text-sm text-gray-600">Financial performance by month</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Month
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total Income
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total Costs
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Net Profit
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Records
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {monthlySummaryArray.map((monthData) => (
                          <tr key={monthData.monthKey} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {monthData.month}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-emerald-600">
                              {formatCurrency(monthData.totalIncome)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                              {formatCurrency(monthData.totalCosts)}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                              monthData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {formatCurrency(monthData.netProfit)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {monthData.recordCount} record{monthData.recordCount !== 1 ? 's' : ''}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        {/* Financial Record Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl border border-gray-200">
              <FinancialRecordForm
                record={editingRecord || undefined}
                onSubmit={handleSubmit}
                onCancel={() => {
                  setShowForm(false);
                  setEditingRecord(null);
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

