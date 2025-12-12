'use client';

import { useSession, signOut } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import LEDController from '@/components/LEDController';
import GreenhouseSensorDashboard from '@/components/GreenhouseSensorDashboard';
import Layout from '@/components/Layout';

interface DashboardStats {
    inventoryCount: number;
    pendingSchedules: number;
    activeTasks: number;
    financialSummary: {
        income: number;
        expense: number;
    };
}

interface DashboardClientProps {
    stats: DashboardStats;
}

export default function DashboardClient({ stats }: DashboardClientProps) {
    const { data: session, status } = useSession();

    if (status === 'loading') {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    if (!session || session.user.role !== 'admin') {
        redirect('/login');
    }

    return (
        <Layout>
            <main className="min-h-screen bg-gray-50 text-gray-900 pb-12">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 pl-[72px] pr-4 lg:pl-6 lg:pr-6 py-4 shadow-sm sticky top-0 z-30 backdrop-blur-sm bg-white/95">
                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Greenhouse Dashboard</h1>
                            <p className="text-sm text-gray-600">Real-time monitoring and management</p>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="text-right hidden md:block">
                                <p className="text-sm font-medium text-gray-900">Welcome, {session?.user?.name}</p>
                                <p className="text-xs text-emerald-600">Administrator</p>
                            </div>
                            <button
                                onClick={() => signOut({ callbackUrl: '/login' })}
                                className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-gray-300"
                            >
                                <span>Sign Out</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="pl-[72px] pr-4 lg:pl-6 lg:pr-6 py-8">
                    <div className="max-w-7xl mx-auto space-y-8">

                        {/* 1. Real-time Sensors Section */}
                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                    <span className="text-xl">📡</span> Live Environment Data
                                </h2>
                                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium animate-pulse">
                                    Live
                                </span>
                            </div>
                            <GreenhouseSensorDashboard />
                        </section>

                        {/* 2. Key Metrics Grid */}
                        <section>
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <span className="text-xl">📊</span> Overview
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* Inventory Card */}
                                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="bg-blue-100 p-3 rounded-lg">
                                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                            </svg>
                                        </div>
                                        <span className="text-xs font-medium text-gray-500">Total Items</span>
                                    </div>
                                    <h3 className="text-3xl font-bold text-gray-900">{stats.inventoryCount}</h3>
                                    <p className="text-sm text-gray-500 mt-1">Products in inventory</p>
                                </div>

                                {/* Schedules Card */}
                                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="bg-purple-100 p-3 rounded-lg">
                                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <span className="text-xs font-medium text-gray-500">Pending</span>
                                    </div>
                                    <h3 className="text-3xl font-bold text-gray-900">{stats.pendingSchedules}</h3>
                                    <p className="text-sm text-gray-500 mt-1">Active schedules</p>
                                </div>

                                {/* Tasks Card */}
                                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="bg-orange-100 p-3 rounded-lg">
                                            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                            </svg>
                                        </div>
                                        <span className="text-xs font-medium text-gray-500">To Do</span>
                                    </div>
                                    <h3 className="text-3xl font-bold text-gray-900">{stats.activeTasks}</h3>
                                    <p className="text-sm text-gray-500 mt-1">Pending tasks</p>
                                </div>

                                {/* Financial Card */}
                                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="bg-emerald-100 p-3 rounded-lg">
                                            <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <span className="text-xs font-medium text-gray-500">This Month</span>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm text-gray-600 flex justify-between">
                                            <span>Income:</span>
                                            <span className="font-semibold text-emerald-600">+${stats.financialSummary.income.toLocaleString()}</span>
                                        </p>
                                        <p className="text-sm text-gray-600 flex justify-between">
                                            <span>Expense:</span>
                                            <span className="font-semibold text-red-600">-${stats.financialSummary.expense.toLocaleString()}</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 3. Controls & Visuals */}
                        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* LED Control Column */}
                            <div className="lg:col-span-1 border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <span className="text-xl">🎛️</span> Controls
                                </h2>
                                <LEDController />
                            </div>

                            {/* Plant Visual / Info */}
                            <div className="lg:col-span-2 bg-gradient-to-br from-white to-emerald-50 rounded-xl p-6 border border-emerald-100 shadow-sm flex items-center relative overflow-hidden">
                                <div className="relative z-10 max-w-lg">
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Smart Greenhouse Status</h3>
                                    <p className="text-gray-600 mb-6">
                                        System is operating within optimal parameters. Automated schedules are active for water and fertilizer distribution.
                                    </p>

                                    <div className="flex gap-4">
                                        <div className="bg-white/80 backdrop-blur-sm p-3 rounded-lg border border-emerald-100">
                                            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Tunnel 1</p>
                                            <p className="text-emerald-700 font-medium">Bell Pepper</p>
                                        </div>
                                        <div className="bg-white/80 backdrop-blur-sm p-3 rounded-lg border border-emerald-100">
                                            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Tunnel 2</p>
                                            <p className="text-emerald-700 font-medium">Coming Soon</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Decorative Image */}
                                <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-80 hidden sm:block">
                                    <div className="relative w-full h-full">
                                        <Image
                                            src="/images/bell-pepper-plant-with-root-under-the-ground-vector.jpg"
                                            alt="Greenhouse Plant"
                                            fill
                                            className="object-contain object-right-bottom p-4"
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>

                    </div>
                </div>
            </main>
        </Layout>
    );
}
