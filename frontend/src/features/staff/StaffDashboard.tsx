import { API_BASE_URL } from "../../lib/apiConfig";
import React, { useState, useEffect, useMemo } from "react";
import { CustomConfirmModal } from "../../components/CustomConfirmModal";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Building2,
  Users,
  Search,
  Bell,
  Calendar,
  ChevronDown,
  UserPlus,
  Wallet,
  TrendingUp,
  CreditCard,
  Wrench,
  Menu,
  X,
  ShieldCheck,
  CheckCircle2,
  Clock,
  UserCheck,
  LogOut,
  Plus,
  FileText,
  AlertCircle,
  QrCode,
  IndianRupee,
  Layers,
  Phone,
  Mail,
  Home,
  CheckCircle,
} from "lucide-react";

import brandLogo from "@/assets/shripad-logo.png";
import { InvoiceDesign } from "../../components/InvoiceDesign";

export default function StaffDashboard() {
  const navigate = useNavigate();
  const [staffList, setStaffList] = useState<any[]>(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("shripad_cached_staff");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) return parsed;
        } catch {}
      }
    }
    return [];
  });
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [buildingsList, setBuildingsList] = useState<any[]>(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("shripad_cached_buildings");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) return parsed;
        } catch {}
      }
    }
    return [];
  });
  const [bookings, setBookings] = useState<any[]>(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("shripad_cached_bookings");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) return parsed;
        } catch {}
      }
    }
    return [];
  });
  const [activeTab, setActiveTab] = useState<"Overview" | "Residents" | "Allocation" | "Payments" | "Complaints">("Overview");

  const [searchQuery, setSearchQuery] = useState("");
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [selectedResidentForPayment, setSelectedResidentForPayment] = useState<any>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<"cash" | "upi" | "bank_transfer">("cash");
  const [payTxnId, setPayTxnId] = useState("");
  const [payDate, setPayDate] = useState(new Date().toISOString().split("T")[0]);

  // PWA Install Prompt State & Handler
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
    };
    if (typeof window !== "undefined") {
      window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      }
    };
  }, []);

  const [confirmModalState, setConfirmModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: "danger" | "warning" | "info";
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const handleInstallPwa = async () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      const choiceResult = await deferredInstallPrompt.userChoice;
      if (choiceResult && choiceResult.outcome === "accepted") {
        setDeferredInstallPrompt(null);
      }
    } else {
      setConfirmModalState({
        isOpen: true,
        title: "📱 SripadPG App Installation Guide",
        message: "To install SripadPG App on your phone home screen:\n\n• Android / Chrome: Tap 3 dots (⋮) at top-right → select 'Install app' or 'Add to Home screen'.\n• iPhone / Safari: Tap Share icon (⬆️) → select 'Add to Home Screen' (➕).",
        confirmText: "Got it",
        cancelText: "",
        type: "info",
        onConfirm: () => {},
      });
    }
  };

  // Login Modal State
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/staff-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const data = await res.json();
      if (data.success && data.staff) {
        setSelectedStaffId(data.staff.id);
        localStorage.setItem("shripad_staff_id", data.staff.id);
        localStorage.setItem("shripad_staff_session", JSON.stringify(data.staff));
        if (data.token) {
          localStorage.setItem("shripad_auth_token", data.token);
        }
        setIsLoginModalOpen(false);
        setLoginEmail("");
        setLoginPassword("");
      } else {
        setLoginError(data.message || "Invalid credentials. Credentials fixed by Super Admin.");
      }
    } catch (err) {
      setLoginError("Failed to connect to authentication server.");
    }
  };

  // Invoice Modal State
  const [viewingInvoice, setViewingInvoice] = useState<any>(null);

  // Fetch initial data
  const fetchData = async () => {
    try {
      const [staffRes, bldRes, bookRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/staff`),
        fetch(`${API_BASE_URL}/api/buildings`),
        fetch(`${API_BASE_URL}/api/bookings`),
      ]);

      const staffData = await staffRes.json();
      const bldData = await bldRes.json();
      const bookData = await bookRes.json();

      if (staffData.success && Array.isArray(staffData.staff)) {
        setStaffList(staffData.staff);
        const savedStaffId = localStorage.getItem("shripad_staff_id");
        if (savedStaffId && staffData.staff.some((s: any) => s.id === savedStaffId)) {
          setSelectedStaffId(savedStaffId);
        } else if (staffData.staff.length > 0) {
          const firstStaff = staffData.staff.find((s: any) => s.role !== "super_admin") || staffData.staff[0];
          setSelectedStaffId(firstStaff.id);
        }
      }

      if (bldData.success && Array.isArray(bldData.buildings)) {
        setBuildingsList(bldData.buildings);
      }

      if (bookData.success && Array.isArray(bookData.bookings)) {
        setBookings(bookData.bookings);
      }
    } catch (err) {
      console.error("Error fetching staff dashboard data:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const activeStaff = useMemo(() => {
    return staffList.find((s) => s.id === selectedStaffId) || staffList[0] || { name: "Staff Member", assignedBuildings: ["PG ShripadLux-A wing"], email: "admin@shripadpg.com" };
  }, [staffList, selectedStaffId]);

  const assignedBuildings = useMemo(() => {
    if (!activeStaff || activeStaff.assignedBuildings?.includes("ALL")) {
      return buildingsList.length > 0 ? buildingsList.map((b) => b.name) : ["PG ShripadLux-A wing"];
    }
    return activeStaff.assignedBuildings?.length ? activeStaff.assignedBuildings : (buildingsList.length > 0 ? buildingsList.map((b) => b.name) : ["PG ShripadLux-A wing"]);
  }, [activeStaff, buildingsList]);

  // Filter bookings to assigned building(s)
  const scopedBookings = useMemo(() => {
    return bookings.filter((b) => {
      const bld = b.allocatedBuilding || b.building;
      return assignedBuildings.includes(bld);
    });
  }, [bookings, assignedBuildings]);

  const activeResidents = useMemo(() => {
    return scopedBookings.filter((b) => b.status === "allocated");
  }, [scopedBookings]);

  // Dynamic stats calculation accounting for per-room bed overrides and custom floor counts
  const totalBeds = useMemo(() => {
    const activeBldObjs = buildingsList.filter((b) => assignedBuildings.includes(b.name));
    let beds = 0;
    activeBldObjs.forEach((bld: any) => {
      const floorsCount = Number(bld.floors) || 1;
      const floorRoomCounts = bld.floorRoomCounts || {};
      const roomBeds = bld.roomBeds || {};

      for (let f = 0; f < floorsCount; f++) {
        const rCount = floorRoomCounts[f] !== undefined ? floorRoomCounts[f] : (Number(bld.roomsPerFloor) || 4);
        for (let r = 1; r <= rCount; r++) {
          const rNo = f === 0 ? `G${r.toString().padStart(2, "0")}` : `${f}${r.toString().padStart(2, "0")}`;
          const cleanNo = rNo.replace(/^Room\s+/i, "");
          const roomBedCount = roomBeds[rNo] !== undefined ? roomBeds[rNo] : (roomBeds[cleanNo] !== undefined ? roomBeds[cleanNo] : 2);
          beds += Number(roomBedCount);
        }
      }
    });
    return beds || 40;
  }, [buildingsList, assignedBuildings]);

  const occupiedBeds = activeResidents.length;
  const availableBeds = Math.max(0, totalBeds - occupiedBeds);
  const occupancyRate = totalBeds > 0 ? ((occupiedBeds / totalBeds) * 100).toFixed(1) : "0.0";

  const totalMonthlyRevenue = useMemo(() => {
    return activeResidents.reduce((acc, curr) => acc + (Number(curr.rentAmount) || Number(curr.monthlyRent) || 5000), 0);
  }, [activeResidents]);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResidentForPayment || payAmount <= 0) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/bookings/${selectedResidentForPayment.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: payAmount,
          paymentMethod: payMethod,
          transactionId: payTxnId || (payMethod === "cash" ? `CASH-${Date.now()}` : `ONLINE-${Date.now()}`),
          paymentDate: payDate,
          month: new Date(payDate || Date.now()).getMonth() + 1,
          year: new Date(payDate || Date.now()).getFullYear(),
          verifiedBy: activeStaff.name,
        }),
      });

      const data = await res.json();
      if (data.success) {
        fetchData();
        setIsRecordPaymentOpen(false);
        setSelectedResidentForPayment(null);
        setPayAmount(0);
        setPayTxnId("");
      }
    } catch (err) {
      console.error("Error recording payment:", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-slate-900 text-white shadow-xl border-b border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img src={brandLogo} alt="Shripad PG" className="h-9 w-auto filter drop-shadow" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-sm text-white tracking-wide">STAFF PORTAL</span>
              <span className="px-2 py-0.5 rounded-full bg-[#F0F4FF]0/20 text-emerald-400 font-extrabold text-[10px] border border-[#00022E]/30">
                🏢 {assignedBuildings.join(", ")}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-semibold">Dedicated Property Management Dashboard</p>
          </div>
        </div>

        {/* Staff Switcher & Quick Actions */}
        <div className="flex items-center gap-3">
          {/* Staff Switcher */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs">
            <UserCheck className="h-4 w-4 text-emerald-400 shrink-0" />
            <span className="text-[10px] text-slate-400 uppercase font-black">Logged Staff:</span>
            <select
              value={selectedStaffId}
              onChange={(e) => {
                setSelectedStaffId(e.target.value);
                localStorage.setItem("shripad_staff_id", e.target.value);
              }}
              className="bg-transparent font-black text-emerald-300 outline-none cursor-pointer text-xs"
            >
              {staffList.map((s) => (
                <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                  {s.name} ({s.assignedBuildings?.includes("ALL") ? "All Properties" : s.assignedBuildings?.join(", ") || (buildingsList[0]?.name || "PG ShripadLux-A wing")})
                </option>
              ))}
            </select>
          </div>

          {/* Install SripadPG App Button */}
          <button
            onClick={handleInstallPwa}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black transition cursor-pointer shadow-xs active:scale-95 border border-indigo-400/30"
            title="Install SripadPG App on your Phone"
          >
            <span>📱</span>
            <span className="hidden sm:inline">Install App</span>
          </button>

          <button
            onClick={() => setIsLoginModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#00022E] hover:bg-[#00022E] text-white text-xs font-black transition cursor-pointer shadow-xs active:scale-95"
          >
            <UserCheck className="h-3.5 w-3.5" />
            <span>Staff Login</span>
          </button>

          <Link
            to="/admin"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-extrabold border border-slate-700 transition"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-brand-gold" />
            <span>Admin View</span>
          </Link>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Active Staff Welcome Banner */}
        <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-brand-navy to-emerald-950 p-6 text-white shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">Active Staff Manager</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">Welcome back, {activeStaff.name}! 👋</h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium">
              Managing <strong className="text-emerald-400">{assignedBuildings.join(", ")}</strong> • {activeResidents.length} Active Residents
            </p>
          </div>

          <button
            onClick={() => setIsRecordPaymentOpen(true)}
            className="px-5 py-3 rounded-2xl bg-brand-green hover:bg-brand-gold text-white font-black text-xs transition shadow-lg flex items-center gap-2 active:scale-95 cursor-pointer"
          >
            <CreditCard className="h-4 w-4" />
            <span>Record Rent Payment</span>
          </button>
        </div>

        {/* Top Metric Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase">Assigned Property</span>
              <div className="p-2 rounded-xl bg-[#F0F4FF] text-brand-green"><Building2 className="h-4 w-4" /></div>
            </div>
            <p className="text-xl sm:text-2xl font-black text-slate-900">{assignedBuildings.join(", ")}</p>
            <p className="text-[11px] text-slate-400 font-semibold">Active Management Scope</p>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase">Active Residents</span>
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600"><Users className="h-4 w-4" /></div>
            </div>
            <p className="text-xl sm:text-2xl font-black text-slate-900">{activeResidents.length} Residents</p>
            <p className="text-[11px] text-[#00022E] font-bold">{occupancyRate}% Occupancy</p>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase">Vacant Beds</span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600"><Home className="h-4 w-4" /></div>
            </div>
            <p className="text-xl sm:text-2xl font-black text-amber-600">{availableBeds} Free Beds</p>
            <p className="text-[11px] text-slate-400 font-semibold">Out of {totalBeds} Total Beds</p>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase">Monthly Rent Roll</span>
              <div className="p-2 rounded-xl bg-[#F0F4FF] text-[#00022E]"><IndianRupee className="h-4 w-4" /></div>
            </div>
            <p className="text-xl sm:text-2xl font-black text-slate-900">₹{totalMonthlyRevenue.toLocaleString("en-IN")}</p>
            <p className="text-[11px] text-slate-400 font-semibold">Expected Rent Revenue</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
          {(["Overview", "Residents", "Payments"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-full text-xs font-black transition cursor-pointer ${
                activeTab === tab
                  ? "bg-slate-900 text-white shadow-md"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              {tab === "Overview" && "📊 Staff Overview"}
              {tab === "Residents" && `👥 Building Residents (${activeResidents.length})`}
              {tab === "Payments" && "💳 Record Payments"}
            </button>
          ))}
        </div>

        {/* TAB 1: OVERVIEW & RESIDENTS ROSTER */}
        {activeTab === "Overview" && (
          <div className="space-y-6">
            {/* Search Filter */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search resident name, room number, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 bg-white text-xs font-bold text-slate-900 outline-none focus:border-brand-green"
                />
              </div>
            </div>

            {/* Resident Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeResidents
                .filter((r) => !searchQuery || r.name?.toLowerCase().includes(searchQuery.toLowerCase()) || (r.allocatedRoom || r.room || r.roomNo)?.toLowerCase().includes(searchQuery.toLowerCase()) || r.phone?.includes(searchQuery))
                .map((res) => (
                  <div key={res.id} className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3 hover:border-brand-green/40 transition">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-green text-white font-black text-xs shadow-sm">
                          {res.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-extrabold text-sm text-slate-900">{res.name}</h3>
                          <p className="text-xs text-slate-500 font-semibold">📞 {res.phone}</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-[#F0F4FF] text-[#00022E] font-black text-xs">
                        {res.allocatedRoom ? `Room ${res.allocatedRoom}` : (res.roomNo || "Room 101")} ({res.allocatedBed ? `Bed ${res.allocatedBed}` : `Bed ${res.bedSeat || "A"}`})
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-600">
                      <span>Monthly Rent: ₹{(Number(res.rentAmount) || Number(res.monthlyRent) || 5000).toLocaleString("en-IN")}</span>
                      <button
                        onClick={() => {
                          setSelectedResidentForPayment(res);
                          setPayAmount(Number(res.rentAmount) || Number(res.monthlyRent) || 5000);
                          setIsRecordPaymentOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-brand-green text-white text-[11px] font-black transition cursor-pointer"
                      >
                        + Collect Rent
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* TAB 2: RESIDENTS TABLE */}
        {activeTab === "Residents" && (
          <div className="rounded-3xl bg-white border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-900 text-white font-black text-xs uppercase flex items-center justify-between">
              <span>Assigned Building Residents Roster ({assignedBuildings.join(", ")})</span>
              <span className="text-emerald-400">{activeResidents.length} Total</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                    <th className="p-3.5">Resident Name</th>
                    <th className="p-3.5">Phone</th>
                    <th className="p-3.5">Building</th>
                    <th className="p-3.5">Room & Bed</th>
                    <th className="p-3.5">Monthly Rent</th>
                    <th className="p-3.5">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                  {activeResidents.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="p-3.5 font-bold text-slate-900">{r.name}</td>
                      <td className="p-3.5 text-slate-600">{r.phone}</td>
                      <td className="p-3.5"><span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 font-bold">{r.allocatedBuilding || r.building}</span></td>
                      <td className="p-3.5 font-bold text-brand-green">{r.allocatedRoom ? `Room ${r.allocatedRoom}` : (r.roomNo || "Room 101")} ({r.allocatedBed ? `Bed ${r.allocatedBed}` : `Bed ${r.bedSeat || "A"}`})</td>
                      <td className="p-3.5 font-black text-slate-900">₹{(Number(r.rentAmount) || Number(r.monthlyRent) || 5000).toLocaleString()}</td>
                      <td className="p-3.5">
                        <button
                          onClick={() => {
                            setSelectedResidentForPayment(r);
                            setPayAmount(Number(r.rentAmount) || Number(r.monthlyRent) || 5000);
                            setIsRecordPaymentOpen(true);
                          }}
                          className="px-3 py-1 rounded-xl bg-brand-green text-white font-bold text-[11px] hover:bg-brand-gold transition cursor-pointer"
                        >
                          Record Rent
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: RECORD PAYMENTS FORM */}
        {activeTab === "Payments" && (
          <div className="max-w-2xl mx-auto rounded-3xl bg-white border border-slate-200 p-6 space-y-4 shadow-sm">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-brand-green" /> Record Rent Payment for Resident
            </h2>

            <form onSubmit={handleRecordPayment} className="space-y-4 text-xs font-bold">
              <div>
                <label className="block text-slate-700 mb-1">Select Resident *</label>
                <select
                  required
                  value={selectedResidentForPayment?.id || ""}
                  onChange={(e) => {
                    const res = activeResidents.find((r) => r.id === e.target.value);
                    setSelectedResidentForPayment(res);
                    if (res) setPayAmount(Number(res.rentAmount) || Number(res.monthlyRent) || 5000);
                  }}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 outline-none focus:border-brand-green font-bold text-xs cursor-pointer"
                >
                  <option value="">-- Choose Resident --</option>
                  {activeResidents.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.allocatedBuilding || r.building} • Room {r.allocatedRoom || r.room || r.roomNo || "101"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    value={payAmount === 0 ? "" : payAmount}
                    onChange={(e) => setPayAmount(Number(e.target.value.replace(/^0+/, "")))}
                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-black outline-none focus:border-brand-green"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value as any)}
                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-bold outline-none focus:border-brand-green cursor-pointer"
                  >
                    <option value="cash">Cash at PG Desk</option>
                    <option value="upi">UPI / GPay / PhonePe</option>
                    <option value="bank_transfer">Bank Transfer / IMPS</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1">Payment Received Date *</label>
                  <input
                    type="date"
                    required
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-bold outline-none focus:border-brand-green"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1">Transaction ID / Ref (Optional for Cash)</label>
                  <input
                    type="text"
                    placeholder="e.g. UPI-12345678"
                    value={payTxnId}
                    onChange={(e) => setPayTxnId(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-bold outline-none focus:border-brand-green"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-brand-green hover:bg-brand-gold text-white font-black text-xs transition shadow-md cursor-pointer active:scale-95"
              >
                + Record Payment & Generate Receipt
              </button>
            </form>
          </div>
        )}
      </div>

      {/* RECORD PAYMENT MODAL OVERLAY */}
      {isRecordPaymentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs" onClick={() => setIsRecordPaymentOpen(false)}>
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base">Record Payment</h3>
              <button onClick={() => setIsRecordPaymentOpen(false)} className="p-1 rounded-full text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleRecordPayment} className="space-y-3 text-xs font-bold">
              <div>
                <label className="block text-slate-700 mb-1">Select Resident</label>
                <select
                  required
                  value={selectedResidentForPayment?.id || ""}
                  onChange={(e) => {
                    const res = activeResidents.find((r) => r.id === e.target.value);
                    setSelectedResidentForPayment(res);
                    if (res) setPayAmount(Number(res.rentAmount) || Number(res.monthlyRent) || 5000);
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                >
                  <option value="">-- Select Resident --</option>
                  {activeResidents.map((r) => (
                    <option key={r.id} value={r.id}>{r.name} ({r.allocatedBuilding || r.building} • Room {r.allocatedRoom || r.room || r.roomNo || "101"})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    value={payAmount === 0 ? "" : payAmount}
                    onChange={(e) => setPayAmount(Number(e.target.value.replace(/^0+/, "")))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-black"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1">Payment Method</label>
                  <select value={payMethod} onChange={(e) => setPayMethod(e.target.value as any)} className="w-full p-2.5 rounded-xl border border-slate-200">
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full py-3 rounded-xl bg-brand-green text-white font-black hover:bg-brand-gold transition cursor-pointer">
                Submit Payment
              </button>
            </form>
          </div>
        </div>
      )}

      {/* STAFF CREDENTIALS LOGIN MODAL */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in" onClick={() => setIsLoginModalOpen(false)}>
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 border border-slate-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-brand-green" />
                <h3 className="font-black text-slate-900 text-base">Staff Member Credentials Login</h3>
              </div>
              <button onClick={() => setIsLoginModalOpen(false)} className="p-1 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            {loginError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-rose-800 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleStaffLogin} className="space-y-4 text-xs font-bold">
              <div>
                <label className="block text-slate-700 mb-1">Assigned Staff Login Email *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. ramesh@shripadpg.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 outline-none focus:border-brand-green font-bold text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Fixed Login Password *</label>
                <input
                  type="password"
                  required
                  placeholder="e.g. ramesh123"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 outline-none focus:border-brand-green font-bold text-xs"
                />
                <p className="text-[10px] font-semibold text-slate-400 mt-1">🔒 Password is assigned and fixed by Super Admin.</p>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-brand-green hover:bg-brand-gold text-white font-black text-xs transition shadow-md cursor-pointer active:scale-95"
              >
                Authenticate & Access Staff Portal
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOM SLEEK ENTERPRISE CONFIRMATION MODAL */}
      <CustomConfirmModal
        isOpen={confirmModalState.isOpen}
        title={confirmModalState.title}
        message={confirmModalState.message}
        confirmText={confirmModalState.confirmText}
        cancelText={confirmModalState.cancelText}
        type={confirmModalState.type}
        onConfirm={confirmModalState.onConfirm}
        onClose={() => setConfirmModalState((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
