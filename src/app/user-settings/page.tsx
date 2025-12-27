'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Layout from '@/components/Layout';
import UserLayout from '@/components/UserLayout';

export default function UserSettingsPage() {
    const { data: session, status } = useSession();
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isChanging, setIsChanging] = useState(false);
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate passwords match
        if (newPassword !== confirmPassword) {
            alert('New passwords do not match');
            return;
        }

        // Validate password length
        if (newPassword.length < 6) {
            alert('New password must be at least 6 characters long');
            return;
        }

        setIsChanging(true);

        try {
            const response = await fetch('/api/user/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    oldPassword,
                    newPassword,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                alert('✅ Password changed successfully!');
                // Reset form
                setOldPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                alert(`❌ ${data.error || 'Failed to change password'}`);
            }
        } catch (error) {
            console.error('Error changing password:', error);
            alert('❌ Failed to change password. Please try again.');
        } finally {
            setIsChanging(false);
        }
    };

    // Authentication checks
    if (status === 'loading') {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    if (!session) {
        redirect('/login');
    }

    // Use correct layout based on user role
    const LayoutComponent = session.user.role === 'admin' ? Layout : UserLayout;

    return (
        <LayoutComponent>
            <main className="min-h-screen bg-gray-50 text-gray-900">
                {/* Header with Safe Zone - Sticky with backdrop blur */}
                <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-200 pl-[72px] pr-4 lg:px-4 py-4 lg:py-6 shadow-sm animate-fade-in">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-col space-y-2">
                            <div>
                                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                                    ⚙️ User Settings
                                </h1>
                                <p className="text-sm sm:text-base text-gray-600 mt-1">
                                    Manage your account settings and preferences
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content with Safe Zone */}
                <div className="pl-[72px] pr-4 lg:px-4 py-4 lg:py-6 animate-fade-in-up">
                    <div className="max-w-4xl mx-auto space-y-4 lg:space-y-6">
                        {/* User Information Card */}
                        <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
                            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">
                                Account Information
                            </h2>

                            <div className="space-y-4">
                                {/* User Avatar and Name */}
                                <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
                                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                                        <span className="text-emerald-600 font-bold text-2xl">
                                            {session.user?.name?.charAt(0).toUpperCase() || 'U'}
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">{session.user?.name}</h3>
                                        <p className="text-sm text-gray-600 capitalize">{session.user?.role || 'User'}</p>
                                    </div>
                                </div>

                                {/* User Details Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-1">
                                            Email Address
                                        </label>
                                        <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                                            {session.user?.email || 'Not set'}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-1">
                                            User Role
                                        </label>
                                        <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900 capitalize">
                                            {session.user?.role || 'User'}
                                        </div>
                                    </div>

                                    {session.user?.customerId && (
                                        <div className="sm:col-span-2">
                                            <label className="block text-sm font-medium text-gray-500 mb-1">
                                                Customer ID
                                            </label>
                                            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900 font-mono text-sm">
                                                {session.user.customerId}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Change Password Card */}
                        <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
                            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">
                                Change Password
                            </h2>

                            <form onSubmit={handleChangePassword} className="space-y-4">
                                {/* Current Password */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Current Password *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showOldPassword ? 'text' : 'password'}
                                            value={oldPassword}
                                            onChange={(e) => setOldPassword(e.target.value)}
                                            className="w-full px-3 py-3 min-h-[44px] border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 text-base pr-12"
                                            placeholder="Enter current password"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowOldPassword(!showOldPassword)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                                        >
                                            {showOldPassword ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                                </svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* New Password */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        New Password *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showNewPassword ? 'text' : 'password'}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full px-3 py-3 min-h-[44px] border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 text-base pr-12"
                                            placeholder="Enter new password (min. 6 characters)"
                                            required
                                            minLength={6}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                                        >
                                            {showNewPassword ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                                </svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Confirm New Password */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Confirm New Password *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full px-3 py-3 min-h-[44px] border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 text-base pr-12"
                                            placeholder="Re-enter new password"
                                            required
                                            minLength={6}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                                        >
                                            {showConfirmPassword ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                                </svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                    {newPassword && confirmPassword && newPassword !== confirmPassword && (
                                        <p className="mt-1 text-sm text-red-600">
                                            ⚠️ Passwords do not match
                                        </p>
                                    )}
                                </div>

                                {/* Password Requirements */}
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                                    <div className="flex items-start gap-2">
                                        <span className="text-blue-600 text-lg">ℹ️</span>
                                        <div className="text-sm text-blue-800">
                                            <p className="font-medium mb-1">Password Requirements:</p>
                                            <ul className="list-disc list-inside space-y-1">
                                                <li>Minimum 6 characters long</li>
                                                <li>Must enter current password to verify identity</li>
                                                <li>New password must match confirmation</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <div className="flex justify-end pt-4 border-t border-gray-200">
                                    <button
                                        type="submit"
                                        disabled={isChanging || !oldPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                                        className="px-6 py-3 min-h-[44px] bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                    >
                                        {isChanging ? 'Changing Password...' : 'Change Password'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </main>
        </LayoutComponent>
    );
}
