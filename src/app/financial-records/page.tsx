'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
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
  deliveryCost: number;
  commission: number;
  other: number;
  notes?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export default function FinancialRecordsPage() {
  const { data: session, status } = useSession();
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
  const [error, setError] = useState<string | null>(null);
  const [monthlyCosts, setMonthlyCosts] = useState({
    salary: 0,
    manPower: 0,
    other: 0,
  });
  const [isMonthlyCostsExpanded, setIsMonthlyCostsExpanded] = useState(false);
  const [monthlySummaryFilter, setMonthlySummaryFilter] = useState({
    fromMonth: '',
    toMonth: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalRecords, setTotalRecords] = useState(0);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Fetch records with pagination
  const fetchRecords = async (page = currentPage, size = pageSize) => {
    try {
      setError(null);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: size.toString(),
        ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
        ...(dateFilter && { month: dateFilter })
      });
      
      console.log('Fetching records with params:', Object.fromEntries(params)); // Debug log
      
      const response = await fetch(`/api/financial-records?${params}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Records fetched:', { count: data.records?.length, total: data.total, page: data.page }); // Debug log
        setRecords(data.records || []);
        setTotalRecords(data.total || 0);
        setCurrentPage(data.page || page);
      } else {
        const errorData = await response.json();
        console.error('Failed to fetch financial records:', errorData);
        setError(errorData.error || 'Failed to fetch financial records');
      }
    } catch (error) {
      console.error('Error fetching financial records:', error);
      setError('Failed to connect to the server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      fetchRecords();
    } else if (status === 'authenticated' && session?.user?.role !== 'admin') {
      setLoading(false);
      setError('Unauthorized: Admin access required');
    }
  }, [status, session]);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Refetch records when search term changes
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      fetchRecords(1, pageSize); // Reset to page 1 when searching
    }
  }, [debouncedSearchTerm]);

  // Refresh records when month filter changes
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      console.log('Month filter changed, refreshing records:', dateFilter); // Debug log
      fetchRecords(1, pageSize); // Reset to first page when filter changes
    }
  }, [dateFilter, status, session]);

  // Load monthly costs from database for the selected month
  const fetchMonthlyCosts = async (month: string) => {
    try {
      const response = await fetch(`/api/monthly-costs?month=${month}`);
      if (response.ok) {
        const data = await response.json();
        setMonthlyCosts({
          salary: data.salary || 0,
          manPower: data.manPower || 0,
          other: data.other || 0
        });
      } else {
        console.error('Failed to fetch monthly costs');
        setMonthlyCosts({ salary: 0, manPower: 0, other: 0 });
      }
    } catch (error) {
      console.error('Error fetching monthly costs:', error);
      setMonthlyCosts({ salary: 0, manPower: 0, other: 0 });
    }
  };

  // Load monthly costs when dateFilter changes
  useEffect(() => {
    const monthKey = dateFilter || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    fetchMonthlyCosts(monthKey);
  }, [dateFilter]);

  // Save monthly costs to database
  const saveMonthlyCosts = async (month: string, costs: { salary: number; manPower: number; other: number }) => {
    try {
      const response = await fetch('/api/monthly-costs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          month,
          salary: costs.salary,
          manPower: costs.manPower,
          other: costs.other
        }),
      });

      if (!response.ok) {
        console.error('Failed to save monthly costs');
      }
    } catch (error) {
      console.error('Error saving monthly costs:', error);
    }
  };

  // Save monthly costs when they change
  useEffect(() => {
    const monthKey = dateFilter || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    // Debounce the save to avoid too many API calls
    const timeoutId = setTimeout(() => {
      saveMonthlyCosts(monthKey, monthlyCosts);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [monthlyCosts, dateFilter]);

  // Handle form submission
  const handleSubmit = async (recordData: Omit<FinancialRecord, 'id' | 'createdAt' | 'updatedAt' | 'rate'>) => {
    setFormLoading(true);
    try {
      // Validate required fields
      if (!recordData.date || !recordData.totalIncome || !recordData.quantity) {
        alert('Please fill in all required fields (Date, Total Income, Quantity)');
        setFormLoading(false);
        return;
      }

      // Validate numeric values
      if (isNaN(parseFloat(recordData.totalIncome)) || isNaN(parseFloat(recordData.quantity))) {
        alert('Total Income and Quantity must be valid numbers');
        setFormLoading(false);
        return;
      }

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
        // Refresh records to show updated data
        await fetchRecords();
        setShowForm(false);
        setEditingRecord(null);
        alert('Financial record saved successfully!');
      } else {
        const error = await response.json();
        console.error('API Error:', error);
        alert(error.error || 'Failed to save financial record. Please try again.');
      }
    } catch (error) {
      console.error('Error saving financial record:', error);
      alert('Network error. Please check your connection and try again.');
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

  // Filter records based on search term only (month filtering is handled by API)
  const filteredRecords = records.filter(record => {
    const matchesSearch = !searchTerm || (record.notes?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    return matchesSearch;
  });

  // Calculate totals for Records tab
  const recordsForStats = filteredRecords;
  const recordsTotalIncome = recordsForStats.reduce((sum, record) => sum + record.totalIncome, 0);
  const recordsCosts = recordsForStats.reduce((sum, record) => 
    sum + record.harvestingCost + record.deliveryCost + record.commission + record.other, 0);
  const totalMonthlyCosts = monthlyCosts.salary + monthlyCosts.manPower + monthlyCosts.other;
  const recordsTotalCosts = recordsCosts + totalMonthlyCosts;
  const recordsNetProfit = recordsTotalIncome - recordsTotalCosts;

  // State for all records (unfiltered) for monthly summary
  const [allRecords, setAllRecords] = useState<FinancialRecord[]>([]);
  const [loadingAllRecords, setLoadingAllRecords] = useState(false);

  // Fetch all records for monthly summary (unfiltered)
  const fetchAllRecords = async () => {
    try {
      setLoadingAllRecords(true);
      const response = await fetch('/api/financial-records?limit=1000'); // Get all records
      if (response.ok) {
        const data = await response.json();
        setAllRecords(data.records || []);
        console.log('Fetched all records for monthly summary:', data.records?.length, 'records');
      }
    } catch (error) {
      console.error('Error fetching all records for monthly summary:', error);
    } finally {
      setLoadingAllRecords(false);
    }
  };

  // Fetch all records when component mounts or when switching to summary tab
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin' && activeTab === 'summary') {
      fetchAllRecords();
    }
  }, [activeTab, status, session]);

  // Calculate monthly summary from all records (unfiltered)
  const monthlySummary = allRecords.reduce((acc, record) => {
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
    acc[monthKey].totalCosts += record.harvestingCost + record.deliveryCost + record.commission + record.other;
    acc[monthKey].recordCount += 1;
    
    return acc;
  }, {} as Record<string, {
    month: string;
    monthKey: string;
    totalIncome: number;
    totalCosts: number;
    netProfit: number;
    recordCount: number;
  }>);

  // State to track monthly costs for each month
  const [monthlyCostsData, setMonthlyCostsData] = useState<Record<string, { salary: number; manPower: number; other: number }>>({});

  // Fetch monthly costs for all months in the summary
  const fetchAllMonthlyCosts = async () => {
    const monthKeys = Object.keys(monthlySummary);
    const monthlyCostsPromises = monthKeys.map(async (monthKey) => {
      try {
        const response = await fetch(`/api/monthly-costs?month=${monthKey}`);
        if (response.ok) {
          const monthCosts = await response.json();
          return { monthKey, costs: monthCosts };
        }
        return { monthKey, costs: { salary: 0, manPower: 0, other: 0 } };
      } catch (error) {
        console.error(`Error fetching monthly costs for ${monthKey}:`, error);
        return { monthKey, costs: { salary: 0, manPower: 0, other: 0 } };
      }
    });

    const results = await Promise.all(monthlyCostsPromises);
    const monthlyCostsMap: Record<string, { salary: number; manPower: number; other: number }> = {};
    results.forEach(({ monthKey, costs }) => {
      monthlyCostsMap[monthKey] = costs;
    });
    setMonthlyCostsData(monthlyCostsMap);
  };

  // Fetch monthly costs when allRecords change
  useEffect(() => {
    if (Object.keys(monthlySummary).length > 0) {
      fetchAllMonthlyCosts();
    }
  }, [allRecords]);

  // Calculate monthly summary array with monthly costs included
  const monthlySummaryArray = Object.values(monthlySummary).map(monthData => {
    const monthlyCosts = monthlyCostsData[monthData.monthKey] || { salary: 0, manPower: 0, other: 0 };
    const monthlyCostsTotal = monthlyCosts.salary + monthlyCosts.manPower + monthlyCosts.other;
    
    return {
      ...monthData,
      totalCosts: monthData.totalCosts + monthlyCostsTotal,
      netProfit: monthData.totalIncome - (monthData.totalCosts + monthlyCostsTotal)
    };
  }).sort((a, b) => b.monthKey.localeCompare(a.monthKey));

  // Filter monthly summary array based on month range and search term
  const filteredMonthlySummaryArray = monthlySummaryArray.filter(monthData => {
    // Search filter
    const matchesSearch = !searchTerm || monthData.month.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Month range filter
    const monthKey = monthData.monthKey;
    let matchesMonthRange = true;
    
    if (monthlySummaryFilter.fromMonth && monthlySummaryFilter.toMonth) {
      // Range filter
      matchesMonthRange = monthKey >= monthlySummaryFilter.fromMonth && monthKey <= monthlySummaryFilter.toMonth;
    } else if (monthlySummaryFilter.fromMonth) {
      // From month only
      matchesMonthRange = monthKey >= monthlySummaryFilter.fromMonth;
    } else if (monthlySummaryFilter.toMonth) {
      // To month only
      matchesMonthRange = monthKey <= monthlySummaryFilter.toMonth;
    }
    
    return matchesSearch && matchesMonthRange;
  });

  // Calculate totals based on active tab
  let totalIncome, totalCosts, netProfit, displayTotalRecords;

  if (activeTab === 'records') {
    // Records tab: use filtered records for current month
    totalIncome = recordsTotalIncome;
    totalCosts = recordsTotalCosts;
    netProfit = recordsNetProfit;
    displayTotalRecords = totalRecords; // Use the paginated total
  } else {
    // Monthly Summary tab: use filtered aggregated data from monthly summary
    totalIncome = filteredMonthlySummaryArray.reduce((sum, month) => sum + month.totalIncome, 0);
    totalCosts = filteredMonthlySummaryArray.reduce((sum, month) => sum + month.totalCosts, 0);
    netProfit = filteredMonthlySummaryArray.reduce((sum, month) => sum + month.netProfit, 0);
    displayTotalRecords = filteredMonthlySummaryArray.length; // Count of rows in monthly summary table
    
    // Debug logging for monthly summary
    console.log('Monthly Summary Totals:', {
      totalIncome,
      totalCosts,
      netProfit,
      displayTotalRecords,
      filteredMonths: filteredMonthlySummaryArray.length,
      allMonths: monthlySummaryArray.length,
      monthlySummaryBreakdown: filteredMonthlySummaryArray.map(month => ({
        month: month.month,
        recordCount: month.recordCount
      }))
    });
  }

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

  // Authentication checks
  if (status === 'loading') {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!session || session.user.role !== 'admin') {
    redirect('/login');
  }

  return (
    <Layout>
      <main className="min-h-screen bg-gray-50 text-gray-900">
        {/* Header with Safe Zone */}
        <div className="bg-white border-b border-gray-200 pl-16 pr-4 lg:pl-6 lg:pr-6 py-4 md:py-6 shadow-sm sticky top-0 z-30 backdrop-blur-sm bg-white/95">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-0.5 truncate">
                  Financial Records
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 truncate">
                  Track your harvest income and expenses
                </p>
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white px-3 sm:px-4 md:px-6 py-2.5 min-h-[44px] min-w-[44px] rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-1 sm:gap-2 shadow-sm whitespace-nowrap flex-shrink-0"
              >
                <span className="text-base sm:text-lg">+</span>
                <span className="hidden sm:inline text-sm md:text-base">Add Record</span>
              </button>
            </div>
          </div>
        </div>

        {/* Error Alert with Safe Zone */}
        {error && (
          <div className="pl-16 pr-4 lg:px-4 py-4">
            <div className="max-w-7xl mx-auto">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-red-800">
                    <span className="font-medium">Error:</span> {error}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation with Safe Zone */}
        <div className="pl-16 pr-4 lg:px-4 py-4">
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


        {/* Stats Cards with Safe Zone */}
        <div className="pl-16 pr-4 lg:px-4 py-6">
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
                    <p className="text-2xl font-bold text-gray-900">{displayTotalRecords}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Monthly Costs Section - Only show on Records tab */}
            {activeTab === 'records' && (
              <div className="mb-6">
                <div className="bg-white rounded-lg shadow-sm border">
                  <button
                    onClick={() => setIsMonthlyCostsExpanded(!isMonthlyCostsExpanded)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center">
                      <div className="p-2 bg-orange-100 rounded-lg mr-4">
                        <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">Monthly Costs</h3>
                        <p className="text-sm text-gray-600">
                          Manage monthly expenses for {dateFilter ? new Date(dateFilter + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'current month'} (Salary, Man Power, Other)
                        </p>
                      </div>
                    </div>
                    <svg 
                      className={`w-5 h-5 text-gray-400 transition-transform ${isMonthlyCostsExpanded ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {isMonthlyCostsExpanded && (
                    <div className="px-6 pb-6 border-t border-gray-200">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <label htmlFor="salary" className="block text-sm font-medium text-gray-700 mb-2">
                            Salary
                          </label>
                          <input
                            type="number"
                            id="salary"
                            value={monthlyCosts.salary}
                            onChange={(e) => setMonthlyCosts(prev => ({ ...prev, salary: parseFloat(e.target.value) || 0 }))}
                            step="0.01"
                            min="0"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            placeholder="0.00"
                          />
                        </div>
                        
                        <div className="bg-gray-50 rounded-lg p-4">
                          <label htmlFor="manPower" className="block text-sm font-medium text-gray-700 mb-2">
                            Man Power
                          </label>
                          <input
                            type="number"
                            id="manPower"
                            value={monthlyCosts.manPower}
                            onChange={(e) => setMonthlyCosts(prev => ({ ...prev, manPower: parseFloat(e.target.value) || 0 }))}
                            step="0.01"
                            min="0"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            placeholder="0.00"
                          />
                        </div>
                        
                        <div className="bg-gray-50 rounded-lg p-4">
                          <label htmlFor="other" className="block text-sm font-medium text-gray-700 mb-2">
                            Other
                          </label>
                          <input
                            type="number"
                            id="other"
                            value={monthlyCosts.other}
                            onChange={(e) => setMonthlyCosts(prev => ({ ...prev, other: parseFloat(e.target.value) || 0 }))}
                            step="0.01"
                            min="0"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                      
                      <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-orange-800">Total Monthly Costs:</span>
                          <span className="text-lg font-semibold text-orange-900">{formatCurrency(totalMonthlyCosts)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Search and Filter - Show for both tabs */}
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
                <div className="sm:w-48">
                  <input
                    type="month"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900"
                  />
                </div>
              </div>
            )}

            {/* Monthly Summary Filter - Only show for Monthly Summary tab */}
            {activeTab === 'summary' && (
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search by month name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 placeholder-gray-500"
                  />
                </div>
                <div className="sm:w-48 flex gap-2">
                  <input
                    type="month"
                    value={monthlySummaryFilter.fromMonth}
                    onChange={(e) => setMonthlySummaryFilter(prev => ({ ...prev, fromMonth: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900"
                    placeholder="From Month"
                  />
                  <input
                    type="month"
                    value={monthlySummaryFilter.toMonth}
                    onChange={(e) => setMonthlySummaryFilter(prev => ({ ...prev, toMonth: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900"
                    placeholder="To Month"
                  />
                  {(monthlySummaryFilter.fromMonth || monthlySummaryFilter.toMonth) && (
                    <button
                      onClick={() => setMonthlySummaryFilter({ fromMonth: '', toMonth: '' })}
                      className="px-3 py-2 text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      title="Clear month filter"
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
                    ? `No records found for ${dateFilter ? new Date(dateFilter + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'the selected month'}${searchTerm ? ` matching "${searchTerm}"` : ''}. Try adjusting your search or filter terms.`
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
                  {/* Table View */}
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
                            Profit
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
                          const totalCosts = record.harvestingCost + record.deliveryCost + record.commission + record.other;
                          const calculatedRate = record.quantity > 0 ? (record.totalIncome - totalCosts) / record.quantity : 0;
                          const profit = record.totalIncome - totalCosts;
                        return (
                          <tr key={record.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(record.date)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatCurrency(calculatedRate)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {record.quantity} kg
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-emerald-600">
                              {formatCurrency(record.totalIncome)}
                            </td>
                              <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                                profit >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {formatCurrency(profit)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="space-y-1">
                                {record.harvestingCost > 0 && (
                                  <div className="text-xs">Harvest: {formatCurrency(record.harvestingCost)}</div>
                                )}
                                  {record.deliveryCost > 0 && (
                                    <div className="text-xs">Delivery: {formatCurrency(record.deliveryCost)}</div>
                                )}
                                  {record.commission > 0 && (
                                    <div className="text-xs">Commission: {formatCurrency(record.commission)}</div>
                                )}
                                  {record.other > 0 && (
                                    <div className="text-xs">Other: {formatCurrency(record.other)}</div>
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
                  
                  
                  {/* Pagination Controls */}
                  {activeTab === 'records' && totalRecords > pageSize && (
                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-700">
                            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords} records
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setCurrentPage(prev => Math.max(1, prev - 1));
                              fetchRecords(currentPage - 1, pageSize);
                            }}
                            disabled={currentPage === 1}
                            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Previous
                          </button>
                          <span className="px-3 py-2 text-sm text-gray-700">
                            Page {currentPage} of {Math.ceil(totalRecords / pageSize)}
                          </span>
                          <button
                            onClick={() => {
                              setCurrentPage(prev => prev + 1);
                              fetchRecords(currentPage + 1, pageSize);
                            }}
                            disabled={currentPage >= Math.ceil(totalRecords / pageSize)}
                            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
              </div>
            )
            ) : (
              // Monthly Summary Tab Content
              (loading || loadingAllRecords) ? (
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
                        {filteredMonthlySummaryArray.map((monthData) => (
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

