"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Layout from "@/components/Layout";
import MQTTStatus from "@/components/MQTTStatus";
import GreenhouseSensorDashboard from "@/components/GreenhouseSensorDashboard";
import WaterTankMonitor from "@/components/WaterTankMonitor";
import SearchableSelect from "@/components/SearchableSelect";

export default function AdminControllerPage() {
  const { data: session, status } = useSession();

  // State for dropdowns
  const [customers, setCustomers] = useState<any[]>([]);
  const [tunnels, setTunnels] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null
  );
  const [selectedTunnelId, setSelectedTunnelId] = useState<string | null>(null);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [isLoadingTunnels, setIsLoadingTunnels] = useState(false);

  useEffect(() => {
    // Set page title
    document.title = "Greenhouse Monitoring";

    // Fetch customers
    const fetchCustomers = async () => {
      setIsLoadingCustomers(true);
      try {
        const response = await fetch("/api/customers");
        if (response.ok) {
          const data = await response.json();
          setCustomers(data);
        }
      } catch (error) {
        console.error("Failed to fetch customers:", error);
      } finally {
        setIsLoadingCustomers(false);
      }
    };

    if (session?.user?.role === "admin") {
      fetchCustomers();
    }
  }, [session]);

  // Fetch tunnels when customer changes
  useEffect(() => {
    const fetchTunnels = async () => {
      if (!selectedCustomerId) {
        setTunnels([]);
        return;
      }

      setIsLoadingTunnels(true);
      try {
        const response = await fetch(
          `/api/tunnels/by-customer/${selectedCustomerId}`
        );
        if (response.ok) {
          const data = await response.json();
          setTunnels(data);
        }
      } catch (error) {
        console.error("Failed to fetch tunnels:", error);
      } finally {
        setIsLoadingTunnels(false);
      }
    };

    fetchTunnels();
  }, [selectedCustomerId]);

  const handleCustomerChange = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setSelectedTunnelId(null); // Reset tunnel selection
  };

  const handleTunnelChange = (tunnelId: string) => {
    setSelectedTunnelId(tunnelId);
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== "admin") {
    redirect("/login");
  }

  // Format options for dropdowns
  const customerOptions = customers.map((c) => ({
    value: c.id,
    label: `${c.customerName} (${c.customerId})`,
  }));

  const tunnelOptions = tunnels.map((t) => ({
    value: t.id,
    label: `${t.tunnelName} (${t.tunnelId})`,
  }));

  return (
    <Layout>
      <main className="min-h-screen bg-gray-50 text-gray-900">
        {/* Sticky Header with Safe Zone */}
        <div className="bg-white border-b border-gray-200 pl-[72px] pr-4 lg:pl-6 lg:pr-6 py-4 md:py-6 shadow-sm sticky top-0 z-30 backdrop-blur-sm bg-white/95">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 truncate">
                  Greenhouse Monitoring
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 truncate">
                  Real-time sensor data and water tank status
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Selection Controls */}
        <div className="pl-[72px] pr-4 lg:pl-6 lg:pr-6 py-4 md:py-6">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SearchableSelect
                  label="Select Customer"
                  options={customerOptions}
                  value={selectedCustomerId}
                  onChange={handleCustomerChange}
                  isLoading={isLoadingCustomers}
                  placeholder="Search customer..."
                />
                <SearchableSelect
                  label="Select Tunnel"
                  options={tunnelOptions}
                  value={selectedTunnelId}
                  onChange={handleTunnelChange}
                  isLoading={isLoadingTunnels}
                  disabled={!selectedCustomerId}
                  placeholder={
                    !selectedCustomerId
                      ? "Select a customer first"
                      : "Search tunnel..."
                  }
                />
              </div>
            </div>
          </div>
        </div>

        {/* Water Tank Monitor with Safe Zone */}
        <div className="pl-[72px] pr-4 lg:pl-6 lg:pr-6 py-4 md:py-6 animate-fade-in-up">
          <div className="max-w-7xl mx-auto">
            <WaterTankMonitor />
          </div>
        </div>

        {/* MQTT Connection with Safe Zone */}
        <div className="pl-[72px] pr-4 lg:pl-6 lg:pr-6 pb-4 md:pb-6">
          <div className="max-w-7xl mx-auto">
            <MQTTStatus />
          </div>
        </div>

        {/* Sensor Dashboard with Safe Zone */}
        <div className="pl-[72px] pr-4 lg:pl-6 lg:pr-6 pb-4 md:pb-6">
          <div className="max-w-7xl mx-auto">
            <GreenhouseSensorDashboard />
          </div>
        </div>
      </main>
    </Layout>
  );
}
