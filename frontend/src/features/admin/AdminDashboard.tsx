import { API_BASE_URL } from "../../lib/apiConfig";
import React, { useState, useEffect, useMemo } from "react";
import { CustomConfirmModal } from "../../components/CustomConfirmModal";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  BarChart3,
  Building2,
  Users,
  Settings,
  Search,
  Bell,
  Calendar,
  ChevronDown,
  UserPlus,
  Wallet,
  Megaphone,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  CreditCard,
  Wrench,
  Menu,
  X,
  Home,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sliders,
  Filter,
  Globe,
  Laptop,
  UserCheck,
  CalendarRange,
  LogOut,
  User,
  Eye,
  EyeOff,
  Plus,
  ExternalLink,
  FileText,
  CheckCircle,
  ClipboardCheck,
  KeyRound,
  Bed,
  Layers,
  Lock,
  Check,
  Grid,
  MessageSquare,
  Pencil,
  Trash2,
  RotateCcw,
  FileSpreadsheet,
  Download,
  Table,
  UploadCloud,
  AlertCircle,
  PhoneCall,
  Copy,
  Receipt,
  IndianRupee,
  CalendarDays,
  QrCode,
  Landmark,
  Save,
  RefreshCw,
  Bot,
  MapPin,
  Send,
  Printer,
} from "lucide-react";
import { ShripadNameLogo } from "@/components/ShripadNameLogo";
import { InvoiceDesign } from "@/components/InvoiceDesign";
import { normalizeResident, residentPipelineCache } from "../../lib/dataPipeline";
import brandLogo from "@/assets/shripad-logo.png";
import {
  generateContactReport,
  generateAllocationReport,
  generateBuildingReport,
  generateRevenueReport,
  generateMasterReport,
} from "../../lib/excelReportGenerator";
import { generateCustomerCredentials } from "../../lib/credentialUtils";

export function AdminDashboard({ tab = "Dashboard", isStaffMode = false }: { tab?: string; isStaffMode?: boolean }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(tab);

  const [allotmentSuccessData, setAllotmentSuccessData] = useState<{
    residentName: string;
    building: string;
    room: string;
    bed: string;
    customerId: string;
    customerPassword: string;
    phone: string;
  } | null>(null);
  const [copiedCredentialText, setCopiedCredentialText] = useState(false);

  // Rent Setup Modal State (post-allotment flow)
  const [rentSetupTarget, setRentSetupTarget] = useState<{
    id: string;
    residentName: string;
    building: string;
    room: string;
    bed: string;
  } | null>(null);
  const [rentSetupAmount, setRentSetupAmount] = useState<string>("");
  const [rentSetupStartDate, setRentSetupStartDate] = useState(new Date().toISOString().substring(0, 10));
  const [rentSetupCheckoutDate, setRentSetupCheckoutDate] = useState("");
  const [rentSetupStayType, setRentSetupStayType] = useState<"monthly" | "short_stay">("monthly");
  const [isRentSetupSubmitting, setIsRentSetupSubmitting] = useState(false);
  const [isEditingRent, setIsEditingRent] = useState(false);

  useEffect(() => {
    if (isStaffMode) {
      const staffSessionStr = localStorage.getItem("shripad_staff_session");
      if (!staffSessionStr) {
        navigate({ to: "/staff/login" as any });
        return;
      }

      try {
        const parsed = JSON.parse(staffSessionStr);
        if (!parsed || !parsed.authenticated) {
          navigate({ to: "/staff/login" as any });
          return;
        }
        if (parsed.staffId) {
          setActiveStaffScopeId(parsed.staffId);
        }
      } catch {
        navigate({ to: "/staff/login" as any });
        return;
      }

      if (tab) {
        setActiveTab(tab);
      }
      return;
    }

    const adminSessionStr = localStorage.getItem("shripad_admin_session");
    if (!adminSessionStr) {
      navigate({ to: "/admin/login" as any });
      return;
    }

    try {
      const parsed = JSON.parse(adminSessionStr);
      if (!parsed || !parsed.authenticated) {
        navigate({ to: "/admin/login" as any });
        return;
      }
    } catch {
      navigate({ to: "/admin/login" as any });
      return;
    }

    if (tab) {
      setActiveTab(tab);
    }
  }, [tab, navigate, isStaffMode]);

  const handleAdminLogout = () => {
    if (isStaffMode) {
      localStorage.removeItem("shripad_staff_session");
      localStorage.removeItem("shripad_staff_id");
      navigate({ to: "/staff/login" as any });
    } else {
      localStorage.removeItem("shripad_admin_session");
      navigate({ to: "/admin/login" as any });
    }
  };

  const handleTabClick = (tabName: string) => {
    setActiveTab(tabName);
    setIsMobileMenuOpen(false);
    if (isStaffMode) {
      navigate({ to: `/staff/${tabName.toLowerCase()}` as any });
    } else {
      navigate({ to: `/admin/${tabName.toLowerCase()}` as any });
    }
  };

  const [reportSearchQuery, setReportSearchQuery] = useState("");
  const [reportSelectedBuilding, setReportSelectedBuilding] = useState("All");
  const [reportActivePreviewTab, setReportActivePreviewTab] = useState<"contact" | "allocation" | "building" | "revenue">("revenue");
  const [searchQuery, setSearchQuery] = useState("");
  const [customerDirectorySearch, setCustomerDirectorySearch] = useState("");
  const [customerDirectoryBuilding, setCustomerDirectoryBuilding] = useState("All");
  const [customerDirectoryStatus, setCustomerDirectoryStatus] = useState<"all" | "allocated" | "pending">("all");
  const [revenueSubTab, setRevenueSubTab] = useState<"analytics" | "transactions">("analytics");
  const [paymentAuditSearch, setPaymentAuditSearch] = useState("");
  const [timeRange, setTimeRange] = useState("Last 60 Days");
  const [customerTimeFilter, setCustomerTimeFilter] = useState<"24h" | "7d" | "1m" | "custom">("24h");
  const [customStartDate, setCustomStartDate] = useState("2026-08-01");
  const [customEndDate, setCustomEndDate] = useState("2026-08-08");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);
  const [isMoreDrawerOpen, setIsMoreDrawerOpen] = useState(false);
  const [createModalTab, setCreateModalTab] = useState<"manual" | "online">("manual");
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newCustomerEmail, setNewCustomerEmail] = useState("");
  const [newCustomerGuardianPhone, setNewCustomerGuardianPhone] = useState("");
  const [newCustomerDocumentName, setNewCustomerDocumentName] = useState("");
  const [newCustomerDocumentData, setNewCustomerDocumentData] = useState("");
  const [googleSheetWebhookUrl, setGoogleSheetWebhookUrl] = useState(() => (typeof window !== "undefined" ? localStorage.getItem("shripad_google_sheet_webhook") || "" : ""));
  const [isScriptCopied, setIsScriptCopied] = useState(false);
  const [newCustomerBuilding, setNewCustomerBuilding] = useState("Unallocated");
  const [formSuccessMessage, setFormSuccessMessage] = useState("");
  const [allocationFilter, setAllocationFilter] = useState<"all" | "pending" | "allocated">("all");
  const [allocationSourceFilter, setAllocationSourceFilter] = useState<"all" | "manual" | "online">("all");
  const [selectedAllocateCustomer, setSelectedAllocateCustomer] = useState<any>(null);
  const [allocatedBuilding, setAllocatedBuilding] = useState("PG A - Main Branch");
  const [allocatedRoom, setAllocatedRoom] = useState("Room 102");
  const [selectedHistoryResident, setSelectedHistoryResident] = useState<any>(null);
  const [historyTab, setHistoryTab] = useState<"room" | "payment" | "complaint" | "documents">("room");

  // Dynamic Room Sharing Configuration per Room (e.g. 1-Sharing, 2-Sharing, 3-Sharing, 4-Sharing, 5-Sharing, 6-Sharing)
  const [customRoomSharing, setCustomRoomSharing] = useState<Record<string, number>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("shripad_custom_room_sharing");
        return saved ? JSON.parse(saved) : {};
      } catch {
        return {};
      }
    }
    return {};
  });

  // Deposit & Allocation Matrix States
  const [bmsRentAmount, setBmsRentAmount] = useState<number>(5000);
  const [bmsDepositAmount, setBmsDepositAmount] = useState<number>(5000);
  const [bmsDepositStatus, setBmsDepositStatus] = useState<"paid" | "pending">("paid");
  const [bmsRentStartDate, setBmsRentStartDate] = useState<string>(new Date().toISOString().substring(0, 10));

  // Checkout & Deposit Refund Clearance States
  const [checkoutCustomer, setCheckoutCustomer] = useState<any | null>(null);
  const [checkoutDeductions, setCheckoutDeductions] = useState<number>(0);
  const [checkoutDeductionReason, setCheckoutDeductionReason] = useState<string>("");
  const [checkoutRefundMethod, setCheckoutRefundMethod] = useState<"cash" | "upi" | "bank_transfer">("cash");
  const [checkoutTxnId, setCheckoutTxnId] = useState<string>("");
  const [isCheckoutSubmitting, setIsCheckoutSubmitting] = useState<boolean>(false);
  const [checkoutSuccessVoucher, setCheckoutSuccessVoucher] = useState<any | null>(null);

  // Payment Form & SMS Verification State
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [newPaymentAmount, setNewPaymentAmount] = useState(5000);
  const [newPaymentTxnId, setNewPaymentTxnId] = useState("");
  const [newPaymentPayerName, setNewPaymentPayerName] = useState("");
  const [newPaymentDate, setNewPaymentDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [newPaymentMonth, setNewPaymentMonth] = useState(new Date().getMonth() + 1);
  const [newPaymentYear, setNewPaymentYear] = useState(new Date().getFullYear());
  const [newPaymentMethod, setNewPaymentMethod] = useState<"upi" | "bank_transfer" | "cash" | "other">("cash");
  const [newPaymentSmsText, setNewPaymentSmsText] = useState("");
  const [activeSmsVerifyPaymentId, setActiveSmsVerifyPaymentId] = useState<string | null>(null);
  const [pasteSmsInput, setPasteSmsInput] = useState("");
  const [smsVerifyStatus, setSmsVerifyStatus] = useState<{ isMatch?: boolean; message?: string } | null>(null);
  const [isPaymentSubmitting, setIsPaymentSubmitting] = useState(false);
  const [viewingAdminInvoiceData, setViewingAdminInvoiceData] = useState<any | null>(null);

  // Centralized Complaints Hub State & Notification Management
  const [isComplaintsHubModalOpen, setIsComplaintsHubModalOpen] = useState(false);
  const [complaintsHubFilter, setComplaintsHubFilter] = useState<"all" | "pending" | "in_progress" | "resolved">("all");
  const [complaintsHubCategoryFilter, setComplaintsHubCategoryFilter] = useState<string>("all");
  const [complaintsHubSearch, setComplaintsHubSearch] = useState<string>("");
  const [complaintAdminReplies, setComplaintAdminReplies] = useState<Record<string, string>>({});

  // WhatsApp Automation Center State
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [whatsappStatus, setWhatsappStatus] = useState<{
    connected: boolean;
    status: string;
    phone?: string | null;
    pushName?: string | null;
    sessionId?: string | null;
  } | null>(null);
  const [whatsappQrCode, setWhatsappQrCode] = useState<string | null>(null);
  const [isCheckingWhatsApp, setIsCheckingWhatsApp] = useState(false);
  const [waTestPhone, setWaTestPhone] = useState("");
  const [waTestMessage, setWaTestMessage] = useState("Hello from Shripad PG Automation! 🏠✨");
  const [isSendingWaTest, setIsSendingWaTest] = useState(false);

  // WhatsApp Templates & Location Chatbot Management State
  const [waModalTab, setWaModalTab] = useState<"overview" | "templates" | "chatbot">("overview");
  const [waTemplates, setWaTemplates] = useState<{
    invoiceMessage: string;
    complaintUpdateMessage: string;
    paymentConfirmationMessage: string;
    welcomeAllotmentMessage: string;
    chatbotEnabled: boolean;
    chatbotGreetingMessage: string;
    chatbotLocations: Array<{
      id: string;
      name: string;
      keyword: string;
      address: string;
      rooms: string;
      rentRange: string;
      amenities: string;
      mapLink: string;
      contactPhone: string;
    }>;
    chatbotDefaultReply: string;
  } | null>(null);
  const [isLoadingWaTemplates, setIsLoadingWaTemplates] = useState(false);
  const [isSavingWaTemplates, setIsSavingWaTemplates] = useState(false);
  const [activeTemplateType, setActiveTemplateType] = useState<"invoice" | "complaint" | "payment" | "welcome">("invoice");
  const [editingBranch, setEditingBranch] = useState<{
    id: string;
    name: string;
    keyword: string;
    address: string;
    rooms: string;
    rentRange: string;
    amenities: string;
    mapLink: string;
    contactPhone: string;
  } | null>(null);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);

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
  const [isPaymentSettingsModalOpen, setIsPaymentSettingsModalOpen] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState({
    upiId: "shripadpg@okaxis",
    qrCodeUrl: "",
    bankName: "Axis Bank Ltd",
    accountNo: "924020058192041",
    ifscCode: "UTIB0001824",
    accountName: "Shripad PG Services",
    adminPhone: "+91 98765 43210",
    wardenPhone: "+91 98765 00000",
    dueDay: 5,
    includedAmenities: "Food, Water, Wi-Fi, Laundry",
  });
  const [isSavingPaymentSettings, setIsSavingPaymentSettings] = useState(false);
  const [paymentSettingsMsg, setPaymentSettingsMsg] = useState("");

  const fetchPaymentSettings = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/settings/payment`);
      const data = await res.json();
      if (data.success && data.settings) {
        setPaymentSettings(data.settings);
        if (typeof window !== "undefined") {
          localStorage.setItem("shripad_payment_settings", JSON.stringify(data.settings));
        }
      }
    } catch {
      if (typeof window !== "undefined") {
        const local = localStorage.getItem("shripad_payment_settings");
        if (local) {
          try { setPaymentSettings(JSON.parse(local)); } catch {}
        }
      }
    }
  };

  useEffect(() => {
    fetchPaymentSettings();
  }, []);

  // Custom Toast Popup State
  const [customToast, setCustomToast] = useState<{
    isOpen: boolean;
    message: string;
    type?: "success" | "error" | "info";
  }>({ isOpen: false, message: "", type: "success" });

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setCustomToast({ isOpen: true, message, type });
    setTimeout(() => {
      setCustomToast((prev) => ({ ...prev, isOpen: false }));
    }, 4000);
  };

  const handleSavePaymentSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPaymentSettings(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/settings/payment`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentSettings),
      });
      const data = await res.json();
      if (data.success && data.settings) {
        setPaymentSettings(data.settings);
        localStorage.setItem("shripad_payment_settings", JSON.stringify(data.settings));
        showToast("Official Payment Details & QR Code updated successfully!", "success");
        setIsPaymentSettingsModalOpen(false);
      } else {
        showToast("Failed to save payment details. Please try again.", "error");
      }
    } catch (err) {
      console.error("Failed to save payment settings:", err);
      showToast("Server connection error. Please try again.", "error");
    } finally {
      setIsSavingPaymentSettings(false);
    }
  };

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setPaymentSettings((prev) => ({ ...prev, qrCodeUrl: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Submit Payment Handler
  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHistoryResident || !newPaymentAmount) return;
    setIsPaymentSubmitting(true);

    const finalTxnId = newPaymentTxnId.trim() || (newPaymentMethod === "cash" ? `CASH-${Date.now().toString().slice(-6)}` : `MANUAL-${Date.now().toString().slice(-6)}`);

    try {
      const res = await fetch(`${API_BASE_URL}/api/bookings/${selectedHistoryResident.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: newPaymentMonth,
          year: newPaymentYear,
          paymentDate: newPaymentDate,
          amount: newPaymentAmount,
          transactionId: finalTxnId,
          payerName: newPaymentPayerName || selectedHistoryResident.name,
          paymentMethod: newPaymentMethod,
          bankSmsText: newPaymentSmsText,
        }),
      });

      const data = await res.json();
      if (data.success && data.booking) {
        setBookings((prev) => prev.map((b) => (b.id === data.booking.id ? data.booking : b)));
        setSelectedHistoryResident(data.booking);
        setIsRecordPaymentOpen(false);
        setNewPaymentTxnId("");
        setNewPaymentSmsText("");
        setSmsVerifyStatus(data.smsMatchResult ? { isMatch: data.smsMatchResult.isMatch, message: data.smsMatchResult.reason } : null);
      }
    } catch (err) {
      console.error("Failed to submit payment:", err);
    } finally {
      setIsPaymentSubmitting(false);
    }
  };

  // Verify Payment Handler
  const handleVerifyPayment = async (bookingId: string, paymentId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/bookings/${bookingId}/payments/${paymentId}/verify`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verifiedBy: "Admin" }),
      });
      const data = await res.json();
      if (data.success && data.booking) {
        setBookings((prev) => prev.map((b) => (b.id === data.booking.id ? data.booking : b)));
        setSelectedHistoryResident(data.booking);
      }
    } catch (err) {
      console.error("Failed to verify payment:", err);
    }
  };

  // Verify Payment & Raise Official Invoice Handler
  const handleVerifyAndRaiseInvoice = async (bookingId: string, paymentId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/bookings/${bookingId}/payments/${paymentId}/verify`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verifiedBy: "Admin", raiseInvoice: true }),
      });
      const data = await res.json();
      if (data.success && data.booking) {
        setBookings((prev) => prev.map((b) => (b.id === data.booking.id ? data.booking : b)));
        setSelectedHistoryResident(data.booking);
        setActiveTab("Invoice");
      }
    } catch (err) {
      console.error("Failed to verify payment and raise invoice:", err);
    }
  };

  // Reject Payment Handler
  const handleRejectPayment = async (bookingId: string, paymentId: string) => {
    const reason = prompt("Enter rejection reason (optional):", "Transaction details could not be verified") || "Rejected by admin";
    try {
      const res = await fetch(`${API_BASE_URL}/api/bookings/${bookingId}/payments/${paymentId}/reject`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejectedReason: reason }),
      });
      const data = await res.json();
      if (data.success && data.booking) {
        setBookings((prev) => prev.map((b) => (b.id === data.booking.id ? data.booking : b)));
        setSelectedHistoryResident(data.booking);
      }
    } catch (err) {
      console.error("Failed to reject payment:", err);
    }
  };

  // SMS Auto-Match Verification Handler
  const handleVerifyWithSms = async (bookingId: string, paymentId: string) => {
    if (!pasteSmsInput.trim()) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/bookings/${bookingId}/payments/${paymentId}/verify-sms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bankSmsText: pasteSmsInput }),
      });
      const data = await res.json();
      setSmsVerifyStatus({ isMatch: data.isMatch, message: data.message });
      if (data.success && data.booking) {
        setBookings((prev) => prev.map((b) => (b.id === data.booking.id ? data.booking : b)));
        setSelectedHistoryResident(data.booking);
        if (data.isMatch) {
          setActiveSmsVerifyPaymentId(null);
          setPasteSmsInput("");
        }
      }
    } catch (err) {
      console.error("Failed to run SMS verification:", err);
    }
  };

  // Buildings state & Add Building feature (Backend JSON DB Persisted & Local Cache Synced)
  const [buildingsList, setBuildingsList] = useState<Array<{
    id?: string;
    name: string;
    floors: number;
    roomsPerFloor: number;
    floorRoomCounts?: Record<number, number>;
    blockedRooms?: string[];
  }>>(() => {
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

  const fetchBuildings = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/buildings`);
      const data = await res.json();
      if (data.success && Array.isArray(data.buildings)) {
        setBuildingsList(data.buildings);
        if (typeof window !== "undefined") {
          localStorage.setItem("shripad_cached_buildings", JSON.stringify(data.buildings));
        }
      }
    } catch (err) {
      console.error("Failed to fetch buildings from backend:", err);
    }
  };

  useEffect(() => {
    fetchBuildings();
  }, []);

  // Staff Management & Building Scope State (Backend Persisted & Local Cache Synced)
  const [staffList, setStaffList] = useState<Array<{
    id: string;
    name: string;
    phone: string;
    email: string;
    password?: string;
    role: string;
    assignedBuildings: string[];
    status: string;
  }>>(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("shripad_cached_staff");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch {}
      }
    }
    return [
      { id: "staff_super", name: "Master Admin", phone: "9876543210", email: "admin@shripadpg.com", password: "admin123", role: "super_admin", assignedBuildings: ["ALL"], status: "active" },
    ];
  });

  const [activeStaffScopeId, setActiveStaffScopeId] = useState<string>("staff_super");
  const [isStaffModalOpen, setIsStaffModalOpen] = useState<boolean>(false);

  // Staff Form state
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffPhone, setNewStaffPhone] = useState("");
  const [newStaffEmail, setNewStaffEmail] = useState("");
  const [newStaffPassword, setNewStaffPassword] = useState("");
  const [newStaffRole, setNewStaffRole] = useState<string>("building_manager");
  const [newStaffAssignedBuildings, setNewStaffAssignedBuildings] = useState<string[]>(["PG A"]);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [copiedStaffId, setCopiedStaffId] = useState<string | null>(null);
  const [showStaffPasswordMap, setShowStaffPasswordMap] = useState<Record<string, boolean>>({});

  // Google Sheets Integration Settings State
  const [manualBookingSheetUrl, setManualBookingSheetUrl] = useState("");
  const [onlineBookingSheetUrl, setOnlineBookingSheetUrl] = useState("");
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isTestingManualUrl, setIsTestingManualUrl] = useState(false);
  const [isTestingOnlineUrl, setIsTestingOnlineUrl] = useState(false);
  const [manualUrlTestStatus, setManualUrlTestStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [onlineUrlTestStatus, setOnlineUrlTestStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [settingsSaveToast, setSettingsSaveToast] = useState<{ success?: boolean; message?: string } | null>(null);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/settings`);
      const data = await res.json();
      if (data.success && data.settings) {
        setManualBookingSheetUrl(data.settings.manualBookingSheetUrl || "");
        setOnlineBookingSheetUrl(data.settings.onlineBookingSheetUrl || "");
      }
    } catch (err) {
      console.error("Failed to fetch settings:", err);
    }
  };

  const handleSaveSheetSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingSettings(true);
    setSettingsSaveToast(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          manualBookingSheetUrl,
          onlineBookingSheetUrl,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSettingsSaveToast({ success: true, message: "Google Sheet URLs updated & saved successfully!" });
        fetchBookings();
      } else {
        setSettingsSaveToast({ success: false, message: data.message || "Failed to save settings." });
      }
    } catch (err: any) {
      setSettingsSaveToast({ success: false, message: err.message || "Network error saving settings." });
    } finally {
      setIsSavingSettings(false);
      setTimeout(() => setSettingsSaveToast(null), 5000);
    }
  };

  const handleTestSheetUrl = async (url: string, type: "manual" | "online") => {
    if (!url || !url.trim()) {
      const msg = "Please enter a valid Google Sheet URL before testing.";
      if (type === "manual") setManualUrlTestStatus({ success: false, message: msg });
      else setOnlineUrlTestStatus({ success: false, message: msg });
      return;
    }

    if (type === "manual") {
      setIsTestingManualUrl(true);
      setManualUrlTestStatus(null);
    } else {
      setIsTestingOnlineUrl(true);
      setOnlineUrlTestStatus(null);
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/settings/test-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (type === "manual") {
        setManualUrlTestStatus({ success: data.success, message: data.message });
      } else {
        setOnlineUrlTestStatus({ success: data.success, message: data.message });
      }
    } catch (err: any) {
      const msg = `Connection error: ${err.message}`;
      if (type === "manual") setManualUrlTestStatus({ success: false, message: msg });
      else setOnlineUrlTestStatus({ success: false, message: msg });
    } finally {
      if (type === "manual") setIsTestingManualUrl(false);
      else setIsTestingOnlineUrl(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/staff`);
      const data = await res.json();
      if (data.success && Array.isArray(data.staff)) {
        setStaffList(data.staff);
        if (typeof window !== "undefined") {
          localStorage.setItem("shripad_cached_staff", JSON.stringify(data.staff));
        }
      }
    } catch (err) {
      console.error("Failed to fetch staff members from backend:", err);
    }
  };

  // Expense & Spend Management State (Backend Persisted & Local Cache Synced)
  const [expensesList, setExpensesList] = useState<Array<{
    id: string;
    title: string;
    category: string;
    amount: number;
    date: string;
    building: string;
    notes?: string;
    createdBy?: string;
    createdAt: string;
  }>>(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("shripad_cached_expenses");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) return parsed;
        } catch {}
      }
    }
    return [];
  });
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expTitle, setExpTitle] = useState("");
  const [expCategory, setExpCategory] = useState<string>("maintenance");
  const [customCategoryInput, setCustomCategoryInput] = useState("");
  const [isCustomCategorySelected, setIsCustomCategorySelected] = useState(false);
  const [expAmount, setExpAmount] = useState("");
  const [expDate, setExpDate] = useState(new Date().toISOString().substring(0, 10));
  const [expBuilding, setExpBuilding] = useState("PG A");
  const [expNotes, setExpNotes] = useState("");
  const [editingExpId, setEditingExpId] = useState<string | null>(null);

  // Derived list of unique custom categories added by admin
  const customCategoriesList = useMemo(() => {
    const presets = ["electricity", "food", "maintenance", "salaries", "rent_lease", "wifi_utilities", "other"];
    const set = new Set<string>();
    expensesList.forEach((e) => {
      if (e.category && !presets.includes(e.category.toLowerCase())) {
        set.add(e.category);
      }
    });
    return Array.from(set);
  }, [expensesList]);

  const fetchExpenses = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/expenses`);
      const data = await res.json();
      if (data.success && Array.isArray(data.expenses)) {
        setExpensesList(data.expenses);
        if (typeof window !== "undefined") {
          localStorage.setItem("shripad_cached_expenses", JSON.stringify(data.expenses));
        }
      }
    } catch (err) {
      console.error("Failed to fetch expenses:", err);
    }
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expTitle.trim() || !expAmount) return;

    const finalCategory = (isCustomCategorySelected && customCategoryInput.trim())
      ? customCategoryInput.trim()
      : expCategory;

    const payload = {
      title: expTitle.trim(),
      category: finalCategory,
      amount: Number(expAmount),
      date: expDate,
      building: expBuilding,
      notes: expNotes.trim(),
      createdBy: activeStaffMember?.name || "Master Admin",
    };

    try {
      if (editingExpId) {
        const res = await fetch(`${API_BASE_URL}/api/expenses/${editingExpId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.expenses)) {
          setExpensesList(data.expenses);
        }
      } else {
        const res = await fetch(`${API_BASE_URL}/api/expenses`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.expenses)) {
          setExpensesList(data.expenses);
        }
      }
      setIsExpenseModalOpen(false);
      resetExpenseForm();
    } catch (err) {
      console.error("Failed to save expense:", err);
    }
  };

  const handleDeleteExpense = (id: string, title: string) => {
    setConfirmModalState({
      isOpen: true,
      title: "Delete Expense",
      message: `Are you sure you want to delete expense record "${title}"?`,
      confirmText: "Delete Expense",
      cancelText: "Cancel",
      type: "danger",
      onConfirm: async () => {
        let updated: any[] = [];
        try {
          const res = await fetch(`${API_BASE_URL}/api/expenses/${id}`, { method: "DELETE" });
          const data = await res.json();
          if (data.success && Array.isArray(data.expenses)) {
            updated = data.expenses;
            setExpensesList(updated);
            if (typeof window !== "undefined") {
              localStorage.setItem("shripad_cached_expenses", JSON.stringify(updated));
            }
            showToast("Expense record deleted!", "success");
            return;
          }
        } catch (err) {
          console.warn("Failed to delete expense:", err);
        }
        setExpensesList((prev) => {
          updated = prev.filter((e) => e.id !== id);
          if (typeof window !== "undefined") {
            localStorage.setItem("shripad_cached_expenses", JSON.stringify(updated));
          }
          return updated;
        });
        showToast("Expense record deleted!", "success");
      },
    });
  };

  const resetExpenseForm = () => {
    setExpTitle("");
    setExpCategory("maintenance");
    setCustomCategoryInput("");
    setIsCustomCategorySelected(false);
    setExpAmount("");
    setExpDate(new Date().toISOString().substring(0, 10));
    setExpBuilding(scopedBuildingsList[0]?.name || "PG A");
    setExpNotes("");
    setEditingExpId(null);
  };

  useEffect(() => {
    fetchStaff();
    fetchSettings();
    fetchExpenses();
  }, []);

  useEffect(() => {
    if (isStaffMode) {
      const savedStaffId = localStorage.getItem("shripad_staff_id");
      if (savedStaffId && staffList.some((s) => s.id === savedStaffId)) {
        setActiveStaffScopeId(savedStaffId);
      } else {
        const staffMember = staffList.find((s) => s.role !== "super_admin") || staffList[1] || staffList[0];
        if (staffMember) {
          setActiveStaffScopeId(staffMember.id);
        }
      }
    }
  }, [isStaffMode, staffList]);

  const activeStaffMember = useMemo(() => {
    if (isStaffMode) {
      const sessionStr = localStorage.getItem("shripad_staff_session");
      if (sessionStr) {
        try {
          const parsed = JSON.parse(sessionStr);
          if (parsed && parsed.staffId) {
            const found = staffList.find((s) => s.id === parsed.staffId);
            if (found) return found;
          }
          if (parsed && parsed.assignedBuildings) {
            return {
              id: parsed.staffId || "staff_ramesh",
              name: parsed.name || "Ramesh Kumar",
              phone: "9812345678",
              email: parsed.email || "ramesh@shripadpg.com",
              role: parsed.role || "building_manager",
              assignedBuildings: parsed.assignedBuildings || ["PG A"],
              status: "active",
              createdAt: "",
            };
          }
        } catch {}
      }

      const activeScope = staffList.find((s) => s.id === activeStaffScopeId && s.role !== "super_admin");
      if (activeScope) return activeScope;

      const nonSuper = staffList.find((s) => s.role !== "super_admin");
      if (nonSuper) return nonSuper;

      return {
        id: "staff_ramesh",
        name: "Ramesh Kumar",
        phone: "9812345678",
        email: "ramesh@shripadpg.com",
        role: "building_manager",
        assignedBuildings: ["PG A"],
        status: "active",
        createdAt: "",
      };
    }

    return staffList.find((s) => s.id === activeStaffScopeId) || staffList[0];
  }, [staffList, activeStaffScopeId, isStaffMode]);

  const scopedBuildingsList = useMemo(() => {
    if (!isStaffMode) {
      if (!activeStaffMember || activeStaffMember.assignedBuildings.includes("ALL")) {
        return buildingsList;
      }
      return buildingsList.filter((b) => activeStaffMember.assignedBuildings.includes(b.name));
    }
    if (activeStaffMember && activeStaffMember.assignedBuildings) {
      if (activeStaffMember.assignedBuildings.includes("ALL")) {
        return buildingsList;
      }
      return buildingsList.filter((b) =>
        activeStaffMember.assignedBuildings.some(
          (ab: string) => ab.toLowerCase().trim() === b.name.toLowerCase().trim()
        )
      );
    }
    return buildingsList.filter((b) => b.name === "PG A");
  }, [buildingsList, activeStaffMember, isStaffMode]);

  const handleSaveStaffMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffEmail.trim()) return;

    const payload: any = {
      name: newStaffName.trim(),
      phone: newStaffPhone.trim(),
      email: newStaffEmail.trim(),
      role: newStaffRole,
      assignedBuildings: newStaffAssignedBuildings.length > 0 ? newStaffAssignedBuildings : ["PG A"],
      status: "active",
    };

    if (newStaffPassword.trim()) {
      payload.password = newStaffPassword.trim();
    }

    try {
      if (editingStaffId) {
        const res = await fetch(`${API_BASE_URL}/api/staff/${editingStaffId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.staff)) {
          setStaffList(data.staff);
        }
      } else {
        const res = await fetch(`${API_BASE_URL}/api/staff`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.staff)) {
          setStaffList(data.staff);
        }
      }
    } catch (err) {
      console.error("Error saving staff member:", err);
    }

    setNewStaffName("");
    setNewStaffPhone("");
    setNewStaffEmail("");
    setNewStaffPassword("");
    setNewStaffRole("building_manager");
    setNewStaffAssignedBuildings(["PG A"]);
    setEditingStaffId(null);
  };

  const handleDeleteStaffMember = (id: string, name: string) => {
    setConfirmModalState({
      isOpen: true,
      title: "Remove Staff Member",
      message: `Are you sure you want to remove staff member "${name}"?`,
      confirmText: "Remove Staff",
      cancelText: "Cancel",
      type: "danger",
      onConfirm: async () => {
        let updated: any[] = [];
        try {
          const res = await fetch(`${API_BASE_URL}/api/staff/${id}`, { method: "DELETE" });
          const data = await res.json();
          if (data.success && Array.isArray(data.staff)) {
            updated = data.staff;
            setStaffList(updated);
            if (typeof window !== "undefined") {
              localStorage.setItem("shripad_cached_staff", JSON.stringify(updated));
            }
            showToast(`Staff member "${name}" removed!`, "success");
            return;
          }
        } catch (err) {
          console.warn("Error deleting staff member:", err);
        }
        setStaffList((prev) => {
          updated = prev.filter((s) => s.id !== id);
          if (typeof window !== "undefined") {
            localStorage.setItem("shripad_cached_staff", JSON.stringify(updated));
          }
          return updated;
        });
        showToast(`Staff member "${name}" removed!`, "success");
      },
    });
  };

  const [isAddBuildingModalOpen, setIsAddBuildingModalOpen] = useState(false);
  const [newBuildingName, setNewBuildingName] = useState("");
  const [newBuildingFloors, setNewBuildingFloors] = useState<number>(4);
  const [newBuildingRoomsPerFloor, setNewBuildingRoomsPerFloor] = useState<number>(4);
  const [newFloorRoomCounts, setNewFloorRoomCounts] = useState<Record<number, number>>({});

  // Helper functions for floor-wise custom room counts & ground floor exclusion
  const isGroundFloorExcluded = (
    b: { floorRoomCounts?: Record<number, number> }
  ) => {
    return Boolean(b.floorRoomCounts && b.floorRoomCounts[0] === 0);
  };

  const getBuildingFloorIndices = (
    b: { floors: number; roomsPerFloor: number; floorRoomCounts?: Record<number, number> }
  ) => {
    const gfExcluded = isGroundFloorExcluded(b);
    const maxFl = gfExcluded ? b.floors : Math.max(0, b.floors - 1);
    const indices: number[] = [];
    for (let i = 0; i <= maxFl; i++) {
      indices.push(i);
    }
    return indices;
  };

  const getOrdinalSuffix = (num: number) => {
    const j = num % 10, k = num % 100;
    if (j === 1 && k !== 11) return "st";
    if (j === 2 && k !== 12) return "nd";
    if (j === 3 && k !== 13) return "rd";
    return "th";
  };

  const getFloorRoomCount = (
    b: { floors: number; roomsPerFloor: number; floorRoomCounts?: Record<number, number> },
    flIdx: number
  ) => {
    if (b.floorRoomCounts && b.floorRoomCounts[flIdx] !== undefined) {
      return b.floorRoomCounts[flIdx];
    }
    return b.roomsPerFloor;
  };

  const getTotalRoomsForBuilding = (
    b: { floors: number; roomsPerFloor: number; floorRoomCounts?: Record<number, number> }
  ) => {
    let sum = 0;
    const indices = getBuildingFloorIndices(b);
    for (const f of indices) {
      sum += getFloorRoomCount(b, f);
    }
    return sum;
  };

  const handleAddBuilding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newBuildingName.trim()) {
      const formatted = newBuildingName.trim().toUpperCase().startsWith("PG")
        ? newBuildingName.trim()
        : `PG ${newBuildingName.trim()}`;

      const payload = {
        name: formatted,
        floors: Number(newBuildingFloors) || 1,
        roomsPerFloor: Number(newBuildingRoomsPerFloor) || 1,
        floorRoomCounts: { ...newFloorRoomCounts },
      };

      try {
        const res = await fetch(`${API_BASE_URL}/api/buildings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.buildings)) {
          setBuildingsList(data.buildings);
          localStorage.setItem("shripad_cached_buildings", JSON.stringify(data.buildings));
        } else {
          setBuildingsList((prev) => {
            const updated = [...prev.filter((b) => b.name !== formatted), payload];
            localStorage.setItem("shripad_cached_buildings", JSON.stringify(updated));
            return updated;
          });
        }
      } catch (err) {
        console.error("Failed to persist building to backend:", err);
        setBuildingsList((prev) => {
          const updated = [...prev.filter((b) => b.name !== formatted), payload];
          localStorage.setItem("shripad_cached_buildings", JSON.stringify(updated));
          return updated;
        });
      }

      setBmsBuilding(formatted);
      setNewCustomerBuilding(formatted);
      setNewBuildingName("");
      setNewBuildingFloors(4);
      setNewBuildingRoomsPerFloor(4);
      setNewFloorRoomCounts({});
      setIsAddBuildingModalOpen(false);
    }
  };

  // Edit Building State
  const [editingBuilding, setEditingBuilding] = useState<{
    originalName: string;
    name: string;
    floors: number;
    roomsPerFloor: number;
    floorRoomCounts?: Record<number, number>;
  } | null>(null);

  // Accordion Floors state for Building Cards
  const [expandedBuildingFloors, setExpandedBuildingFloors] = useState<Record<string, boolean>>({});
  const toggleBuildingAccordion = (buildingName: string) => {
    setExpandedBuildingFloors((prev) => ({ ...prev, [buildingName]: !prev[buildingName] }));
  };

  // Edit Customer State
  const [editingCustomer, setEditingCustomer] = useState<any>(null);

  // BookMyShow Style Occupancy Explorer Modal State
  const [occupancyExplorerModal, setOccupancyExplorerModal] = useState<{
    isOpen: boolean;
    mode: "occupied" | "unoccupied";
    selectedBuilding: string;
  } | null>(null);

  const [selectedRoomDetails, setSelectedRoomDetails] = useState<{
    roomNo: string;
    building: string;
    floor: string;
    residentName?: string;
    phone?: string;
    bed?: string;
  } | null>(null);

  // Delete Building Handler (Custom Modern Confirm Modal & Local Cache Sync)
  const handleDeleteBuilding = (buildingName: string) => {
    setConfirmModalState({
      isOpen: true,
      title: "Delete Building",
      message: `Are you sure you want to delete building "${buildingName}"?`,
      confirmText: "Delete Building",
      cancelText: "Cancel",
      type: "danger",
      onConfirm: async () => {
        let updated: any[] = [];
        try {
          const res = await fetch(`${API_BASE_URL}/api/buildings/${encodeURIComponent(buildingName)}`, {
            method: "DELETE",
          });
          if (res.ok) {
            const data = await res.json();
            if (data.success && Array.isArray(data.buildings)) {
              updated = data.buildings;
              setBuildingsList(updated);
              if (typeof window !== "undefined") {
                localStorage.setItem("shripad_cached_buildings", JSON.stringify(updated));
              }
              showToast(`Building "${buildingName}" deleted permanently!`, "success");
              return;
            }
          }
        } catch (err: any) {
          console.warn("Backend API offline, deleting building in client state:", err);
        }
        setBuildingsList((prev) => {
          updated = prev.filter((b) => b.name !== buildingName);
          if (typeof window !== "undefined") {
            localStorage.setItem("shripad_cached_buildings", JSON.stringify(updated));
          }
          return updated;
        });
        showToast(`Building "${buildingName}" deleted successfully!`, "success");
      },
    });
  };

  // Update Building Handler (Backend Persisted)
  const handleUpdateBuilding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBuilding && editingBuilding.name.trim()) {
      const origName = editingBuilding.originalName;
      const updatedPayload = {
        name: editingBuilding.name.trim(),
        floors: Number(editingBuilding.floors),
        roomsPerFloor: Number(editingBuilding.roomsPerFloor),
        floorRoomCounts: editingBuilding.floorRoomCounts || {},
      };

      try {
        const res = await fetch(`${API_BASE_URL}/api/buildings/${encodeURIComponent(origName)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedPayload),
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.buildings)) {
          setBuildingsList(data.buildings);
        } else {
          setBuildingsList((prev) =>
            prev.map((b) => (b.name === origName ? { ...b, ...updatedPayload } : b))
          );
        }
      } catch (err) {
        console.error("Failed to update building in backend:", err);
        setBuildingsList((prev) =>
          prev.map((b) => (b.name === origName ? { ...b, ...updatedPayload } : b))
        );
      }

      setEditingBuilding(null);
    }
  };

  // Delete Customer Handler
  const handleDeleteCustomer = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmModalState({
      isOpen: true,
      title: "Delete Resident Record",
      message: `Are you sure you want to delete customer "${name}"?`,
      confirmText: "Delete Resident",
      cancelText: "Cancel",
      type: "danger",
      onConfirm: async () => {
        let updated: any[] = [];
        try {
          const res = await fetch(`${API_BASE_URL}/api/bookings/${id}`, { method: "DELETE" });
          const data = await res.json();
          if (data.success && Array.isArray(data.bookings)) {
            updated = data.bookings;
            setBookings(updated);
            if (typeof window !== "undefined") {
              localStorage.setItem("shripad_cached_bookings", JSON.stringify(updated));
            }
            showToast(`Customer "${name}" deleted!`, "success");
            return;
          }
        } catch (err) {
          console.warn("Failed to delete customer:", err);
        }
        setBookings((prev) => {
          updated = prev.filter((b) => b.id !== id);
          if (typeof window !== "undefined") {
            localStorage.setItem("shripad_cached_bookings", JSON.stringify(updated));
          }
          return updated;
        });
        showToast(`Customer "${name}" deleted!`, "success");
      },
    });
  };

  // Update Customer Handler
  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/bookings/${editingCustomer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingCustomer),
      });
      const data = await res.json();
      if (data.success && data.booking) {
        setBookings((prev) => prev.map((b) => (b.id === editingCustomer.id ? data.booking : b)));
        setEditingCustomer(null);
      }
    } catch (err) {
      console.error("Failed to update customer:", err);
    }
  };

  // Deallocate Customer Handler
  const handleDeallocateCustomer = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmModalState({
      isOpen: true,
      title: "Remove Room Allocation",
      message: `Are you sure you want to remove room allocation for "${name}"?`,
      confirmText: "Deallocate Room",
      cancelText: "Cancel",
      type: "warning",
      onConfirm: async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/api/bookings/${id}/deallocate`, { method: "POST" });
          const data = await res.json();
          if (data.success && data.booking) {
            setBookings((prev) => {
              const updated = prev.map((b) => (b.id === id ? data.booking : b));
              if (typeof window !== "undefined") {
                localStorage.setItem("shripad_cached_bookings", JSON.stringify(updated));
              }
              return updated;
            });
            showToast(`Room allocation removed for "${name}"`, "success");
            return;
          }
        } catch (err) {
          console.warn("Failed to deallocate customer:", err);
        }
        setBookings((prev) => {
          const updated = prev.map((b) =>
            b.id === id ? { ...b, allocatedBuilding: "", allocatedFloor: null, allocatedRoom: "" } : b
          );
          if (typeof window !== "undefined") {
            localStorage.setItem("shripad_cached_bookings", JSON.stringify(updated));
          }
          return updated;
        });
        showToast(`Room allocation removed for "${name}"`, "success");
      },
    });
  };

  // BookMyShow-Style Interactive Layout Selection State
  const [bmsBuilding, setBmsBuilding] = useState("PG A");
  const [bmsFloor, setBmsFloor] = useState(1);
  const [bmsRoom, setBmsRoom] = useState("102");
  const [bmsBed, setBmsBed] = useState("Bed B");

  // Auto-adjust selected floor if building has 0 rooms on Ground Floor (Fault Tolerance)
  useEffect(() => {
    const bldObj = buildingsList.find((b) => b.name === bmsBuilding);
    if (bldObj) {
      const currentRoomCount = getFloorRoomCount(bldObj, bmsFloor);
      if (currentRoomCount === 0) {
        for (let f = 0; f < bldObj.floors; f++) {
          if (getFloorRoomCount(bldObj, f) > 0) {
            setBmsFloor(f);
            break;
          }
        }
      }
    }
  }, [bmsBuilding, buildingsList, bmsFloor]);

  // Dynamic Full-stack Bookings state & Local Cache Synced
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
  const [isSyncing, setIsSyncing] = useState(false);
  const [dashboardSourceFilter, setDashboardSourceFilter] = useState<"all" | "manual" | "online">("all");

  // Scoped Bookings helper matching staff building & creator in staff mode
  const scopedBookings = useMemo(() => {
    return (bookings || []).filter((b) => {
      if (isStaffMode && activeStaffMember) {
        const staffBuildings = activeStaffMember.assignedBuildings || [];
        if (staffBuildings.includes("ALL")) return true;

        const bld = (b.allocatedBuilding || b.building || "").trim().toLowerCase();
        const isAssignedBuilding = staffBuildings.some((sb: string) => {
          const cleanSb = sb.trim().toLowerCase();
          return cleanSb && (bld.includes(cleanSb) || cleanSb.includes(bld));
        });

        const isCreatedByStaff =
          (b.createdById && b.createdById === activeStaffMember.id) ||
          (b.createdBy && b.createdBy.toLowerCase() === activeStaffMember.name.toLowerCase());

        return isAssignedBuilding || isCreatedByStaff;
      }
      return true;
    });
  }, [bookings, isStaffMode, activeStaffMember]);

  // Scoped Expenses helper matching staff building in staff mode
  const scopedExpensesList = useMemo(() => {
    return (expensesList || []).filter((e) => {
      if (isStaffMode && activeStaffMember) {
        const staffBuildings = activeStaffMember.assignedBuildings || [];
        if (staffBuildings.includes("ALL")) return true;
        const bld = (e.building || "").trim().toLowerCase();
        return (
          bld === "all" ||
          staffBuildings.some((sb: string) => {
            const cleanSb = sb.trim().toLowerCase();
            return cleanSb && (bld.includes(cleanSb) || cleanSb.includes(bld));
          })
        );
      }
      return true;
    });
  }, [expensesList, isStaffMode, activeStaffMember]);

  const totalMonthlySpend = useMemo(() => {
    return scopedExpensesList.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  }, [scopedExpensesList]);

  const totalGrossRevenue = useMemo(() => {
    return scopedBookings.reduce((sum, b) => {
      if (Array.isArray(b.paymentHistory) && b.paymentHistory.length > 0) {
        const historySum = b.paymentHistory
          .filter((p: any) => p.status === "verified" || p.status === "completed" || !p.status)
          .reduce((pSum: number, p: any) => pSum + Number(p.amount || 0), 0);
        if (historySum > 0) return sum + historySum;
      }
      const p = Number(b.paidAmount || b.tokenAmount || b.advanceAmount || 0);
      return sum + p;
    }, 0);
  }, [scopedBookings]);

  const netProfit = useMemo(() => {
    return totalGrossRevenue - totalMonthlySpend;
  }, [totalGrossRevenue, totalMonthlySpend]);

  const totalSecurityDepositHeld = useMemo(() => {
    return scopedBookings.reduce((sum, b) => {
      if (b.depositStatus === "refunded") return sum;
      const amt = b.paidDepositAmount !== undefined
        ? Number(b.paidDepositAmount || 0)
        : (b.depositAmount !== undefined ? Number(b.depositAmount || 0) : 0);
      return sum + amt;
    }, 0);
  }, [scopedBookings]);

  // Computed pending payment verification requests across all bookings (scoped in staff mode)
  const pendingPaymentsList = useMemo(() => {
    const list: any[] = [];
    (scopedBookings || []).forEach((b) => {
      (b.paymentHistory || []).forEach((p: any) => {
        if (p.status === "submitted" || (!p.status && p.transactionId)) {
          list.push({
            bookingId: b.id,
            paymentId: p.id,
            residentName: b.name || "Resident",
            building: b.allocatedBuilding || b.building || "PG A",
            room: b.allocatedRoom || b.room || "",
            bed: b.allocatedBed || b.bed || "",
            amount: p.amount || 0,
            month: p.month || new Date().getMonth() + 1,
            year: p.year || new Date().getFullYear(),
            transactionId: p.transactionId || "",
            payerName: p.payerName || b.name || "",
            paymentDate: p.paymentDate || "",
            paymentMethod: p.paymentMethod || "UPI",
            submittedAt: p.submittedAt || "",
            status: p.status || "submitted",
          });
        }
      });
    });
    return list;
  }, [scopedBookings]);

  const pendingPaymentsCount = pendingPaymentsList.length;

  // Robust Helper to match allocated residents for a building + room
  const getAllocationsForRoom = (buildingName: string, roomNo: string) => {
    return bookings.filter((bk) => {
      // Must be allocated status
      const isAllocated = bk.status === "allocated" || bk.status?.toLowerCase() === "allocated";
      if (!isAllocated) return false;

      // Match building (check allocatedBuilding first, fallback to building)
      const bkBuilding = (bk.allocatedBuilding || bk.building || "").trim();
      const bldMatch = bkBuilding.toLowerCase() === buildingName.toLowerCase();
      if (!bldMatch) return false;

      // Match room (strip "Room " prefix if present, e.g. "Room 102" -> "102")
      const rawRoom = (bk.allocatedRoom || bk.room || "").toString().trim();
      const cleanBkRoom = rawRoom.replace(/^Room\s+/i, "").trim();
      const cleanTargetRoom = roomNo.replace(/^Room\s+/i, "").trim();

      return cleanBkRoom.toLowerCase() === cleanTargetRoom.toLowerCase();
    });
  };

  // Centralized Room & Bed Occupancy Pipeline (Supports 1-Sharing, 2-Sharing, 3-Sharing, 4-Sharing, 5-Sharing, 6-Sharing)
  const getRoomBedState = (buildingName: string, roomNo: string) => {
    const allocations = getAllocationsForRoom(buildingName, roomNo);
    const cleanRoom = (roomNo || "").toString().replace(/^Room\s+/i, "").trim();

    // Determine room sharing capacity: check custom setting, or infer from allocations, fallback to 2
    let capacity = customRoomSharing[`${buildingName}_${cleanRoom}`] || 2;

    // Expand capacity if there are existing bookings for Bed C, D, E, F, G, H, I, J, etc.
    allocations.forEach((bk) => {
      const bkBed = (bk.allocatedBed || bk.bed || "").toLowerCase();
      if (bkBed.includes("c") || bkBed.includes("3")) capacity = Math.max(capacity, 3);
      if (bkBed.includes("d") || bkBed.includes("4")) capacity = Math.max(capacity, 4);
      if (bkBed.includes("e") || bkBed.includes("5")) capacity = Math.max(capacity, 5);
      if (bkBed.includes("f") || bkBed.includes("6")) capacity = Math.max(capacity, 6);
      if (bkBed.includes("g") || bkBed.includes("7")) capacity = Math.max(capacity, 7);
      if (bkBed.includes("h") || bkBed.includes("8")) capacity = Math.max(capacity, 8);
      if (bkBed.includes("i") || bkBed.includes("9")) capacity = Math.max(capacity, 9);
      if (bkBed.includes("j") || bkBed.includes("10")) capacity = Math.max(capacity, 10);
    });

    const letterLabels = ["Bed A", "Bed B", "Bed C", "Bed D", "Bed E", "Bed F", "Bed G", "Bed H", "Bed I", "Bed J", "Bed K", "Bed L"];
    const bedNames = letterLabels.slice(0, Math.min(12, Math.max(1, capacity)));

    // Track used booking IDs to guarantee 100% no duplicate resident assignment
    const assignedIds = new Set<string>();

    const beds: {
      bedName: string;
      isOccupied: boolean;
      occupantName?: string;
      occupantPhone?: string;
      booking?: any;
    }[] = bedNames.map((bedName, bedIdx) => {
      const letter = String.fromCharCode(65 + bedIdx).toLowerCase(); // 'a', 'b', 'c', ...
      const numStr = (bedIdx + 1).toString(); // '1', '2', '3', ...

      // Match allocation for this bed
      const matchedAlloc = allocations.find((bk) => {
        if (assignedIds.has(bk.id)) return false;
        const bkBed = (bk.allocatedBed || bk.bed || "").toLowerCase().trim();

        // Exact match (e.g. "Bed A", "bed a", "a", "1", "Bed 1")
        if (bkBed === `bed ${letter}` || bkBed === letter || bkBed === `bed ${numStr}` || bkBed === numStr) {
          return true;
        }
        // First bed fallback if bed string doesn't specify letter
        if (bedIdx === 0 && (!bkBed || bkBed === "a" || bkBed.includes("a") || bkBed.includes("1"))) {
          return true;
        }
        // Substring match
        if (bkBed.includes(`bed ${letter}`) || bkBed.includes(`bed ${numStr}`) || bkBed.endsWith(letter) || bkBed.endsWith(numStr)) {
          return true;
        }
        return false;
      });

      if (matchedAlloc) {
        assignedIds.add(matchedAlloc.id);
      }

      return {
        bedName,
        isOccupied: !!matchedAlloc,
        occupantName: matchedAlloc ? matchedAlloc.name : undefined,
        occupantPhone: matchedAlloc ? matchedAlloc.phone : undefined,
        booking: matchedAlloc || undefined,
      };
    });

    const occupiedCount = beds.filter((b) => b.isOccupied).length;
    const freeCount = Math.max(0, capacity - occupiedCount);
    const isFull = freeCount === 0;
    const isVacant = occupiedCount === 0;
    const isPartiallyOccupied = occupiedCount > 0 && freeCount > 0;

    let freeBedsLabel = `${freeCount}/${capacity} Free`;
    if (isVacant) {
      freeBedsLabel = `${capacity}/${capacity} Free 🟢`;
    } else if (isPartiallyOccupied) {
      const freeBeds = beds.filter((b) => !b.isOccupied).map((b) => b.bedName.replace("Bed ", ""));
      freeBedsLabel = `${freeBeds.join(", ")} Free 🟢`;
    } else {
      freeBedsLabel = "Full 🔴";
    }

    return {
      building: buildingName,
      roomNo,
      allocations,
      beds,
      capacity,
      occupiedCount,
      freeCount,
      isFull,
      isVacant,
      isPartiallyOccupied,
      freeBedsLabel,
    };
  };

  // Unified Building Occupancy Calculation helper (Guarantees 100% data sync between Cards, Modal Pills, and Seat Grid Boxes)
  const getBuildingOccupancyDetails = (bldName: string) => {
    const bldObj = buildingsList.find((b) => b.name === bldName) || { floors: 4, roomsPerFloor: 4 };
    let totalRooms = 0;
    let fullyOccupiedRoomsCount = 0;
    let partiallyOccupiedRoomsCount = 0;
    let fullyVacantRoomsCount = 0;

    let totalBeds = 0;
    let occupiedBedsCount = 0;
    let vacantBedsCount = 0;

    for (let f = 0; f < bldObj.floors; f++) {
      const rCount = getFloorRoomCount(bldObj, f);
      totalRooms += rCount;

      for (let r = 1; r <= rCount; r++) {
        const rNo = f === 0 ? `G${r.toString().padStart(2, "0")}` : `${f}${r.toString().padStart(2, "0")}`;
        const rmState = getRoomBedState(bldName, rNo);

        totalBeds += rmState.capacity;
        occupiedBedsCount += rmState.occupiedCount;
        vacantBedsCount += rmState.freeCount;

        if (rmState.isVacant) {
          fullyVacantRoomsCount++;
        } else if (rmState.isPartiallyOccupied) {
          partiallyOccupiedRoomsCount++;
        } else {
          fullyOccupiedRoomsCount++;
        }
      }
    }

    // Available / Vacant Rooms = Rooms with at least 1 free bed
    const availableRoomsCount = fullyVacantRoomsCount + partiallyOccupiedRoomsCount;
    // Occupied Rooms = Rooms with at least 1 resident allocated
    const occupiedRoomsCount = fullyOccupiedRoomsCount + partiallyOccupiedRoomsCount;

    return {
      totalRooms,
      totalBeds,
      fullyOccupiedRoomsCount,
      partiallyOccupiedRoomsCount,
      fullyVacantRoomsCount,
      availableRoomsCount,
      occupiedRoomsCount,
      occupiedBedsCount,
      vacantBedsCount,
    };
  };

  // Overall Occupancy Stats across all buildings
  const overallOccupancyStats = useMemo(() => {
    let totalOccBeds = 0;
    let totalVacBeds = 0;
    let totalAvailRooms = 0;
    let totalOccRooms = 0;

    scopedBuildingsList.forEach((bld) => {
      const stats = getBuildingOccupancyDetails(bld.name);
      totalOccBeds += stats.occupiedBedsCount;
      totalVacBeds += stats.vacantBedsCount;
      totalAvailRooms += stats.availableRoomsCount;
      totalOccRooms += stats.occupiedRoomsCount;
    });

    return {
      totalOccBeds,
      totalVacBeds,
      totalAvailRooms,
      totalOccRooms,
      totalOcc: totalOccRooms,
      totalUnocc: totalAvailRooms,
    };
  }, [scopedBuildingsList, bookings]);

  // Centralized Aggregated Complaints across all residents in scoped buildings
  const allComplaintsList = useMemo(() => {
    const list: {
      bookingId: string;
      residentName: string;
      residentPhone: string;
      building: string;
      room: string;
      bed: string;
      complaint: any;
    }[] = [];

    scopedBookings.forEach((b) => {
      (b.complaintHistory || []).forEach((c: any) => {
        list.push({
          bookingId: b.id,
          residentName: b.name || "Resident",
          residentPhone: b.phone || "",
          building: b.allocatedBuilding || b.building || "PG A",
          room: b.allocatedRoom || b.room || "Unallocated",
          bed: b.allocatedBed || b.bed || "Unallocated",
          complaint: c,
        });
      });
    });

    return list.sort((a, b) => {
      const timeA = new Date(a.complaint.createdAt || a.complaint.timestamp || 0).getTime();
      const timeB = new Date(b.complaint.createdAt || b.complaint.timestamp || 0).getTime();
      return timeB - timeA;
    });
  }, [scopedBookings]);

  const activeComplaintsCount = useMemo(() => {
    return allComplaintsList.filter(
      (item) => !item.complaint.status || item.complaint.status === "pending" || item.complaint.status === "in_progress"
    ).length;
  }, [allComplaintsList]);

  const handleUpdateComplaintStatus = async (
    bookingId: string,
    complaintId: string,
    newStatus: "pending" | "in_progress" | "resolved",
    adminComment?: string
  ) => {
    // 1. Update React state immediately
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id !== bookingId) return b;
        const history = b.complaintHistory || [];
        const updatedHistory = history.map((c: any) =>
          (c.id || c.title) === (complaintId || c.title)
            ? {
                ...c,
                status: newStatus,
                adminComment: adminComment !== undefined ? adminComment : c.adminComment,
                resolvedAt: newStatus === "resolved" ? new Date().toISOString() : c.resolvedAt,
              }
            : c
        );
        return { ...b, complaintHistory: updatedHistory };
      })
    );

    // If viewing resident profile modal, update selectedHistoryResident
    if (selectedHistoryResident && selectedHistoryResident.id === bookingId) {
      setSelectedHistoryResident((prev: any) => {
        if (!prev) return prev;
        const history = prev.complaintHistory || [];
        const updatedHistory = history.map((c: any) =>
          (c.id || c.title) === (complaintId || c.title)
            ? {
                ...c,
                status: newStatus,
                adminComment: adminComment !== undefined ? adminComment : c.adminComment,
                resolvedAt: newStatus === "resolved" ? new Date().toISOString() : c.resolvedAt,
              }
            : c
        );
        return { ...prev, complaintHistory: updatedHistory };
      });
    }

    // 2. Update LocalStorage
    try {
      const localStr = localStorage.getItem("shripad_admin_bookings");
      if (localStr) {
        const list = JSON.parse(localStr);
        const updatedList = list.map((b: any) => {
          if (b.id !== bookingId) return b;
          const history = b.complaintHistory || [];
          const updatedHistory = history.map((c: any) =>
            (c.id || c.title) === (complaintId || c.title)
              ? {
                  ...c,
                  status: newStatus,
                  adminComment: adminComment !== undefined ? adminComment : c.adminComment,
                  resolvedAt: newStatus === "resolved" ? new Date().toISOString() : c.resolvedAt,
                }
              : c
          );
          return { ...b, complaintHistory: updatedHistory };
        });
        localStorage.setItem("shripad_admin_bookings", JSON.stringify(updatedList));
      }
    } catch (e) {
      console.error("LocalStorage complaint update error:", e);
    }

    // 3. Send to backend API
    try {
      await fetch(`${API_BASE_URL}/api/bookings/${bookingId}/complaints/${complaintId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, adminComment }),
      });
      showToast(`Complaint status updated to ${newStatus.replace("_", " ")}!`, "success");
    } catch (err) {
      console.warn("Backend complaint status sync notice:", err);
      showToast(`Complaint status updated locally.`, "info");
    }
  };

  // WhatsApp Automation Engine Helpers
  const fetchWhatsAppStatus = async () => {
    setIsCheckingWhatsApp(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/whatsapp/status`);
      const data = await res.json();
      if (data.success) {
        setWhatsappStatus({
          connected: data.connected,
          status: data.status,
          phone: data.phone || null,
          pushName: data.pushName || null,
          sessionId: data.sessionId || null,
        });
        if (!data.connected) {
          fetchWhatsAppQr();
        } else {
          setWhatsappQrCode(null);
        }
      }
    } catch (err) {
      setWhatsappStatus({ connected: false, status: "OFFLINE" });
    } finally {
      setIsCheckingWhatsApp(false);
    }
  };

  const fetchWhatsAppQr = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/whatsapp/qr`);
      const data = await res.json();
      if (data.success && data.qr) {
        setWhatsappQrCode(data.qr);
      }
    } catch (err) {
      console.warn("QR fetch notice:", err);
    }
  };

  const handleStartWhatsAppSession = async () => {
    try {
      showToast("Starting WhatsApp Baileys session...", "info");
      const res = await fetch(`${API_BASE_URL}/api/whatsapp/start`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        showToast("Session initialized. Fetching QR code...", "success");
        setTimeout(fetchWhatsAppStatus, 1500);
      } else {
        showToast(data.message || "Failed to start session.", "error");
      }
    } catch (err: any) {
      showToast("WhatsApp service currently offline. Run OpenWA locally or check connection.", "error");
    }
  };

  const handleSendWhatsAppTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waTestPhone.trim() || !waTestMessage.trim()) {
      showToast("Please enter a valid phone number and message.", "error");
      return;
    }
    setIsSendingWaTest(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/whatsapp/send-text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: waTestPhone.trim(), message: waTestMessage.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Test WhatsApp message dispatched successfully! 🚀", "success");
      } else {
        showToast(data.message || "Failed to send test message.", "error");
      }
    } catch (err: any) {
      showToast("WhatsApp API error: " + err.message, "error");
    } finally {
      setIsSendingWaTest(false);
    }
  };

  const fetchWhatsAppTemplates = async () => {
    setIsLoadingWaTemplates(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/whatsapp/templates`);
      const data = await res.json();
      if (data.success && data.templates) {
        setWaTemplates(data.templates);
      }
    } catch (err) {
      console.warn("Failed to fetch WhatsApp templates:", err);
    } finally {
      setIsLoadingWaTemplates(false);
    }
  };

  const handleSaveWhatsAppTemplates = async () => {
    if (!waTemplates) return;
    setIsSavingWaTemplates(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/whatsapp/templates`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(waTemplates),
      });
      const data = await res.json();
      if (data.success) {
        setWaTemplates(data.templates);
        showToast("WhatsApp templates & Chatbot saved successfully! ✨", "success");
      } else {
        showToast(data.message || "Failed to save templates.", "error");
      }
    } catch (err: any) {
      showToast("Error saving templates: " + err.message, "error");
    } finally {
      setIsSavingWaTemplates(false);
    }
  };

  const handleResetWhatsAppTemplates = async () => {
    if (!confirm("Are you sure you want to reset all WhatsApp templates and chatbot locations to system defaults?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/whatsapp/templates/reset`, { method: "POST" });
      const data = await res.json();
      if (data.success && data.templates) {
        setWaTemplates(data.templates);
        showToast("Templates reset to system defaults! 🔄", "success");
      }
    } catch (err: any) {
      showToast("Error resetting templates: " + err.message, "error");
    }
  };

  const handleSaveBranch = async (branchData: typeof editingBranch) => {
    if (!branchData || !waTemplates) return;
    let currentLocations = [...(waTemplates.chatbotLocations || [])];
    const existingIndex = currentLocations.findIndex((b) => b.id === branchData.id);
    if (existingIndex >= 0) {
      currentLocations[existingIndex] = branchData;
    } else {
      currentLocations.push({ ...branchData, id: branchData.id || String(Date.now()) });
    }
    const updated = { ...waTemplates, chatbotLocations: currentLocations };
    setWaTemplates(updated);
    setIsBranchModalOpen(false);
    setEditingBranch(null);

    // Auto-sync immediately to backend
    try {
      const res = await fetch(`${API_BASE_URL}/api/whatsapp/templates`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      const data = await res.json();
      if (data.success && data.templates) {
        setWaTemplates(data.templates);
        showToast(`Branch "${branchData.name}" saved and synced! ✨`, "success");
      }
    } catch {
      showToast(`Branch "${branchData.name}" updated. Click "Save All Changes" to retry sync.`, "info");
    }
  };

  const handleDeleteBranch = async (branchId: string) => {
    if (!waTemplates) return;
    const branchToDelete = waTemplates.chatbotLocations?.find((b) => b.id === branchId);
    const currentLocations = (waTemplates.chatbotLocations || []).filter((b) => b.id !== branchId);
    const updated = { ...waTemplates, chatbotLocations: currentLocations };
    setWaTemplates(updated);

    // Auto-sync immediately to backend database
    try {
      const res = await fetch(`${API_BASE_URL}/api/whatsapp/templates`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      const data = await res.json();
      if (data.success && data.templates) {
        setWaTemplates(data.templates);
        showToast(`Branch "${branchToDelete?.name || ''}" deleted successfully! 🗑️`, "success");
      }
    } catch {
      showToast("Branch removed locally. Click 'Save All Changes' to retry sync.", "info");
    }
  };

  // Immediate WhatsApp status fetch on mount + 10s heartbeat poll to ensure navbar indicator is 100% accurate at all times
  useEffect(() => {
    fetchWhatsAppStatus();
    const interval = setInterval(fetchWhatsAppStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/bookings`);
      const data = await res.json();
      if (data.success && Array.isArray(data.bookings)) {
        setBookings(data.bookings);
        if (typeof window !== "undefined") {
          localStorage.setItem("shripad_cached_bookings", JSON.stringify(data.bookings));
        }
      }
    } catch (err) {
      console.error("Failed to fetch bookings:", err);
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/bookings/sync`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setBookings(data.bookings);
        setFormSuccessMessage(`Sync complete. Loaded ${data.newlyAddedCount} new online bookings!`);
        setTimeout(() => setFormSuccessMessage(""), 3500);
      }
    } catch (err) {
      console.error("Manual sync failed:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePushAllToGoogleSheet = async () => {
    try {
      setIsSyncing(true);
      const res = await fetch(`${API_BASE_URL}/api/bookings/push-to-sheet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookUrl: googleSheetWebhookUrl }),
      });
      const data = await res.json();
      if (data.success) {
        setFormSuccessMessage(`🎉 ${data.message}`);
        setTimeout(() => setFormSuccessMessage(""), 4500);
      } else {
        setFormSuccessMessage(`⚠️ ${data.message || "Failed to push records"}`);
      }
    } catch (err: any) {
      console.error("Push to Google Sheet error:", err);
      setFormSuccessMessage(`❌ Failed to push: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchBookings();

    // 5000ms background polling to fetch new online bookings automatically
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/bookings/sync`, { method: "POST" });
        const data = await res.json();
        if (data.success && data.bookings) {
          setBookings(data.bookings);
        }
      } catch (err) {
        // Silent warning when offline or connecting to backend
        console.warn("Background auto-sync connecting:", err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getTimeFilteredBookings = () => {
    return scopedBookings.filter((b) => {
      if (customerTimeFilter === "24h") {
        const now = new Date();
        const bDate = new Date(b.timestamp.replace(/-/g, "/"));
        if (isNaN(bDate.getTime())) return true;
        const diffHours = (now.getTime() - bDate.getTime()) / (1000 * 60 * 60);
        return diffHours <= 24 || b.timestamp.includes("Today") || b.timestamp.includes("mins") || b.timestamp.includes("hours");
      }
      if (customerTimeFilter === "7d") {
        const now = new Date();
        const bDate = new Date(b.timestamp.replace(/-/g, "/"));
        if (isNaN(bDate.getTime())) return true;
        const diffDays = (now.getTime() - bDate.getTime()) / (1000 * 60 * 60 * 24);
        return diffDays <= 7;
      }
      if (customerTimeFilter === "1m") {
        const now = new Date();
        const bDate = new Date(b.timestamp.replace(/-/g, "/"));
        if (isNaN(bDate.getTime())) return true;
        const diffDays = (now.getTime() - bDate.getTime()) / (1000 * 60 * 60 * 24);
        return diffDays <= 30;
      }
      return true;
    });
  };

  const getFilteredBookings = () => {
    const base = getTimeFilteredBookings();
    if (dashboardSourceFilter !== "all") {
      return base.filter((b) => b.source === dashboardSourceFilter);
    }
    return base;
  };

  return (
    <div className="flex min-h-screen bg-slate-100/60 font-sans text-slate-800 selection:bg-brand-green selection:text-white relative overflow-x-hidden">
      {/* Subtle Ambient Background Gradients */}
      <div className="fixed top-0 left-64 w-96 h-96 bg-brand-green-light/30 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-emerald-100/40 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Mobile Drawer Overlay Backdrop */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/5 backdrop-blur-[1px] transition-opacity lg:hidden"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200/80 bg-white/95 backdrop-blur-xl px-5 sm:px-6 py-5 sm:py-6 shadow-xl lg:shadow-md transition-transform duration-300 ease-in-out overflow-y-auto scrollbar-none ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } ${isSidebarCollapsed ? "lg:-translate-x-full" : "lg:translate-x-0"}`}
      >
        {/* Top Header Name Logo */}
        <div className="mb-5 sm:mb-6 flex items-center justify-between relative w-full px-1 shrink-0">
          <ShripadNameLogo />
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 lg:hidden shadow-2xs cursor-pointer"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Curved Pill Navigation Items */}
        <nav className="flex-1 space-y-1.5 shrink-0">
          {[
            { name: "Dashboard", icon: LayoutDashboard },
            { name: "Revenue", icon: Wallet },
            { name: "Reports", icon: FileSpreadsheet },
            { name: "Invoice", icon: Receipt, badgeCount: pendingPaymentsCount },
          ].map((item) => {
            const isActive = activeTab === item.name;
            return (
              <button
                key={item.name}
                onClick={() => handleTabClick(item.name)}
                className={`group relative flex w-full items-center gap-3.5 rounded-full px-4.5 py-2.5 sm:py-3 text-xs sm:text-sm font-bold transition-all duration-300 ${isActive
                    ? "bg-brand-green text-white shadow-lg shadow-brand-green/30 translate-x-1"
                    : "text-slate-600 hover:bg-slate-100/90 hover:text-slate-900 hover:translate-x-1"
                  }`}
              >
                <item.icon
                  className={`h-4.5 w-4.5 sm:h-5 sm:w-5 transition-transform group-hover:scale-110 ${isActive ? "text-white" : "text-slate-500"
                    }`}
                />
                <span>{item.name}</span>
                {item.badgeCount && item.badgeCount > 0 ? (
                  <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-black text-white shadow-xs animate-bounce">
                    {item.badgeCount}
                  </span>
                ) : (
                  isActive && (
                    <span className="ml-auto h-2 w-2 rounded-full bg-white animate-pulse shadow-xs" />
                  )
                )}
              </button>
            );
          })}

          {/* Central Plus Create Button */}
          <div className="py-0.5">
            <button
              onClick={() => {
                setIsCreateModalOpen(true);
                setIsMobileMenuOpen(false);
              }}
              className="group relative flex w-full items-center gap-3.5 rounded-full px-4.5 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-100/90 hover:text-slate-900 hover:translate-x-1 transition-all duration-300 cursor-pointer"
            >
              <Plus className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-slate-500 transition-transform group-hover:scale-110 group-hover:rotate-90 duration-300" />
              <span>Create</span>
            </button>
          </div>

          {[
            { name: "Buildings", icon: Building2 },
            { name: "Customers", icon: Users },
            { name: "Allocation", icon: KeyRound },
          ].map((item) => {
            const isActive = activeTab === item.name;
            return (
              <button
                key={item.name}
                onClick={() => handleTabClick(item.name)}
                className={`group relative flex w-full items-center gap-3.5 rounded-full px-4.5 py-2.5 sm:py-3 text-xs sm:text-sm font-bold transition-all duration-300 ${isActive
                    ? "bg-brand-green text-white shadow-lg shadow-brand-green/30 translate-x-1"
                    : "text-slate-600 hover:bg-slate-100/90 hover:text-slate-900 hover:translate-x-1"
                  }`}
              >
                <item.icon
                  className={`h-4.5 w-4.5 sm:h-5 sm:w-5 transition-transform group-hover:scale-110 ${isActive ? "text-white" : "text-slate-500"
                    }`}
                />
                <span>{item.name}</span>
                {isActive && (
                  <span className="ml-auto h-2 w-2 rounded-full bg-white animate-pulse shadow-xs" />
                )}
              </button>
            );
          })}

          {/* Admin Management Actions in Sidebar (Uniform design matching other items) */}
          {!isStaffMode && (
            <div className="pt-1.5 border-t border-slate-100 space-y-1.5">
              <button
                onClick={() => {
                  setIsStaffModalOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className="group relative flex w-full items-center gap-3.5 rounded-full px-4.5 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-100/90 hover:text-slate-900 hover:translate-x-1 transition-all duration-300 cursor-pointer"
                title="Manage Staff & Building Assignments"
              >
                <UserCheck className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-slate-500 transition-transform group-hover:scale-110" />
                <span>Staff & Buildings</span>
              </button>

              <button
                onClick={() => {
                  setIsPaymentSettingsModalOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className="group relative flex w-full items-center gap-3.5 rounded-full px-4.5 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-100/90 hover:text-slate-900 hover:translate-x-1 transition-all duration-300 cursor-pointer"
                title="Configure Real Payment Details & QR Code"
              >
                <QrCode className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-slate-500 transition-transform group-hover:scale-110" />
                <span>Payment & QR</span>
              </button>
            </div>
          )}
        </nav>

        {/* Shripad PG Logo Showcase Footer (Fully visible & responsive) */}
        <div className="mt-4 mb-2 sm:mb-0 rounded-2xl bg-gradient-to-br from-brand-green-light/40 via-emerald-50/50 to-white p-3 border border-brand-green/20 text-center space-y-1.5 shadow-2xs shrink-0">
          <div className="mx-auto flex justify-center py-0.5">
            <img
              src={brandLogo}
              alt="Shripad PG Large Logo"
              className="h-14 sm:h-16 w-auto max-w-full object-contain transition-transform hover:scale-105 filter drop-shadow-xs"
            />
          </div>
          <div className="space-y-0.5">
            <p className="text-[11px] font-black text-brand-navy tracking-wide uppercase">
              SHRIPAD PG PORTAL
            </p>
            <p className="text-[9px] font-semibold text-slate-500 flex items-center justify-center gap-1">
              <ShieldCheck className="h-3 w-3 text-brand-green" /> Premium Living & Care
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`flex flex-1 flex-col transition-all duration-300 min-w-0 ${isSidebarCollapsed ? "lg:pl-0" : "lg:pl-72"}`}>
        {/* Centered top navigation bar wrapper aligning perfectly with main layout margins */}
        <div className="sticky top-2 sm:top-4 z-30 w-full px-2 sm:px-6 lg:px-8 mt-2 sm:mt-4 mb-2">
          <header className="mx-auto max-w-7xl rounded-full border border-slate-200/80 bg-white/95 shadow-lg shadow-slate-200/50 backdrop-blur-xl px-2.5 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-3 transition-all">
            {/* Left: Menu, Role Scope, WhatsApp & Complaints */}
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 flex-nowrap">
              <button
                onClick={() => {
                  if (window.innerWidth < 1024) {
                    setIsMobileMenuOpen(true);
                  } else {
                    setIsSidebarCollapsed(!isSidebarCollapsed);
                  }
                }}
                className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full border border-slate-200/80 bg-slate-50 text-slate-600 hover:bg-slate-100 shadow-2xs cursor-pointer active:scale-95"
                title="Toggle Sidebar Navigation"
              >
                <Menu className="h-4 w-4" />
              </button>

              {/* Staff / Building Scope Badge or Dropdown */}
              {!isStaffMode ? (
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100/90 border border-slate-200 text-xs font-bold text-slate-800">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span className="text-[10px] text-slate-400 uppercase font-black">Role Scope:</span>
                  <select
                    value={activeStaffScopeId}
                    onChange={(e) => {
                      setActiveStaffScopeId(e.target.value);
                      const selectedStaff = staffList.find((s) => s.id === e.target.value);
                      if (selectedStaff && selectedStaff.assignedBuildings && !selectedStaff.assignedBuildings.includes("ALL")) {
                        if (selectedStaff.assignedBuildings.length > 0 && selectedStaff.assignedBuildings[0]) {
                          setBmsBuilding(selectedStaff.assignedBuildings[0]);
                        }
                      }
                    }}
                    className="bg-transparent font-extrabold text-slate-900 outline-none cursor-pointer text-xs"
                  >
                    {staffList.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} ({st.assignedBuildings.includes("ALL") ? "All Buildings" : st.assignedBuildings.join(", ")})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span className="text-[10px] text-emerald-600 uppercase font-black">Staff Scope:</span>
                  <span className="font-extrabold text-xs text-emerald-950">
                    {activeStaffMember?.name} ({activeStaffMember?.assignedBuildings?.join(", ") || "PG A"})
                  </span>
                </div>
              )}

              {/* WhatsApp Baileys Automation Center Button */}
              <button
                onClick={() => {
                  setIsWhatsAppModalOpen(true);
                  fetchWhatsAppStatus();
                  fetchWhatsAppTemplates();
                }}
                className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-black transition cursor-pointer shadow-sm active:scale-95 border ${
                  whatsappStatus?.connected
                    ? "bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-700 shadow-emerald-600/20"
                    : whatsappStatus === null
                    ? "bg-emerald-50/80 text-emerald-900 border-emerald-200 hover:bg-emerald-100"
                    : "bg-amber-50 text-amber-950 border-amber-300 hover:bg-amber-100"
                }`}
                title={
                  whatsappStatus?.connected
                    ? `WhatsApp Multi-Device Baileys Online (${whatsappStatus.phone || "Active"})`
                    : "WhatsApp Automation Center (Offline / Scan QR to Connect)"
                }
              >
                <span className="text-xs">💬</span>
                <span className="text-[11px] sm:text-xs font-black">WhatsApp</span>
                <span
                  className={`h-2 w-2 rounded-full ${
                    whatsappStatus?.connected
                      ? "bg-white shadow-xs animate-pulse ring-2 ring-emerald-300/50"
                      : whatsappStatus === null
                      ? "bg-emerald-400 animate-pulse"
                      : "bg-amber-500"
                  }`}
                />
              </button>

              {/* Complaints Center Quick Access Notification Button */}
              <button
                onClick={() => setIsComplaintsHubModalOpen(true)}
                className={`relative flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-black transition cursor-pointer shadow-sm active:scale-95 border ${
                  activeComplaintsCount > 0
                    ? "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 animate-pulse"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                }`}
                title="Manage Resident Complaints & Service Requests"
              >
                <MessageSquare className={`h-3.5 w-3.5 ${activeComplaintsCount > 0 ? "text-rose-600" : "text-slate-500"}`} />
                <span className="hidden md:inline">Complaints</span>
                {activeComplaintsCount > 0 && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 text-[9px] font-black text-white px-1 shadow-xs">
                    {activeComplaintsCount}
                  </span>
                )}
              </button>
            </div>

            {/* Right: Curved Search Bar & Profile Dropdown */}
            <div className="flex items-center gap-3 flex-1 justify-end min-w-0">
              <div className="relative w-full max-w-xs hidden sm:block">
                <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search rooms, residents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-full border border-slate-200/80 bg-slate-50/70 pl-9 pr-10 py-1.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:border-brand-green focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/20 transition shadow-inner"
                />
                <kbd className="hidden md:inline-block absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full bg-white px-1.5 py-0.5 text-[9px] font-bold text-slate-400 border border-slate-200 shadow-2xs">
                  ⌘K
                </kbd>
              </div>

              {/* Profile Dropdown Container */}
              <div className="relative shrink-0">
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center gap-2.5 rounded-full border border-slate-200/80 bg-slate-50/80 hover:bg-slate-100/80 p-1.5 pr-3 shadow-2xs transition-all active:scale-95 cursor-pointer"
                >
                  <div className={`relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full ${isStaffMode ? "bg-emerald-600" : "bg-brand-green"} text-white font-black text-xs shadow-sm ring-2 ring-brand-green/20`}>
                    {isStaffMode ? activeStaffMember?.name?.charAt(0) || "S" : "S"}
                  </div>
                  <div className="hidden text-left md:block leading-tight">
                    <p className="text-xs font-bold text-slate-900">
                      {isStaffMode ? activeStaffMember?.name || "Staff Member" : "Shripad"}
                    </p>
                    <p className="text-[10px] font-semibold text-brand-green">
                      {isStaffMode ? (activeStaffMember?.role === "building_manager" ? "Building Manager" : "Caretaker") : "Admin"}
                    </p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isProfileMenuOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Profile Dropdown Menu */}
                {isProfileMenuOpen && (
                  <>
                    <div
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="fixed inset-0 z-40"
                    />
                    <div className="absolute right-0 top-12 z-50 w-64 rounded-3xl border border-slate-200/90 bg-white/95 backdrop-blur-xl p-2.5 shadow-2xl space-y-1 animate-in fade-in zoom-in-95">
                      {/* User info header */}
                      <div className="px-3.5 py-2.5 border-b border-slate-100 mb-1">
                        <p className="text-xs font-black text-slate-900">
                          {isStaffMode ? activeStaffMember?.name : "Shripad Admin"}
                        </p>
                        <p className="text-[11px] font-medium text-slate-500">
                          {isStaffMode ? activeStaffMember?.email : "shripadpglux@gmail.com"}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          <span className="rounded-full bg-brand-green-light px-2.5 py-0.5 text-[10px] font-extrabold text-brand-green border border-brand-green/20">
                            {isStaffMode
                              ? `🏢 ${activeStaffMember?.assignedBuildings?.join(", ") || "PG A"} Manager`
                              : "Super Admin"}
                          </span>
                        </div>
                      </div>

                      {/* Super Admin Only Menu Items */}
                      {!isStaffMode && (
                        <>
                          <button
                            onClick={() => {
                              setIsPaymentSettingsModalOpen(true);
                              setIsProfileMenuOpen(false);
                            }}
                            className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100/90 hover:text-slate-900 transition cursor-pointer"
                          >
                            <QrCode className="h-4 w-4 text-brand-green" />
                            <span>Payment & QR Settings</span>
                          </button>

                          <button
                            onClick={() => {
                              setActiveTab("Settings");
                              setIsProfileMenuOpen(false);
                            }}
                            className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100/90 hover:text-slate-900 transition"
                          >
                            <Settings className="h-4 w-4 text-slate-500" />
                            <span>Settings & Preferences</span>
                          </button>
                        </>
                      )}

                      {/* Staff Mode Security Notice */}
                      {isStaffMode && (
                        <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-[10px] font-semibold text-slate-500">
                          🔒 Credentials & Payment QR managed by Super Admin
                        </div>
                      )}

                      {/* Landing Page Item */}
                      <Link
                        to="/"
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100/90 hover:text-slate-900 transition"
                      >
                        <Home className="h-4 w-4 text-brand-green" />
                        <span>Visit Landing Page</span>
                      </Link>

                      {/* Logout Item */}
                      <div className="pt-1 border-t border-slate-100">
                        <button
                          onClick={() => {
                            setIsProfileMenuOpen(false);
                            handleAdminLogout();
                          }}
                          className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        >
                          <LogOut className="h-4 w-4 text-rose-500" />
                          <span>{isStaffMode ? "Log Out (Staff Portal)" : "Log Out"}</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </header>
        </div>

        {/* Dynamic Page Content Based on Active Tab */}
        <main className="flex-1 space-y-6 sm:space-y-7 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 max-w-7xl mx-auto w-full">
          {/* INVOICE TAB */}
          {activeTab === "Invoice" && (
            <InvoiceDesign
              residentsList={scopedBookings.map(normalizeResident)}
              initialResident={selectedHistoryResident ? normalizeResident(selectedHistoryResident) : null}
              onInvoiceSaved={fetchBookings}
              pendingRequests={pendingPaymentsList}
              onVerifyPayment={handleVerifyAndRaiseInvoice}
              onRejectPayment={handleRejectPayment}
            />
          )}

          {/* TAB 1: DASHBOARD TAB */}
          {activeTab === "Dashboard" && (
            <div className="space-y-6 sm:space-y-7">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-green-light px-3 py-1 text-[11px] font-bold text-brand-green border border-brand-green/20">
                      <Sparkles className="h-3 w-3" /> Live Operations Overview
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                    {isStaffMode ? `Welcome back, ${activeStaffMember?.name || "Staff Member"}! 👋` : "Welcome back, Master Admin! 👋"}
                  </h1>
                  <p className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5">
                    {isStaffMode
                      ? `Managing ${activeStaffMember?.assignedBuildings?.join(", ") || "Assigned Property"} • Scoped Property Dashboard`
                      : "Here's what's happening in your PG business today."}
                  </p>
                </div>

                <div className="inline-flex items-center gap-2.5 self-start sm:self-auto rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm hover:shadow transition">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span>Today ({new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })})</span>
                </div>
              </div>

              {/* 4 Interactive Operational KPI Summary Cards (2x2 on Mobile, 4x1 on Desktop) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-5">
                {/* 1. Vacant / Unoccupied Rooms (Green 🟢) */}
                <div
                  onClick={() =>
                    setOccupancyExplorerModal({
                      isOpen: true,
                      mode: "unoccupied",
                      selectedBuilding: scopedBuildingsList[0]?.name || "PG A",
                    })
                  }
                  className="group rounded-2xl sm:rounded-3xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/40 via-white to-white p-3.5 sm:p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10 cursor-pointer relative overflow-hidden active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl sm:rounded-2xl bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-2xs group-hover:scale-110 transition-transform">
                      <Bed className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                    </div>
                    <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-100/80 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-800 border border-emerald-300 shadow-2xs">
                      🟢 Available
                    </span>
                  </div>
                  <div className="mt-3 sm:mt-4">
                    <p className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-slate-400">Available Beds</p>
                    <p className="mt-0.5 sm:mt-1 text-lg sm:text-2xl lg:text-3xl font-black text-emerald-800">
                      {overallOccupancyStats.totalUnocc} <span className="text-[10px] sm:text-xs font-bold text-slate-400">Beds</span>
                    </p>
                    <p className="mt-0.5 text-[10px] sm:text-xs font-bold text-emerald-700 group-hover:underline flex items-center gap-1">
                      Vacant Matrix →
                    </p>
                  </div>
                </div>

                {/* 2. Occupied / Booked Rooms (Red 🔴) */}
                <div
                  onClick={() =>
                    setOccupancyExplorerModal({
                      isOpen: true,
                      mode: "occupied",
                      selectedBuilding: scopedBuildingsList[0]?.name || "PG A",
                    })
                  }
                  className="group rounded-2xl sm:rounded-3xl border border-rose-200/90 bg-gradient-to-br from-rose-50/40 via-white to-white p-3.5 sm:p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-rose-500/10 cursor-pointer relative overflow-hidden active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl sm:rounded-2xl bg-rose-100 text-rose-600 border border-rose-200 shadow-2xs group-hover:scale-110 transition-transform">
                      <CheckCircle2 className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                    </div>
                    <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-rose-100/80 px-2.5 py-0.5 text-[11px] font-extrabold text-rose-800 border border-rose-300 shadow-2xs">
                      🔴 Booked
                    </span>
                  </div>
                  <div className="mt-3 sm:mt-4">
                    <p className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-slate-400">Occupied Beds</p>
                    <p className="mt-0.5 sm:mt-1 text-lg sm:text-2xl lg:text-3xl font-black text-rose-700">
                      {overallOccupancyStats.totalOcc} <span className="text-[10px] sm:text-xs font-bold text-slate-400">Beds</span>
                    </p>
                    <p className="mt-0.5 text-[10px] sm:text-xs font-bold text-rose-600 group-hover:underline flex items-center gap-1">
                      Occupied Matrix →
                    </p>
                  </div>
                </div>

                {/* 3. Total Active Residents (Indigo 👥) */}
                <div
                  onClick={() => handleTabClick("Customers")}
                  className="group rounded-2xl sm:rounded-3xl border border-indigo-200/90 bg-gradient-to-br from-indigo-50/40 via-white to-white p-3.5 sm:p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 cursor-pointer relative overflow-hidden active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl sm:rounded-2xl bg-indigo-100 text-indigo-700 border border-indigo-200 shadow-2xs group-hover:scale-110 transition-transform">
                      <Users className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                    </div>
                    <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-indigo-100/80 px-2.5 py-0.5 text-[11px] font-extrabold text-indigo-800 border border-indigo-300 shadow-2xs">
                      👥 Active
                    </span>
                  </div>
                  <div className="mt-3 sm:mt-4">
                    <p className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-slate-400">Active Residents</p>
                    <p className="mt-0.5 sm:mt-1 text-lg sm:text-2xl lg:text-3xl font-black text-indigo-900">
                      {scopedBookings.filter((b) => b.status === "allocated").length} <span className="text-[10px] sm:text-xs font-bold text-slate-400">Tenants</span>
                    </p>
                    <p className="mt-0.5 text-[10px] sm:text-xs font-bold text-indigo-700 group-hover:underline flex items-center gap-1">
                      View Residents →
                    </p>
                  </div>
                </div>

                {/* 4. Total Properties / Buildings (Amber 🏢) */}
                <div
                  onClick={() => handleTabClick("Buildings")}
                  className="group rounded-2xl sm:rounded-3xl border border-amber-200/80 bg-gradient-to-br from-amber-50/30 via-white to-white p-3.5 sm:p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl sm:rounded-2xl bg-amber-100/80 text-amber-600 border border-amber-200/60 shadow-2xs group-hover:scale-110 transition-transform">
                      <Building2 className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                    </div>
                    <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-extrabold text-amber-700 border border-amber-200/80">
                      🏢 Branches
                    </span>
                  </div>
                  <div className="mt-3 sm:mt-4">
                    <p className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-slate-400">Total Properties</p>
                    <p className="mt-0.5 sm:mt-1 text-lg sm:text-2xl lg:text-3xl font-black text-slate-900">{scopedBuildingsList.length}</p>
                    <p className="mt-0.5 text-[10px] sm:text-xs font-semibold text-slate-500 group-hover:underline">Manage PG →</p>
                  </div>
                </div>
              </div>

              {/* Recent Customers Activity Feed (Full Width) */}
              <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-12">
                <div className="rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white p-3.5 sm:p-6 lg:p-7 shadow-sm lg:col-span-12 flex flex-col justify-between space-y-4">
                  <div>
                    {/* Top Title & Total Count */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                      <div>
                        <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                          Recent Customers & Admissions 📋
                        </h3>
                        <p className="text-[11px] font-semibold text-slate-400">Real-time tenant admissions and online booking feed</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-3 py-1 text-[11px] font-black shadow-2xs">
                          Total: {getTimeFilteredBookings().length} Registrations
                        </span>
                      </div>
                    </div>

                    {/* Filter Pills Toolbar */}
                    <div className="flex items-center justify-between gap-1.5 sm:gap-2 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl bg-slate-100/80 border border-slate-200/70 mb-3 overflow-x-auto scrollbar-none flex-nowrap">
                      {[
                        { id: "24h", label: "24 Hours" },
                        { id: "7d", label: "7 Days" },
                        { id: "1m", label: "1 Month" },
                        { id: "custom", label: "Custom Date" },
                      ].map((filter) => (
                        <button
                          key={filter.id}
                          onClick={() => setCustomerTimeFilter(filter.id as any)}
                          className={`flex-1 min-w-[65px] sm:min-w-[70px] rounded-lg sm:rounded-xl px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-bold transition-all text-center whitespace-nowrap cursor-pointer ${customerTimeFilter === filter.id
                              ? "bg-white text-brand-green shadow-xs border border-slate-200"
                              : "text-slate-500 hover:text-slate-900"
                            }`}
                        >
                          {filter.label}
                        </button>
                      ))}
                    </div>

                    {/* Custom Date Inputs Range (Shown when 'custom' is active) */}
                    {customerTimeFilter === "custom" && (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-2.5 sm:p-3 mb-3 rounded-xl sm:rounded-2xl bg-emerald-50/60 border border-emerald-200/60 text-xs font-bold">
                        <div className="flex items-center gap-1.5 text-brand-green">
                          <CalendarRange className="h-4 w-4 shrink-0" />
                          <span className="sm:hidden text-[11px]">Date Range:</span>
                        </div>
                        <div className="flex items-center gap-2 flex-1 flex-wrap sm:flex-nowrap">
                          <input
                            type="date"
                            value={customStartDate}
                            onChange={(e) => setCustomStartDate(e.target.value)}
                            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-slate-700 outline-none text-xs font-semibold flex-1 sm:flex-initial"
                          />
                          <span className="text-slate-400 text-xs">to</span>
                          <input
                            type="date"
                            value={customEndDate}
                            onChange={(e) => setCustomEndDate(e.target.value)}
                            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-slate-700 outline-none text-xs font-semibold flex-1 sm:flex-initial"
                          />
                        </div>
                      </div>
                    )}

                    {/* Source Filter Tabs */}
                    <div className="flex items-center gap-1.5 sm:gap-2 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl bg-slate-100/80 border border-slate-200/70 mb-4 overflow-x-auto scrollbar-none w-full max-w-full flex-nowrap">
                      {[
                        { id: "all", label: "All Bookings" },
                        { id: "online", label: "Online Bookings" },
                        { id: "manual", label: "Manual Admissions" },
                      ].map((filter) => (
                        <button
                          key={filter.id}
                          onClick={() => setDashboardSourceFilter(filter.id as any)}
                          className={`min-w-[80px] sm:min-w-[90px] flex-1 sm:flex-initial rounded-lg sm:rounded-xl px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-bold transition-all text-center whitespace-nowrap cursor-pointer ${dashboardSourceFilter === filter.id
                              ? "bg-white text-indigo-600 shadow-xs border border-slate-200"
                              : "text-slate-500 hover:text-slate-900"
                            }`}
                        >
                          {filter.label}
                        </button>
                      ))}
                    </div>

                    {/* Single Column List */}
                    <div className="space-y-3">
                      {getTimeFilteredBookings().filter(b => dashboardSourceFilter === 'all' || b.source === dashboardSourceFilter).length === 0 ? (
                        <div className="p-8 text-center text-slate-400 font-semibold border border-dashed border-slate-200 rounded-2xl sm:rounded-3xl text-xs">
                          No registrations found for this timeframe.
                        </div>
                      ) : (
                        getTimeFilteredBookings()
                          .filter(b => dashboardSourceFilter === 'all' || b.source === dashboardSourceFilter)
                          .map((cust) => {
                            const hasAllocation = cust.status === "allocated";
                            const formattedPg = hasAllocation
                              ? `${cust.allocatedBuilding} • Room ${cust.allocatedRoom} (${cust.allocatedBed})`
                              : "Pending Room Allocation";

                            const isOnline = cust.source === 'online';
                            const badgeBg = isOnline ? 'bg-indigo-50 text-indigo-600 border-indigo-200/50' : 'bg-emerald-50 text-emerald-600 border-emerald-200/50';

                            return (
                              <div
                                key={cust.id}
                                onClick={() => setSelectedHistoryResident(cust)}
                                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/70 hover:bg-white hover:border-slate-300 hover:shadow-sm transition cursor-pointer active:scale-[0.99] gap-3"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl font-black text-sm border ${badgeBg}`}>
                                    {cust.name[0]}
                                    {isOnline && (
                                      <div className="absolute -top-1 -right-1 bg-indigo-500 rounded-full p-0.5 border-2 border-white">
                                        <Globe className="h-2 w-2 text-white" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs sm:text-sm font-black text-slate-900 truncate">{cust.name}</p>
                                    <p className="text-[11px] font-semibold text-slate-500 truncate">
                                      {formattedPg}
                                    </p>
                                    <div className="text-[10px] font-bold text-slate-500 mt-1 flex flex-wrap items-center gap-1.5">
                                      <span>📱 {cust.phone}</span>
                                      {cust.guardianPhone && cust.guardianPhone !== "N/A" && (
                                        <span>👨‍👩‍👧‍👦 {cust.guardianPhone}</span>
                                      )}
                                      <span className="text-slate-300">•</span>
                                      {cust.createdByRole === "staff" ? (
                                        <span className="text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[10px] font-black">
                                          👤 Staff Admitted: {cust.createdBy || "Staff Member"}
                                        </span>
                                      ) : cust.createdByRole === "admin" ? (
                                        <span className="text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200 text-[10px] font-black">
                                          👑 Admin Admitted
                                        </span>
                                      ) : (
                                        <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 text-[10px] font-bold">
                                          🌐 Online Self-Booking
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                                  <div className="flex flex-col sm:items-end gap-1">
                                    <span className="text-[10px] font-bold text-slate-400">{cust.timestamp}</span>
                                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                                      hasAllocation 
                                        ? "bg-emerald-100 text-emerald-700 border border-emerald-200" 
                                        : "bg-amber-100 text-amber-700 border border-amber-200 animate-pulse"
                                    }`}>
                                      {cust.status === "allocated" ? "Allocated" : "Pending"}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                                    {hasAllocation && (
                                      <button
                                        title="Deallocate Room"
                                        onClick={(e) => handleDeallocateCustomer(cust.id, cust.name, e)}
                                        className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white transition cursor-pointer shrink-0"
                                      >
                                        <RotateCcw className="h-3.5 w-3.5" />
                                      </button>
                                    )}
                                    <button
                                      title="Edit Customer"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingCustomer({ ...cust });
                                      }}
                                      className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-brand-green hover:text-white transition cursor-pointer shrink-0"
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      title="Delete Customer"
                                      onClick={(e) => handleDeleteCustomer(cust.id, cust.name, e)}
                                      className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition cursor-pointer shrink-0"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                      )}
                    </div>
                  </div>

                  {/* View All Customers CTA */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400">Showing recent admissions</span>
                    <button
                      onClick={() => handleTabClick("Customers")}
                      className="text-xs font-extrabold text-brand-green hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      Manage All Customers →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PAYMENTS & FINANCIAL INSIGHTS TAB */}
          {(activeTab === "Revenue" || activeTab === "Analytics" || activeTab === "Payments") && (
            <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-300">
              {/* Header & Subtab Switcher */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                    Payments & Financial Hub 💳💰
                  </h1>
                  <p className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5">
                    Track collected tenant rents, operational expenses, profit margins, and payment transaction audits.
                  </p>
                </div>

                {/* Subtab View Mode Switcher */}
                <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100/90 border border-slate-200/80 self-start sm:self-auto shrink-0">
                  <button
                    onClick={() => setRevenueSubTab("analytics")}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      revenueSubTab === "analytics"
                        ? "bg-white text-brand-green shadow-xs"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    <Wallet className="h-3.5 w-3.5" />
                    <span>Analytics & Expenses</span>
                  </button>
                  <button
                    onClick={() => setRevenueSubTab("transactions")}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      revenueSubTab === "transactions"
                        ? "bg-white text-indigo-600 shadow-xs"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    <CreditCard className="h-3.5 w-3.5" />
                    <span>Tenant Collections</span>
                  </button>
                </div>
              </div>

              {/* Financial KPI Cards Grid (4 Cards: Gross Revenue, Spend, Net Profit, Escrow Held) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-5">
                {/* 1. Total Gross Revenue */}
                <div className="rounded-2xl sm:rounded-3xl border border-emerald-200/80 bg-white p-3.5 sm:p-5 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/10">
                  <div className="flex items-center justify-between">
                    <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl sm:rounded-2xl bg-emerald-100/80 text-emerald-600 border border-emerald-200/60 shadow-2xs">
                      <Wallet className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                    </div>
                    <span className="hidden sm:inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-700 border border-emerald-200/80">
                      <ArrowUpRight className="h-3 w-3" /> Income
                    </span>
                  </div>
                  <div className="mt-3 sm:mt-4">
                    <p className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-slate-400">Total Collections</p>
                    <p className="mt-0.5 sm:mt-1 text-lg sm:text-2xl lg:text-3xl font-black text-slate-900">
                      ₹ {totalGrossRevenue.toLocaleString("en-IN")}
                    </p>
                    <p className="mt-0.5 text-[10px] sm:text-xs font-semibold text-slate-500 truncate">
                      {isStaffMode ? "Scoped Property Revenue" : "Verified tenant collections"}
                    </p>
                  </div>
                </div>

                {/* 2. Total Monthly Spend / Expense */}
                <div className="rounded-2xl sm:rounded-3xl border border-rose-200/80 bg-white p-3.5 sm:p-5 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-rose-500/10">
                  <div className="flex items-center justify-between">
                    <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl sm:rounded-2xl bg-rose-100/80 text-rose-600 border border-rose-200/60 shadow-2xs">
                      <CreditCard className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                    </div>
                    <span className="hidden sm:inline-flex items-center gap-0.5 rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-extrabold text-rose-700 border border-rose-200/80">
                      <ArrowDownRight className="h-3 w-3" /> Spend
                    </span>
                  </div>
                  <div className="mt-3 sm:mt-4">
                    <p className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-slate-400">Total Spend</p>
                    <p className="mt-0.5 sm:mt-1 text-lg sm:text-2xl lg:text-3xl font-black text-rose-600">
                      ₹ {totalMonthlySpend.toLocaleString("en-IN")}
                    </p>
                    <p className="mt-0.5 text-[10px] sm:text-xs font-semibold text-slate-500 truncate">
                      {scopedExpensesList.length} logged expense entries
                    </p>
                  </div>
                </div>

                {/* 3. Net Profit */}
                <div className="rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white p-3.5 sm:p-5 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-brand-green/10">
                  <div className="flex items-center justify-between">
                    <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl sm:rounded-2xl bg-amber-100/80 text-amber-600 border border-amber-200/60 shadow-2xs">
                      <TrendingUp className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                    </div>
                    <span className={`hidden sm:inline-flex items-center gap-0.5 rounded-full px-2.5 py-0.5 text-[11px] font-extrabold border ${
                      netProfit >= 0
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}>
                      {netProfit >= 0 ? "Profitable" : "Deficit"}
                    </span>
                  </div>
                  <div className="mt-3 sm:mt-4">
                    <p className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-slate-400">Net Profit</p>
                    <p className={`mt-0.5 sm:mt-1 text-lg sm:text-2xl lg:text-3xl font-black ${netProfit >= 0 ? "text-emerald-700" : "text-rose-600"}`}>
                      ₹ {netProfit.toLocaleString("en-IN")}
                    </p>
                    <p className="mt-0.5 text-[10px] sm:text-xs font-semibold text-slate-500 truncate">
                      Gross Revenue - Expenses
                    </p>
                  </div>
                </div>

                {/* 4. Total Security Deposits Held */}
                <div className="rounded-2xl sm:rounded-3xl border border-cyan-200/80 bg-white p-3.5 sm:p-5 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-cyan-500/10">
                  <div className="flex items-center justify-between">
                    <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl sm:rounded-2xl bg-cyan-100/80 text-cyan-600 border border-cyan-200/60 shadow-2xs">
                      <ShieldCheck className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                    </div>
                    <span className="hidden sm:inline-flex items-center gap-0.5 rounded-full bg-cyan-50 px-2.5 py-0.5 text-[11px] font-extrabold text-cyan-700 border border-cyan-200/80">
                      Escrow
                    </span>
                  </div>
                  <div className="mt-3 sm:mt-4">
                    <p className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-slate-400">Deposits Held</p>
                    <p className="mt-0.5 sm:mt-1 text-lg sm:text-2xl lg:text-3xl font-black text-cyan-700">
                      ₹ {totalSecurityDepositHeld.toLocaleString("en-IN")}
                    </p>
                    <p className="mt-0.5 text-[10px] sm:text-xs font-semibold text-slate-500 truncate">
                      Active tenant deposits
                    </p>
                  </div>
                </div>
              </div>

              {/* SUBTAB 1: FINANCIAL OVERVIEW & EXPENSES */}
              {revenueSubTab === "analytics" && (
                <div className="space-y-5 sm:space-y-6">
                  {/* Building Performance Matrix Card */}
                  <div className="rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white p-4 sm:p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                          Building Revenue & Occupancy Matrix 🏢
                        </h3>
                        <p className="text-xs font-medium text-slate-500">Live property occupancy rates and collections breakdown</p>
                      </div>
                      <button
                        onClick={() => handleTabClick("Buildings")}
                        className="text-xs font-extrabold text-brand-green hover:underline cursor-pointer"
                      >
                        Manage Buildings →
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {scopedBuildingsList.map((bld) => {
                        const stats = getBuildingOccupancyDetails(bld.name);
                        const occPct = stats.totalBeds > 0 ? Math.round((stats.occupiedBedsCount / stats.totalBeds) * 100) : 0;
                        const bldBookings = scopedBookings.filter((bk) => (bk.allocatedBuilding || bk.building) === bld.name);
                        let bldRev = 0;
                        bldBookings.forEach((bk) => {
                          (bk.paymentHistory || []).forEach((p: any) => {
                            if (p.status === "verified" || (!p.status && p.transactionId)) {
                              bldRev += p.amount || 0;
                            }
                          });
                        });

                        return (
                          <div key={bld.name} className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/70 space-y-2.5">
                            <div className="flex items-center justify-between font-bold text-xs">
                              <span className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                                <Building2 className="h-4 w-4 text-brand-green" />
                                {bld.name}
                              </span>
                              <span className="font-extrabold text-emerald-700">₹{bldRev.toLocaleString("en-IN")}</span>
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                                <span>Occupancy</span>
                                <span className="text-slate-800">{occPct}% ({stats.occupiedBedsCount}/{stats.totalBeds} Beds)</span>
                              </div>
                              <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                                <div className="h-full bg-brand-green rounded-full transition-all duration-500" style={{ width: `${occPct}%` }} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* EXPENSE & SPEND RECORDS DATATABLE */}
                  <div className="rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white p-4 sm:p-6 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                          Monthly Spend & Expense Records 💸
                          <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-extrabold text-rose-800 border border-rose-200">
                            {scopedExpensesList.length} Entries
                          </span>
                        </h3>
                        <p className="text-xs font-medium text-slate-500 mt-0.5">
                          Electricity, catering, salaries, maintenance, and facility operational costs.
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          resetExpenseForm();
                          setIsExpenseModalOpen(true);
                        }}
                        className="inline-flex items-center gap-2 rounded-2xl bg-brand-green hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2.5 shadow-md shadow-brand-green/20 transition cursor-pointer active:scale-95 self-start sm:self-auto"
                      >
                        <Plus className="h-4 w-4" />
                        <span>+ Log Expense</span>
                      </button>
                    </div>

                    {scopedExpensesList.length === 0 ? (
                      <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-2xl space-y-2">
                        <CreditCard className="h-10 w-10 text-slate-300 mx-auto" />
                        <p className="text-xs font-bold text-slate-600">No expense records logged yet.</p>
                        <p className="text-[11px] text-slate-400">Click "+ Log Expense" above to add your first monthly spend entry.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                              <th className="py-3 px-3">Date</th>
                              <th className="py-3 px-3">Expense Title</th>
                              <th className="py-3 px-3">Category</th>
                              <th className="py-3 px-3">Building</th>
                              <th className="py-3 px-3">Amount (₹)</th>
                              <th className="py-3 px-3">Logged By</th>
                              <th className="py-3 px-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                            {scopedExpensesList.map((exp) => (
                              <tr key={exp.id} className="hover:bg-slate-50/80 transition">
                                <td className="py-3 px-3 font-mono text-slate-500">{exp.date}</td>
                                <td className="py-3 px-3 font-extrabold text-slate-900">{exp.title}</td>
                                <td className="py-3 px-3">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-800 border border-slate-200">
                                    {exp.category}
                                  </span>
                                </td>
                                <td className="py-3 px-3">
                                  <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-black text-slate-700">{exp.building}</span>
                                </td>
                                <td className="py-3 px-3 font-black text-rose-600">₹ {Number(exp.amount).toLocaleString("en-IN")}</td>
                                <td className="py-3 px-3 text-slate-500">{exp.createdBy || "Admin"}</td>
                                <td className="py-3 px-3 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      onClick={() => {
                                        setEditingExpId(exp.id);
                                        setExpTitle(exp.title);
                                        setExpCategory(exp.category);
                                        setExpAmount(String(exp.amount));
                                        setExpDate(exp.date);
                                        setExpBuilding(exp.building);
                                        setExpNotes(exp.notes || "");
                                        setIsExpenseModalOpen(true);
                                      }}
                                      className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition cursor-pointer"
                                      title="Edit Expense"
                                    >
                                      <Pencil className="h-3 w-3" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteExpense(exp.id, exp.title)}
                                      className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition cursor-pointer"
                                      title="Delete Expense"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SUBTAB 2: TENANT PAYMENT COLLECTIONS & AUDIT TRAIL */}
              {revenueSubTab === "transactions" && (
                <div className="rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white p-4 sm:p-6 shadow-sm space-y-4">
                  {/* Search Bar for Transactions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        value={paymentAuditSearch}
                        onChange={(e) => setPaymentAuditSearch(e.target.value)}
                        placeholder="Search by Txn ID, resident name, or phone..."
                        className="w-full pl-10 pr-9 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-green focus:bg-white transition"
                      />
                      {paymentAuditSearch && (
                        <button
                          onClick={() => setPaymentAuditSearch("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => handleTabClick("Invoice")}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-green text-white font-bold text-xs shadow-xs hover:bg-emerald-700 transition cursor-pointer active:scale-95"
                    >
                      <Receipt className="h-3.5 w-3.5" />
                      <span>Create / Verify Invoices</span>
                    </button>
                  </div>

                  {/* Transactions Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                          <th className="py-3 px-3">Txn ID</th>
                          <th className="py-3 px-3">Resident Name</th>
                          <th className="py-3 px-3">Building & Room</th>
                          <th className="py-3 px-3">Amount (₹)</th>
                          <th className="py-3 px-3">Payment Method</th>
                          <th className="py-3 px-3">Status</th>
                          <th className="py-3 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                        {(() => {
                          const allTxns: any[] = [];
                          scopedBookings.forEach((b) => {
                            (b.paymentHistory || []).forEach((p: any) => {
                              const q = paymentAuditSearch.toLowerCase().trim();
                              const matchesQ =
                                !q ||
                                (p.transactionId && p.transactionId.toLowerCase().includes(q)) ||
                                b.name.toLowerCase().includes(q) ||
                                b.phone.includes(q) ||
                                (b.allocatedBuilding && b.allocatedBuilding.toLowerCase().includes(q));

                              if (matchesQ) {
                                allTxns.push({
                                  ...p,
                                  residentName: b.name,
                                  phone: b.phone,
                                  building: b.allocatedBuilding || b.building,
                                  room: b.allocatedRoom,
                                  bookingId: b.id,
                                });
                              }
                            });
                          });

                          if (allTxns.length === 0) {
                            return (
                              <tr>
                                <td colSpan={7} className="py-10 text-center text-slate-400 font-semibold">
                                  No transaction records found matching your query.
                                </td>
                              </tr>
                            );
                          }

                          return allTxns.map((tx, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/80 transition">
                              <td className="py-3.5 px-3 font-mono text-slate-600 font-bold">{tx.transactionId || tx.id || "CASH-TXN"}</td>
                              <td className="py-3.5 px-3 font-black text-slate-900">{tx.residentName}</td>
                              <td className="py-3.5 px-3 text-slate-500">
                                {tx.building} {tx.room ? `• Room ${tx.room}` : ""}
                              </td>
                              <td className="py-3.5 px-3 font-black text-emerald-700">₹{Number(tx.amount || 0).toLocaleString("en-IN")}</td>
                              <td className="py-3.5 px-3">
                                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-extrabold text-slate-700 uppercase">
                                  {tx.paymentMethod || "UPI"}
                                </span>
                              </td>
                              <td className="py-3.5 px-3">
                                <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-extrabold border ${
                                  tx.status === "verified"
                                    ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                    : "bg-amber-100 text-amber-800 border-amber-200"
                                }`}>
                                  {tx.status === "verified" ? "Verified" : "Submitted"}
                                </span>
                              </td>
                              <td className="py-3.5 px-3 text-right">
                                <button
                                  onClick={() => handleTabClick("Invoice")}
                                  className="text-[11px] font-extrabold text-brand-green hover:underline cursor-pointer"
                                >
                                  View Receipt →
                                </button>
                              </td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2.5: REPORTS TAB */}
          {activeTab === "Reports" && (
            <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
              {/* Page Header Banner */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-xl border border-emerald-800/40 relative overflow-hidden">
                <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-64 h-64 bg-brand-green/20 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300 border border-emerald-500/30">
                      <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" /> Excel (.xlsx) Reports Center
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
                    Reports & Analytics Hub 📊
                  </h1>
                  <p className="text-xs sm:text-sm font-medium text-slate-300 max-w-2xl">
                    Export structured, high-clarity Excel reports with centered <span className="text-emerald-400 font-bold">"SHRIPAD PG"</span> headers, styled executive KPI summaries, auto-fitted non-blurry columns, and formatted financial data.
                  </p>
                </div>

                <div className="relative z-10 flex items-center gap-3">
                  <button
                    onClick={() => generateMasterReport(bookings, buildingsList)}
                    className="group relative inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-brand-green via-emerald-600 to-teal-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/40 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
                  >
                    <Sparkles className="h-5 w-5 text-amber-300 animate-spin" style={{ animationDuration: "6s" }} />
                    <span>Export Master All-In-One (.xlsx)</span>
                    <Download className="h-4 w-4 ml-1 transition-transform group-hover:translate-y-0.5" />
                  </button>
                </div>
              </div>

              {/* Quick Filter Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                <div className="flex items-center gap-3 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={reportSearchQuery}
                      onChange={(e) => setReportSearchQuery(e.target.value)}
                      placeholder="Search resident name, phone, room, or txn ID..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-green focus:bg-white transition-all"
                    />
                    {reportSearchQuery && (
                      <button
                        onClick={() => setReportSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-slate-400" />
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Building:</span>
                  </div>
                  <select
                    value={reportSelectedBuilding}
                    onChange={(e) => setReportSelectedBuilding(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-green cursor-pointer"
                  >
                    <option value="All">All PG Buildings</option>
                    {buildingsList.map((b) => (
                      <option key={b.name} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 4 FEATURED EXPORT CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* 1. Contact Report Card */}
                <div className="group relative flex flex-col justify-between rounded-3xl bg-white p-5 border border-slate-200/80 shadow-md hover:shadow-xl hover:border-emerald-300 transition-all duration-300">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 group-hover:scale-110 transition-transform">
                        <Users className="h-6 w-6" />
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-extrabold text-emerald-700 border border-emerald-200">
                        .xlsx Format
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                        Contact Directory Report
                      </h3>
                      <p className="text-xs font-medium text-slate-500 mt-1 line-clamp-3">
                        Full directory of resident contacts, phone numbers, email addresses, emergency/guardian phone contacts, and assigned rooms.
                      </p>
                    </div>

                    <div className="pt-2 flex items-center gap-2 text-xs font-bold text-slate-600">
                      <span className="rounded-lg bg-slate-100 px-2.5 py-1">
                        👥 {bookings.length} Records
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const filtered = bookings.filter((b) => {
                        const matchesBld = reportSelectedBuilding === "All" || b.allocatedBuilding === reportSelectedBuilding || b.building === reportSelectedBuilding;
                        const matchesSearch = !reportSearchQuery || b.name.toLowerCase().includes(reportSearchQuery.toLowerCase()) || b.phone.includes(reportSearchQuery);
                        return matchesBld && matchesSearch;
                      });
                      generateContactReport(filtered);
                    }}
                    className="mt-5 w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 shadow-md hover:shadow-lg transition-all cursor-pointer"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    <span>Export Contact Report</span>
                    <Download className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* 2. Allocation Report Card */}
                <div className="group relative flex flex-col justify-between rounded-3xl bg-white p-5 border border-slate-200/80 shadow-md hover:shadow-xl hover:border-indigo-300 transition-all duration-300">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 group-hover:scale-110 transition-transform">
                        <KeyRound className="h-6 w-6" />
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-extrabold text-indigo-700 border border-indigo-200">
                        .xlsx Format
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-black text-slate-900 group-hover:text-indigo-700 transition-colors">
                        Allocation Matrix Report
                      </h3>
                      <p className="text-xs font-medium text-slate-500 mt-1 line-clamp-3">
                        Comprehensive room & bed allocation details, seat mapping, floor breakdown, room sharing types, and allocation statuses.
                      </p>
                    </div>

                    <div className="pt-2 flex items-center gap-2 text-xs font-bold text-slate-600">
                      <span className="rounded-lg bg-indigo-50 text-indigo-700 px-2.5 py-1">
                        🔑 {bookings.filter((b) => b.status === "allocated").length} Allocated
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const filtered = bookings.filter((b) => {
                        const matchesBld = reportSelectedBuilding === "All" || b.allocatedBuilding === reportSelectedBuilding || b.building === reportSelectedBuilding;
                        const matchesSearch = !reportSearchQuery || b.name.toLowerCase().includes(reportSearchQuery.toLowerCase()) || b.phone.includes(reportSearchQuery);
                        return matchesBld && matchesSearch;
                      });
                      generateAllocationReport(filtered, buildingsList);
                    }}
                    className="mt-5 w-full flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3 shadow-md hover:shadow-lg transition-all cursor-pointer"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    <span>Export Allocation Report</span>
                    <Download className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* 3. Building Report Card */}
                <div className="group relative flex flex-col justify-between rounded-3xl bg-white p-5 border border-slate-200/80 shadow-md hover:shadow-xl hover:border-blue-300 transition-all duration-300">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 group-hover:scale-110 transition-transform">
                        <Building2 className="h-6 w-6" />
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-extrabold text-blue-700 border border-blue-200">
                        .xlsx Format
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-700 transition-colors">
                        Building Infrastructure Report
                      </h3>
                      <p className="text-xs font-medium text-slate-500 mt-1 line-clamp-3">
                        Building capacities, total room counts, occupied beds, vacant beds, occupancy rate percentages (%), and estimated revenue.
                      </p>
                    </div>

                    <div className="pt-2 flex items-center gap-2 text-xs font-bold text-slate-600">
                      <span className="rounded-lg bg-blue-50 text-blue-700 px-2.5 py-1">
                        🏢 {buildingsList.length} Buildings
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => generateBuildingReport(buildingsList, bookings)}
                    className="mt-5 w-full flex items-center justify-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 shadow-md hover:shadow-lg transition-all cursor-pointer"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    <span>Export Building Report</span>
                    <Download className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* 4. Revenue Report Card */}
                <div className="group relative flex flex-col justify-between rounded-3xl bg-white p-5 border border-slate-200/80 shadow-md hover:shadow-xl hover:border-amber-300 transition-all duration-300">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 group-hover:scale-110 transition-transform">
                        <Wallet className="h-6 w-6" />
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-extrabold text-amber-700 border border-amber-200">
                        .xlsx Format
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-black text-slate-900 group-hover:text-amber-700 transition-colors">
                        Revenue & Payment Report
                      </h3>
                      <p className="text-xs font-medium text-slate-500 mt-1 line-clamp-3">
                        Financial audit trail of all payments, transaction IDs, payment modes, verified statuses, and bank SMS auto-match verifications.
                      </p>
                    </div>

                    <div className="pt-2 flex items-center gap-2 text-xs font-bold text-slate-600">
                      <span className="rounded-lg bg-amber-50 text-amber-800 px-2.5 py-1">
                        💰 Revenue Collections
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const filtered = bookings.filter((b) => {
                        const matchesBld = reportSelectedBuilding === "All" || b.allocatedBuilding === reportSelectedBuilding || b.building === reportSelectedBuilding;
                        const matchesSearch = !reportSearchQuery || b.name.toLowerCase().includes(reportSearchQuery.toLowerCase()) || b.phone.includes(reportSearchQuery);
                        return matchesBld && matchesSearch;
                      });
                      generateRevenueReport(filtered);
                    }}
                    className="mt-5 w-full flex items-center justify-center gap-2 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-3 shadow-md hover:shadow-lg transition-all cursor-pointer"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    <span>Export Revenue Report</span>
                    <Download className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* LIVE PREVIEW SECTION (Tabbed Table) */}
              <div className="rounded-3xl bg-white p-6 border border-slate-200 shadow-lg space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                      <Table className="h-5 w-5 text-brand-green" /> Live Data Table Preview
                    </h2>
                    <p className="text-xs font-medium text-slate-500 mt-0.5">
                      Preview the structured dataset directly in the browser before triggering Excel download.
                    </p>
                  </div>

                  {/* Preview Tabs */}
                  <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl">
                    {[
                      { id: "revenue", label: "Revenue Audit" },
                      { id: "allocation", label: "Allocations" },
                      { id: "building", label: "Buildings" },
                      { id: "contact", label: "Contacts" },
                    ].map((tb) => (
                      <button
                        key={tb.id}
                        onClick={() => setReportActivePreviewTab(tb.id as any)}
                        className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                          reportActivePreviewTab === tb.id
                            ? "bg-white text-slate-900 shadow-sm"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        {tb.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Styled Centered Title Bar for Preview */}
                <div className="rounded-2xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-900 p-4 text-center text-white shadow-md">
                  <h3 className="text-lg font-black tracking-widest uppercase">SHRIPAD PG</h3>
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-200 mt-0.5">
                    {reportActivePreviewTab === "revenue" && "REVENUE & FINANCIAL TRANSACTIONS REPORT"}
                    {reportActivePreviewTab === "allocation" && "ROOM & BED ALLOCATION MATRIX REPORT"}
                    {reportActivePreviewTab === "building" && "BUILDING OCCUPANCY & INFRASTRUCTURE REPORT"}
                    {reportActivePreviewTab === "contact" && "RESIDENT & APPLICANT CONTACT DIRECTORY REPORT"}
                  </p>
                  <p className="text-[10px] italic text-emerald-100/70 mt-1">
                    Official Management Audit Record  •  Centered Excel Banner Format
                  </p>
                </div>

                {/* Interactive Table Content */}
                <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-xs max-h-[500px] overflow-y-auto">
                  {/* REVENUE PREVIEW */}
                  {reportActivePreviewTab === "revenue" && (
                    <table className="w-full text-center border-collapse text-xs">
                      <thead>
                        <tr className="bg-emerald-700 text-white font-bold sticky top-0 z-10">
                          <th className="p-3 text-center">S.No.</th>
                          <th className="p-3 text-center">Txn ID</th>
                          <th className="p-3 text-center">Resident Name</th>
                          <th className="p-3 text-center">Phone</th>
                          <th className="p-3 text-center">Building</th>
                          <th className="p-3 text-center">Amount (₹)</th>
                          <th className="p-3 text-center">Mode</th>
                          <th className="p-3 text-center">Status</th>
                          <th className="p-3 text-center">Bank SMS Match</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {(() => {
                          const payList: any[] = [];
                          bookings.forEach((b) => {
                            if (
                              reportSelectedBuilding !== "All" &&
                              b.allocatedBuilding !== reportSelectedBuilding &&
                              b.building !== reportSelectedBuilding
                            )
                              return;
                            if (
                              reportSearchQuery &&
                              !b.name.toLowerCase().includes(reportSearchQuery.toLowerCase()) &&
                              !b.phone.includes(reportSearchQuery)
                            )
                              return;

                            if (b.paymentHistory && b.paymentHistory.length > 0) {
                              b.paymentHistory.forEach((p: any) => {
                                payList.push({
                                  txnId: p.transactionId || p.id,
                                  name: p.payerName || b.name,
                                  phone: b.phone,
                                  building: b.allocatedBuilding || b.building,
                                  amount: p.amount,
                                  method: (p.paymentMethod || "upi").toUpperCase(),
                                  status: p.status === "verified" ? "Verified" : "Submitted",
                                  autoVerified: p.autoVerified,
                                });
                              });
                            }
                          });

                          if (payList.length === 0) {
                            return (
                              <tr>
                                <td colSpan={9} className="p-8 text-center text-slate-400 font-semibold">
                                  No revenue payment records match your filters.
                                </td>
                              </tr>
                            );
                          }

                          return payList.map((p, i) => (
                            <tr key={i} className={i % 2 === 0 ? "bg-slate-50/70 hover:bg-slate-100" : "bg-white hover:bg-slate-100"}>
                              <td className="p-3 text-center font-bold text-slate-500">{i + 1}</td>
                              <td className="p-3 text-center font-mono font-semibold text-slate-800">{p.txnId}</td>
                              <td className="p-3 text-center font-bold text-slate-900">{p.name}</td>
                              <td className="p-3 text-center text-slate-600">{p.phone}</td>
                              <td className="p-3 text-center font-semibold text-slate-700">{p.building}</td>
                              <td className="p-3 text-center font-black text-emerald-700">₹{(p.amount || 0).toLocaleString("en-IN")}</td>
                              <td className="p-3 text-center">
                                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-extrabold text-slate-700">
                                  {p.method}
                                </span>
                              </td>
                              <td className="p-3 text-center">
                                <span
                                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                                    p.status === "Verified" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                                  }`}
                                >
                                  {p.status}
                                </span>
                              </td>
                              <td className="p-3 text-center">
                                {p.autoVerified ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-300">
                                    <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Matched 100%
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-semibold text-slate-400">Manual</span>
                                )}
                              </td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  )}

                  {/* ALLOCATION PREVIEW */}
                  {reportActivePreviewTab === "allocation" && (
                    <table className="w-full text-center border-collapse text-xs">
                      <thead>
                        <tr className="bg-emerald-700 text-white font-bold sticky top-0 z-10">
                          <th className="p-3 text-center">S.No.</th>
                          <th className="p-3 text-center">Resident Name</th>
                          <th className="p-3 text-center">Phone</th>
                          <th className="p-3 text-center">Building</th>
                          <th className="p-3 text-center">Floor</th>
                          <th className="p-3 text-center">Room No.</th>
                          <th className="p-3 text-center">Bed Seat</th>
                          <th className="p-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {(() => {
                          const filtered = bookings.filter((b) => {
                            const matchesBld = reportSelectedBuilding === "All" || b.allocatedBuilding === reportSelectedBuilding || b.building === reportSelectedBuilding;
                            const matchesSearch = !reportSearchQuery || b.name.toLowerCase().includes(reportSearchQuery.toLowerCase()) || b.phone.includes(reportSearchQuery);
                            return matchesBld && matchesSearch;
                          });

                          if (filtered.length === 0) {
                            return (
                              <tr>
                                <td colSpan={8} className="p-8 text-center text-slate-400 font-semibold">
                                  No allocation records found.
                                </td>
                              </tr>
                            );
                          }

                          return filtered.map((b, i) => (
                            <tr key={b.id} className={i % 2 === 0 ? "bg-slate-50/70 hover:bg-slate-100" : "bg-white hover:bg-slate-100"}>
                              <td className="p-3 text-center font-bold text-slate-500">{i + 1}</td>
                              <td className="p-3 text-center font-bold text-slate-900">{b.name}</td>
                              <td className="p-3 text-center text-slate-600">{b.phone}</td>
                              <td className="p-3 text-center font-semibold text-slate-700">{b.allocatedBuilding || b.building}</td>
                              <td className="p-3 text-center">{b.allocatedFloor !== undefined ? `Floor ${b.allocatedFloor}` : "-"}</td>
                              <td className="p-3 text-center font-bold text-slate-800">{b.allocatedRoom ? `Room ${b.allocatedRoom}` : "-"}</td>
                              <td className="p-3 text-center font-bold text-brand-green">{b.allocatedBed ? `Bed ${b.allocatedBed}` : "Unallocated"}</td>
                              <td className="p-3 text-center">
                                <span
                                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                                    b.status === "allocated" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                                  }`}
                                >
                                  {b.status === "allocated" ? "Allocated" : "Pending"}
                                </span>
                              </td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  )}

                  {/* BUILDING PREVIEW */}
                  {reportActivePreviewTab === "building" && (
                    <table className="w-full text-center border-collapse text-xs">
                      <thead>
                        <tr className="bg-emerald-700 text-white font-bold sticky top-0 z-10">
                          <th className="p-3 text-center">S.No.</th>
                          <th className="p-3 text-center">Building Name</th>
                          <th className="p-3 text-center">Floors</th>
                          <th className="p-3 text-center">Total Rooms</th>
                          <th className="p-3 text-center">Capacity (Beds)</th>
                          <th className="p-3 text-center text-emerald-200">Occupied</th>
                          <th className="p-3 text-center text-amber-200">Vacant</th>
                          <th className="p-3 text-center">Occupancy Rate</th>
                          <th className="p-3 text-center">Est. Monthly Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {scopedBuildingsList.map((bld, i) => {
                          let totalRooms = 0;
                          for (let f = 0; f < bld.floors; f++) {
                            totalRooms += bld.floorRoomCounts && bld.floorRoomCounts[f] !== undefined ? bld.floorRoomCounts[f]! : bld.roomsPerFloor;
                          }
                          const cap = totalRooms * 2;
                          const occ = bookings.filter((bk) => bk.status === "allocated" && (bk.allocatedBuilding === bld.name || bk.building === bld.name)).length;
                          const vac = Math.max(0, cap - occ);
                          const rate = cap > 0 ? ((occ / cap) * 100).toFixed(1) + "%" : "0.0%";
                          const rev = occ * 8500;

                          return (
                            <tr key={bld.name} className={i % 2 === 0 ? "bg-slate-50/70 hover:bg-slate-100" : "bg-white hover:bg-slate-100"}>
                              <td className="p-3 text-center font-bold text-slate-500">{i + 1}</td>
                              <td className="p-3 text-center font-bold text-slate-900">{bld.name}</td>
                              <td className="p-3 text-center">{bld.floors}</td>
                              <td className="p-3 text-center">{totalRooms}</td>
                              <td className="p-3 text-center font-bold text-slate-800">{cap} Beds</td>
                              <td className="p-3 text-center font-black text-emerald-600">{occ}</td>
                              <td className="p-3 text-center font-black text-amber-600">{vac}</td>
                              <td className="p-3 text-center font-bold text-slate-700">{rate}</td>
                              <td className="p-3 text-center font-black text-emerald-700">₹{rev.toLocaleString("en-IN")}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}

                  {/* CONTACT PREVIEW */}
                  {reportActivePreviewTab === "contact" && (
                    <table className="w-full text-center border-collapse text-xs">
                      <thead>
                        <tr className="bg-emerald-700 text-white font-bold sticky top-0 z-10">
                          <th className="p-3 text-center">S.No.</th>
                          <th className="p-3 text-center">Resident Name</th>
                          <th className="p-3 text-center">Phone</th>
                          <th className="p-3 text-center">Email</th>
                          <th className="p-3 text-center">Emergency / Guardian Phone</th>
                          <th className="p-3 text-center">Building</th>
                          <th className="p-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {(() => {
                          const filtered = bookings.filter((b) => {
                            const matchesBld = reportSelectedBuilding === "All" || b.allocatedBuilding === reportSelectedBuilding || b.building === reportSelectedBuilding;
                            const matchesSearch = !reportSearchQuery || b.name.toLowerCase().includes(reportSearchQuery.toLowerCase()) || b.phone.includes(reportSearchQuery);
                            return matchesBld && matchesSearch;
                          });

                          return filtered.map((b, i) => (
                            <tr key={b.id} className={i % 2 === 0 ? "bg-slate-50/70 hover:bg-slate-100" : "bg-white hover:bg-slate-100"}>
                              <td className="p-3 text-center font-bold text-slate-500">{i + 1}</td>
                              <td className="p-3 text-center font-bold text-slate-900">{b.name}</td>
                              <td className="p-3 text-center font-semibold text-slate-700">{b.phone}</td>
                              <td className="p-3 text-center text-slate-600">{b.email || "N/A"}</td>
                              <td className="p-3 text-center text-amber-700 font-semibold">{b.guardianPhone || "Not Provided"}</td>
                              <td className="p-3 text-center font-semibold text-slate-700">{b.allocatedBuilding || b.building}</td>
                              <td className="p-3 text-center">
                                <span
                                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                                    b.status === "allocated" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                                  }`}
                                >
                                  {b.status === "allocated" ? "Allocated" : "Pending"}
                                </span>
                              </td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BUILDINGS TAB */}
          {activeTab === "Buildings" && (
            <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-300">
              {/* Header & Quick Action */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                    Buildings & Infrastructure 🏢
                  </h1>
                  <p className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5">
                    Manage your PG properties, room capacities, floor layouts, and live occupancy rates.
                  </p>
                </div>

                <button
                  onClick={() => setIsAddBuildingModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-brand-green hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2.5 shadow-md shadow-brand-green/20 transition cursor-pointer active:scale-95 self-start sm:self-auto"
                >
                  <Plus className="h-4 w-4" />
                  <span>+ Add New Building</span>
                </button>
              </div>

              {/* Quick Summary Metrics Grid */}
              {(() => {
                let totalRoomsAll = 0;
                let totalBedsAll = 0;
                let totalOccBedsAll = 0;
                scopedBuildingsList.forEach((bld) => {
                  const stats = getBuildingOccupancyDetails(bld.name);
                  totalRoomsAll += stats.totalRooms;
                  totalBedsAll += stats.totalBeds;
                  totalOccBedsAll += stats.occupiedBedsCount;
                });
                const totalVacBedsAll = Math.max(0, totalBedsAll - totalOccBedsAll);
                const overallPct = totalBedsAll > 0 ? Math.round((totalOccBedsAll / totalBedsAll) * 100) : 0;

                return (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-xs">
                      <p className="text-[10px] sm:text-xs font-extrabold uppercase text-slate-400">Total Properties</p>
                      <p className="text-lg sm:text-2xl font-black text-slate-900 mt-0.5">{scopedBuildingsList.length}</p>
                    </div>
                    <div className="rounded-2xl border border-blue-200/80 bg-blue-50/40 p-3.5 sm:p-4 shadow-xs">
                      <p className="text-[10px] sm:text-xs font-extrabold uppercase text-blue-700">Total PG Rooms</p>
                      <p className="text-lg sm:text-2xl font-black text-blue-950 mt-0.5">{totalRoomsAll}</p>
                    </div>
                    <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-3.5 sm:p-4 shadow-xs">
                      <p className="text-[10px] sm:text-xs font-extrabold uppercase text-emerald-700">Occupancy Rate</p>
                      <p className="text-lg sm:text-2xl font-black text-emerald-800 mt-0.5">
                        {overallPct}% <span className="text-[10px] sm:text-xs font-bold text-slate-400">({totalOccBedsAll}/{totalBedsAll})</span>
                      </p>
                    </div>
                    <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-3.5 sm:p-4 shadow-xs">
                      <p className="text-[10px] sm:text-xs font-extrabold uppercase text-amber-700">Available Beds</p>
                      <p className="text-lg sm:text-2xl font-black text-amber-800 mt-0.5">{totalVacBedsAll}</p>
                    </div>
                  </div>
                );
              })()}

              {/* Building Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {scopedBuildingsList.map((b) => {
                  const stats = getBuildingOccupancyDetails(b.name);
                  const occPct = stats.totalBeds > 0 ? Math.round((stats.occupiedBedsCount / stats.totalBeds) * 100) : 0;

                  // Compute real collected revenue for this building
                  const bldBookings = scopedBookings.filter((bk) => (bk.allocatedBuilding || bk.building) === b.name);
                  let bldRevenue = 0;
                  bldBookings.forEach((bk) => {
                    if (bk.paymentHistory && bk.paymentHistory.length > 0) {
                      bk.paymentHistory.forEach((p: any) => {
                        if (p.status === "verified" || (!p.status && p.transactionId)) {
                          bldRevenue += p.amount || 0;
                        }
                      });
                    } else if (bk.paidAmount) {
                      bldRevenue += bk.paidAmount;
                    }
                  });

                  return (
                    <div key={b.name} className="rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 shadow-sm space-y-4 hover:shadow-md transition">
                      <div className="flex items-center justify-between">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-green text-white shadow-md">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">Active</span>
                          <button
                            title="Edit Building Details"
                            onClick={() => setEditingBuilding({ originalName: b.name, name: b.name, floors: b.floors, roomsPerFloor: b.roomsPerFloor })}
                            className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-brand-green hover:text-white transition cursor-pointer"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            title="Delete Building"
                            onClick={() => handleDeleteBuilding(b.name)}
                            className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-base sm:text-lg font-black text-slate-900">{b.name}</h3>
                        <p className="text-xs font-medium text-slate-500 mt-0.5">
                          {(() => {
                            const gfExcluded = isGroundFloorExcluded(b);
                            const maxFl = gfExcluded ? b.floors : Math.max(0, b.floors - 1);
                            return gfExcluded
                              ? `${b.floors} Active Floors (1st to ${maxFl}${getOrdinalSuffix(maxFl)} Floor)`
                              : `${b.floors} Floors (Ground to ${maxFl}${getOrdinalSuffix(maxFl)} Floor)`;
                          })()} • {stats.totalRooms} Rooms
                        </p>
                      </div>

                      {/* Real Occupancy Progress Bar */}
                      <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-slate-600">Bed Occupancy:</span>
                          <span className="text-slate-900 font-extrabold">{occPct}% ({stats.occupiedBedsCount}/{stats.totalBeds})</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              occPct >= 90 ? "bg-rose-500" : occPct >= 60 ? "bg-emerald-600" : "bg-amber-500"
                            }`}
                            style={{ width: `${Math.min(100, occPct)}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 pt-0.5">
                          <span className="text-emerald-700">🟢 {stats.occupiedBedsCount} Occupied</span>
                          <span className="text-amber-700">🟡 {stats.vacantBedsCount} Free Beds</span>
                        </div>
                      </div>

                      {/* Accordion / Collapsible Floor & Room Layout */}
                      <div className="rounded-2xl bg-slate-50 border border-slate-200/70 p-3 space-y-2 text-xs">
                        <button
                          type="button"
                          onClick={() => toggleBuildingAccordion(b.name)}
                          className="w-full flex items-center justify-between font-extrabold text-slate-700 hover:text-brand-green transition cursor-pointer"
                        >
                          <span className="flex items-center gap-1.5">
                            <Layers className="h-4 w-4 text-brand-green" />
                            View Floor & Room Layout
                          </span>
                          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${expandedBuildingFloors[b.name] ? "rotate-180 text-brand-green" : "text-slate-400"}`} />
                        </button>

                        {expandedBuildingFloors[b.name] && (
                          <div className="pt-2 border-t border-slate-200/60 space-y-2 animate-in fade-in">
                            {getBuildingFloorIndices(b)
                              .filter((flIdx) => getFloorRoomCount(b, flIdx) > 0)
                              .map((flIdx) => {
                              const flName = flIdx === 0 ? "Ground Floor" : flIdx === 1 ? "1st Floor" : flIdx === 2 ? "2nd Floor" : flIdx === 3 ? "3rd Floor" : `${flIdx}th Floor`;
                              const flCount = getFloorRoomCount(b, flIdx);
                              const roomStart = flIdx === 0 ? `G01` : `${flIdx}01`;
                              const roomEnd = flIdx === 0 ? `G${flCount.toString().padStart(2, "0")}` : `${flIdx}${flCount.toString().padStart(2, "0")}`;
                              return (
                                <div key={flIdx} className="p-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
                                  <div className="flex items-center justify-between font-bold text-slate-900">
                                    <span>📍 {flName} ({flCount} {flCount === 1 ? "Room" : "Rooms"})</span>
                                    <span className="text-[11px] font-extrabold text-brand-green">
                                      {flCount === 0 ? "No PG Rooms" : flCount === 1 ? `Room ${roomStart}` : `Rooms ${roomStart} – ${roomEnd}`}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-500 font-semibold truncate">
                                    {Array.from({ length: Math.min(flCount, 6) }, (_, rIdx) => 
                                      flIdx === 0 ? `G${(rIdx + 1).toString().padStart(2, "0")}` : `${flIdx}${(rIdx + 1).toString().padStart(2, "0")}`
                                    ).join(", ")}{flCount > 6 ? `... +${flCount - 6} more` : ""}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Revenue & Action Footer */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                        <div>
                          <span className="text-[10px] uppercase text-slate-400 block font-extrabold">Collected Revenue</span>
                          <span className="text-sm font-black text-slate-900">₹{bldRevenue.toLocaleString("en-IN")}</span>
                        </div>
                        <button
                          onClick={() => {
                            setBmsBuilding(b.name);
                            handleTabClick("Allocation");
                          }}
                          className="inline-flex items-center gap-1 text-xs font-extrabold text-brand-green hover:underline cursor-pointer"
                        >
                          Manage Beds →
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Add New Building Interactive Card */}
                <button
                  onClick={() => setIsAddBuildingModalOpen(true)}
                  className="rounded-2xl sm:rounded-3xl border-2 border-dashed border-slate-200 hover:border-brand-green bg-slate-50/50 hover:bg-emerald-50/30 p-6 flex flex-col items-center justify-center space-y-3 transition-all cursor-pointer min-h-[220px] group"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-green/10 text-brand-green group-hover:bg-brand-green group-hover:text-white transition-all">
                    <Plus className="h-6 w-6" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-base font-black text-slate-900 group-hover:text-brand-green transition-colors">Add New Building</h3>
                    <p className="text-xs font-semibold text-slate-400 mt-0.5">Create a new PG property or branch</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: CUSTOMERS TAB */}
          {activeTab === "Customers" && (
            <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-300">
              {/* Header & Quick Action */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                    Residents & Applicants Directory 👥
                  </h1>
                  <p className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5">
                    Search, filter, and manage all PG tenants, room allocations, and pending applications.
                  </p>
                </div>

                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-brand-green hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2.5 shadow-md shadow-brand-green/20 transition cursor-pointer active:scale-95 self-start sm:self-auto"
                >
                  <Plus className="h-4 w-4" />
                  <span>+ Admit Customer</span>
                </button>
              </div>

              {/* Quick Summary Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
                <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-xs">
                  <p className="text-[10px] sm:text-xs font-extrabold uppercase text-slate-400">Total Records</p>
                  <p className="text-lg sm:text-2xl font-black text-slate-900 mt-0.5">{scopedBookings.length}</p>
                </div>
                <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-3.5 sm:p-4 shadow-xs">
                  <p className="text-[10px] sm:text-xs font-extrabold uppercase text-emerald-700">Allocated Tenants</p>
                  <p className="text-lg sm:text-2xl font-black text-emerald-800 mt-0.5">
                    {scopedBookings.filter((b) => b.status === "allocated").length}
                  </p>
                </div>
                <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-3.5 sm:p-4 shadow-xs">
                  <p className="text-[10px] sm:text-xs font-extrabold uppercase text-amber-700">Pending Allocation</p>
                  <p className="text-lg sm:text-2xl font-black text-amber-800 mt-0.5">
                    {scopedBookings.filter((b) => b.status !== "allocated").length}
                  </p>
                </div>
                <div className="rounded-2xl border border-indigo-200/80 bg-indigo-50/40 p-3.5 sm:p-4 shadow-xs">
                  <p className="text-[10px] sm:text-xs font-extrabold uppercase text-indigo-700">Online Bookings</p>
                  <p className="text-lg sm:text-2xl font-black text-indigo-900 mt-0.5">
                    {scopedBookings.filter((b) => b.source === "online").length}
                  </p>
                </div>
              </div>

              {/* Main Directory Card with Integrated Search & Filter Controls */}
              <div className="rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white p-4 sm:p-6 shadow-sm space-y-4">
                {/* Search Bar & Filter Controls */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
                  {/* Search Input */}
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={customerDirectorySearch}
                      onChange={(e) => setCustomerDirectorySearch(e.target.value)}
                      placeholder="Search by name, phone, room, or guardian..."
                      className="w-full pl-10 pr-9 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-green focus:bg-white transition"
                    />
                    {customerDirectorySearch && (
                      <button
                        onClick={() => setCustomerDirectorySearch("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Filter Dropdown & Status Tabs */}
                  <div className="flex items-center gap-2 overflow-x-auto scrollbar-none flex-nowrap">
                    {/* Building Filter */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Filter className="h-3.5 w-3.5 text-slate-400" />
                      <select
                        value={customerDirectoryBuilding}
                        onChange={(e) => setCustomerDirectoryBuilding(e.target.value)}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-green cursor-pointer"
                      >
                        <option value="All">All Buildings</option>
                        {scopedBuildingsList.map((b) => (
                          <option key={b.name} value={b.name}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Status Filter Tabs */}
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
                      {[
                        { id: "all", label: "All" },
                        { id: "allocated", label: "Allocated" },
                        { id: "pending", label: "Pending" },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setCustomerDirectoryStatus(tab.id as any)}
                          className={`rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                            customerDirectoryStatus === tab.id
                              ? "bg-white text-slate-900 shadow-xs"
                              : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Directory List Container */}
                <div className="space-y-3">
                  {(() => {
                    const filtered = scopedBookings.filter((b) => {
                      const matchesBuilding =
                        customerDirectoryBuilding === "All" ||
                        b.allocatedBuilding === customerDirectoryBuilding ||
                        b.building === customerDirectoryBuilding;

                      const matchesStatus =
                        customerDirectoryStatus === "all" ||
                        (customerDirectoryStatus === "allocated" && b.status === "allocated") ||
                        (customerDirectoryStatus === "pending" && b.status !== "allocated");

                      const q = customerDirectorySearch.toLowerCase().trim();
                      const matchesSearch =
                        !q ||
                        b.name.toLowerCase().includes(q) ||
                        b.phone.includes(q) ||
                        (b.allocatedRoom && b.allocatedRoom.toLowerCase().includes(q)) ||
                        (b.guardianPhone && b.guardianPhone.includes(q));

                      return matchesBuilding && matchesStatus && matchesSearch;
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="p-8 sm:p-10 text-center text-slate-400 font-semibold border-2 border-dashed border-slate-200 rounded-2xl sm:rounded-3xl space-y-2">
                          <Users className="h-8 w-8 text-slate-300 mx-auto" />
                          <p className="text-xs sm:text-sm font-bold text-slate-600">No resident records matched your filters.</p>
                          <p className="text-[11px] text-slate-400">Try adjusting your search terms or clearing status filters.</p>
                        </div>
                      );
                    }

                    return filtered.map((res) => {
                      const hasAllocation = res.status === "allocated";
                      const isOnline = res.source === "online";
                      const badgeBg = isOnline ? "bg-indigo-50 text-indigo-600 border-indigo-200/50" : "bg-emerald-50 text-emerald-600 border-emerald-200/50";

                      return (
                        <div
                          key={res.id}
                          onClick={() => setSelectedHistoryResident(res)}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 hover:bg-white hover:border-slate-300 hover:shadow-xs transition cursor-pointer active:scale-[0.995] gap-3"
                        >
                          {/* Left: Avatar & Resident Info */}
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className={`relative flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-2xl font-black text-sm border ${badgeBg}`}>
                              {res.name[0]?.toUpperCase()}
                              {isOnline && (
                                <div className="absolute -top-1 -right-1 bg-indigo-500 rounded-full p-0.5 border-2 border-white">
                                  <Globe className="h-2.5 w-2.5 text-white" />
                                </div>
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-xs sm:text-sm font-black text-slate-900 truncate">{res.name}</p>
                                <span className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-extrabold border ${
                                  hasAllocation
                                    ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                    : "bg-amber-100 text-amber-800 border-amber-200 animate-pulse"
                                }`}>
                                  {hasAllocation ? "Active Tenant" : "Pending Allocation"}
                                </span>
                              </div>

                              <p className="text-[11px] font-semibold text-slate-500 truncate mt-0.5">
                                {hasAllocation
                                  ? `${res.allocatedBuilding} • Room ${res.allocatedRoom} (${res.allocatedBed})`
                                  : "Awaiting Room Assignment"}
                              </p>

                              <div className="text-[10px] font-bold text-slate-400 mt-1 flex flex-wrap items-center gap-1.5">
                                <span className="text-slate-600">📱 {res.phone}</span>
                                {res.guardianPhone && res.guardianPhone !== "N/A" && (
                                  <span>👨‍👩‍👧‍👦 {res.guardianPhone}</span>
                                )}
                                {res.email && <span className="truncate">✉️ {res.email}</span>}
                              </div>
                            </div>
                          </div>

                          {/* Right: Quick Action Buttons */}
                          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60" onClick={(e) => e.stopPropagation()}>
                            {!hasAllocation && (
                              <button
                                title="Allocate Room Now"
                                onClick={() => handleTabClick("Allocation")}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-brand-green text-white text-xs font-bold shadow-xs hover:bg-emerald-700 transition cursor-pointer active:scale-95"
                              >
                                <KeyRound className="h-3 w-3" />
                                <span>Allocate Room</span>
                              </button>
                            )}

                            {hasAllocation && (
                              <button
                                title="Deallocate Room"
                                onClick={(e) => handleDeallocateCustomer(res.id, res.name, e)}
                                className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white transition cursor-pointer shrink-0"
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                              </button>
                            )}

                            <button
                              title="Edit Resident Profile"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingCustomer({ ...res });
                              }}
                              className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-brand-green hover:text-white transition cursor-pointer shrink-0"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>

                            <button
                              title="Delete Resident Record"
                              onClick={(e) => handleDeleteCustomer(res.id, res.name, e)}
                              className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition cursor-pointer shrink-0"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SETTINGS TAB */}
          {activeTab === "Settings" && (
            <div className="space-y-6 sm:space-y-7">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                  Settings & Preferences ⚙️
                </h1>
                <p className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5">
                  Configure PG business settings, security options, and notification channels.
                </p>
              </div>

              {/* GOOGLE SHEETS LIVE INTEGRATION CONFIGURATION CARD */}
              <div className="rounded-[2rem] border border-emerald-200/80 bg-white p-6 sm:p-7 shadow-sm space-y-6 max-w-3xl relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100/80 text-emerald-700 border border-emerald-200">
                      <FileSpreadsheet className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                        Google Sheets Live Synchronization 📊
                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-800 border border-emerald-200">
                          Active Auto-Sync
                        </span>
                      </h3>
                      <p className="text-xs font-medium text-slate-500">
                        Configure manual & online booking Google Sheet URLs. Changes apply immediately to background sync.
                      </p>
                    </div>
                  </div>
                </div>

                {settingsSaveToast && (
                  <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 ${
                    settingsSaveToast.success
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-rose-50 text-rose-800 border border-rose-200"
                  }`}>
                    {settingsSaveToast.success ? <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" /> : <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />}
                    <span>{settingsSaveToast.message}</span>
                  </div>
                )}

                <form onSubmit={handleSaveSheetSettings} className="space-y-6">
                  {/* FIELD 1: MANUAL BOOKINGS GOOGLE SHEET URL */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs sm:text-sm font-extrabold text-slate-800 flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-100 text-blue-700 text-xs font-black">1</span>
                        Manual Booking Google Sheet URL (Admin & Staff Entries) 📝
                      </label>
                      {manualUrlTestStatus && (
                        <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${
                          manualUrlTestStatus.success
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : "bg-rose-100 text-rose-800 border border-rose-200"
                        }`}>
                          {manualUrlTestStatus.success ? "Connection Verified ✅" : "Connection Failed ⚠️"}
                        </span>
                      )}
                    </div>

                    <div className="relative">
                      <input
                        type="url"
                        value={manualBookingSheetUrl}
                        onChange={(e) => setManualBookingSheetUrl(e.target.value)}
                        placeholder="https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/export?format=csv"
                        className="w-full rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3.5 pr-28 text-xs font-mono text-slate-800 outline-none focus:border-brand-green focus:bg-white focus:ring-2 focus:ring-brand-green/20 transition"
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                        {manualBookingSheetUrl && (
                          <button
                            type="button"
                            onClick={() => setManualBookingSheetUrl("")}
                            className="px-2 py-1 text-[10px] font-bold text-slate-400 hover:text-slate-700"
                            title="Clear URL"
                          >
                            Clear
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleTestSheetUrl(manualBookingSheetUrl, "manual")}
                          disabled={isTestingManualUrl}
                          className="rounded-xl bg-slate-200 hover:bg-slate-300 px-3 py-1.5 text-[11px] font-extrabold text-slate-700 transition cursor-pointer disabled:opacity-50"
                        >
                          {isTestingManualUrl ? "Testing..." : "Test URL"}
                        </button>
                      </div>
                    </div>
                    {manualUrlTestStatus?.message && (
                      <p className={`text-[11px] font-medium ${manualUrlTestStatus.success ? "text-emerald-700" : "text-rose-600"}`}>
                        {manualUrlTestStatus.message}
                      </p>
                    )}
                    <p className="text-[11px] font-medium text-slate-400">
                      Enter your published Google Sheet CSV URL or Google Apps Script Webhook URL for manual admission records.
                    </p>
                  </div>

                  {/* FIELD 2: ONLINE BOOKINGS GOOGLE SHEET URL */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs sm:text-sm font-extrabold text-slate-800 flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 text-xs font-black">2</span>
                        Online Booking Google Sheet URL (Public Website Submissions) 🌐
                      </label>
                      {onlineUrlTestStatus && (
                        <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${
                          onlineUrlTestStatus.success
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : "bg-rose-100 text-rose-800 border border-rose-200"
                        }`}>
                          {onlineUrlTestStatus.success ? "Connection Verified ✅" : "Connection Failed ⚠️"}
                        </span>
                      )}
                    </div>

                    <div className="relative">
                      <input
                        type="url"
                        value={onlineBookingSheetUrl}
                        onChange={(e) => setOnlineBookingSheetUrl(e.target.value)}
                        placeholder="https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/export?format=csv"
                        className="w-full rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3.5 pr-28 text-xs font-mono text-slate-800 outline-none focus:border-brand-green focus:bg-white focus:ring-2 focus:ring-brand-green/20 transition"
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                        {onlineBookingSheetUrl && (
                          <button
                            type="button"
                            onClick={() => setOnlineBookingSheetUrl("")}
                            className="px-2 py-1 text-[10px] font-bold text-slate-400 hover:text-slate-700"
                            title="Clear URL"
                          >
                            Clear
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleTestSheetUrl(onlineBookingSheetUrl, "online")}
                          disabled={isTestingOnlineUrl}
                          className="rounded-xl bg-slate-200 hover:bg-slate-300 px-3 py-1.5 text-[11px] font-extrabold text-slate-700 transition cursor-pointer disabled:opacity-50"
                        >
                          {isTestingOnlineUrl ? "Testing..." : "Test URL"}
                        </button>
                      </div>
                    </div>
                    {onlineUrlTestStatus?.message && (
                      <p className={`text-[11px] font-medium ${onlineUrlTestStatus.success ? "text-emerald-700" : "text-rose-600"}`}>
                        {onlineUrlTestStatus.message}
                      </p>
                    )}
                    <p className="text-[11px] font-medium text-slate-400">
                      Enter your published Google Sheet CSV URL or Google Form response sheet export URL for website online bookings.
                    </p>
                  </div>

                  {/* SAVE BUTTON & REFRESH ACTION */}
                  <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <button
                      type="submit"
                      disabled={isSavingSettings}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-green hover:bg-emerald-700 text-white font-extrabold text-xs px-6 py-3.5 shadow-lg shadow-brand-green/20 transition cursor-pointer disabled:opacity-50 active:scale-[0.98]"
                    >
                      <Save className="h-4 w-4" />
                      <span>{isSavingSettings ? "Saving Sheet URLs..." : "Save Google Sheet Settings"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        handleSaveSheetSettings();
                        fetchBookings();
                      }}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs px-5 py-3.5 transition cursor-pointer"
                    >
                      <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
                      <span>Sync & Refresh All Data Now</span>
                    </button>
                  </div>
                </form>

                {/* HELPER BOX: HOW TO GET CSV URL FROM GOOGLE SHEETS */}
                <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4 space-y-2 text-xs text-slate-600">
                  <p className="font-extrabold text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-emerald-600" /> How to get your Google Sheet CSV URL:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 font-medium pl-1 text-[11px] text-slate-600">
                    <li>Open your Google Sheet in Google Drive.</li>
                    <li>Click <span className="font-bold text-slate-800">File &gt; Share &gt; Publish to web</span>.</li>
                    <li>Under Link, select <span className="font-bold text-slate-800">Comma-separated values (.csv)</span> and click <span className="font-bold text-slate-800">Publish</span>.</li>
                    <li>Copy the generated published link and paste it into the field above!</li>
                  </ol>
                </div>
              </div>

              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm space-y-4 max-w-3xl">
                <h3 className="text-base font-black text-slate-900">General Information</h3>
                <div className="space-y-3 text-xs font-bold">
                  <div>
                    <label className="block text-slate-500 mb-1">PG Name</label>
                    <input type="text" readOnly value="Shripad PG — Premium Living, Trusted Care" className="w-full rounded-xl bg-slate-50 border border-slate-200 p-3 text-slate-800" />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">Contact Phone</label>
                    <input type="text" readOnly value="+91 98765 43210" className="w-full rounded-xl bg-slate-50 border border-slate-200 p-3 text-slate-800" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: ALLOCATION TAB */}
          {activeTab === "Allocation" && (
            <div className="space-y-6 sm:space-y-7">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold text-amber-800 border border-amber-200">
                      <KeyRound className="h-3 w-3" /> Bed & Room Management
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                    Customer Allocation 🔑
                  </h1>
                  <p className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5">
                    Assign PG buildings, rooms, and bed numbers to manual and online bookings.
                  </p>
                </div>
              </div>

              {/* 2 Main Status Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-5">
                {/* Pending Allocation Card */}
                <div
                  onClick={() => {
                    if (allocationFilter === "pending" && allocationSourceFilter === "all") {
                      setAllocationFilter("all");
                    } else {
                      setAllocationFilter("pending");
                      setAllocationSourceFilter("all");
                    }
                  }}
                  className={`rounded-2xl sm:rounded-[2rem] border-2 p-3.5 sm:p-6 shadow-sm flex flex-col justify-between space-y-4 cursor-pointer transition-all hover:shadow-md active:scale-[0.99] ${
                    allocationFilter === "pending"
                      ? "border-amber-400 bg-amber-50/90 ring-2 ring-amber-400/40 shadow-md"
                      : "border-amber-200/80 bg-gradient-to-br from-amber-50/70 via-white to-white hover:border-amber-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl bg-amber-100 text-amber-700 font-bold border border-amber-200 shrink-0">
                        <Clock className="h-5 w-5 sm:h-6 sm:w-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base sm:text-lg font-black text-slate-900">Pending Allocation</h3>
                          {allocationFilter === "pending" && allocationSourceFilter === "all" && (
                            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500 text-white">Active</span>
                          )}
                        </div>
                        <p className="text-[11px] sm:text-xs font-semibold text-slate-500">Awaiting Room/Bed Assignment</p>
                      </div>
                    </div>
                    <span className="text-2xl sm:text-3xl font-black text-amber-600">
                      {bookings.filter((b) => b.status === "pending").length}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-2 border-t border-amber-100">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (allocationFilter === "pending" && allocationSourceFilter === "manual") {
                          setAllocationFilter("all");
                          setAllocationSourceFilter("all");
                        } else {
                          setAllocationFilter("pending");
                          setAllocationSourceFilter("manual");
                        }
                      }}
                      className={`rounded-full px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-extrabold shadow-2xs transition-all hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap ${
                        allocationFilter === "pending" && allocationSourceFilter === "manual"
                          ? "bg-emerald-600 text-white border border-emerald-700 shadow-sm"
                          : "bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200"
                      }`}
                    >
                      Manual: {bookings.filter((b) => b.status === "pending" && b.source === "manual").length}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (allocationFilter === "pending" && allocationSourceFilter === "online") {
                          setAllocationFilter("all");
                          setAllocationSourceFilter("all");
                        } else {
                          setAllocationFilter("pending");
                          setAllocationSourceFilter("online");
                        }
                      }}
                      className={`rounded-full px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-extrabold shadow-2xs transition-all hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap ${
                        allocationFilter === "pending" && allocationSourceFilter === "online"
                          ? "bg-indigo-600 text-white border border-indigo-700 shadow-sm"
                          : "bg-indigo-100 text-indigo-800 border border-indigo-200 hover:bg-indigo-200"
                      }`}
                    >
                      Online: {bookings.filter((b) => b.status === "pending" && b.source === "online").length}
                    </button>
                  </div>
                </div>

                {/* Allocated Customers Card */}
                <div
                  onClick={() => {
                    if (allocationFilter === "allocated" && allocationSourceFilter === "all") {
                      setAllocationFilter("all");
                    } else {
                      setAllocationFilter("allocated");
                      setAllocationSourceFilter("all");
                    }
                  }}
                  className={`rounded-2xl sm:rounded-[2rem] border-2 p-3.5 sm:p-6 shadow-sm flex flex-col justify-between space-y-4 cursor-pointer transition-all hover:shadow-md active:scale-[0.99] ${
                    allocationFilter === "allocated"
                      ? "border-emerald-400 bg-emerald-50/90 ring-2 ring-emerald-400/40 shadow-md"
                      : "border-emerald-200/80 bg-gradient-to-br from-emerald-50/70 via-white to-white hover:border-emerald-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl bg-emerald-100 text-emerald-700 font-bold border border-emerald-200 shrink-0">
                        <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base sm:text-lg font-black text-slate-900">Allocated Customers</h3>
                          {allocationFilter === "allocated" && allocationSourceFilter === "all" && (
                            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-600 text-white">Active</span>
                          )}
                        </div>
                        <p className="text-[11px] sm:text-xs font-semibold text-slate-500">Rooms & Beds Allotted</p>
                      </div>
                    </div>
                    <span className="text-2xl sm:text-3xl font-black text-emerald-600">
                      {bookings.filter((b) => b.status === "allocated").length}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-2 border-t border-emerald-100">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (allocationFilter === "allocated" && allocationSourceFilter === "manual") {
                          setAllocationFilter("all");
                          setAllocationSourceFilter("all");
                        } else {
                          setAllocationFilter("allocated");
                          setAllocationSourceFilter("manual");
                        }
                      }}
                      className={`rounded-full px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-extrabold shadow-2xs transition-all hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap ${
                        allocationFilter === "allocated" && allocationSourceFilter === "manual"
                          ? "bg-emerald-600 text-white border border-emerald-700 shadow-sm"
                          : "bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200"
                      }`}
                    >
                      Manual: {bookings.filter((b) => b.status === "allocated" && b.source === "manual").length}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (allocationFilter === "allocated" && allocationSourceFilter === "online") {
                          setAllocationFilter("all");
                          setAllocationSourceFilter("all");
                        } else {
                          setAllocationFilter("allocated");
                          setAllocationSourceFilter("online");
                        }
                      }}
                      className={`rounded-full px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-extrabold shadow-2xs transition-all hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap ${
                        allocationFilter === "allocated" && allocationSourceFilter === "online"
                          ? "bg-indigo-600 text-white border border-indigo-700 shadow-sm"
                          : "bg-indigo-100 text-indigo-800 border border-indigo-200 hover:bg-indigo-200"
                      }`}
                    >
                      Online: {bookings.filter((b) => b.status === "allocated" && b.source === "online").length}
                    </button>
                  </div>
                </div>
              </div>

              {/* Filter Toolbar & Directory */}
              <div className="rounded-2xl sm:rounded-[2rem] border border-slate-200 bg-white p-3.5 sm:p-6 shadow-sm space-y-4 sm:space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                  {/* Status Tabs */}
                  <div className="flex items-center gap-1.5 sm:gap-2 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl bg-slate-100/90 border border-slate-200/80 overflow-x-auto scrollbar-none flex-nowrap w-full sm:w-auto">
                    {[
                      { id: "all", label: `All Bookings (${bookings.length})` },
                      { id: "pending", label: `Pending (${bookings.filter((b) => b.status === "pending").length})` },
                      { id: "allocated", label: `Allocated (${bookings.filter((b) => b.status === "allocated").length})` },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setAllocationFilter(tab.id as any)}
                        className={`flex-1 sm:flex-initial rounded-lg sm:rounded-xl px-2.5 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold transition-all text-center whitespace-nowrap cursor-pointer ${allocationFilter === tab.id
                            ? "bg-white text-brand-green shadow-xs border border-slate-200"
                            : "text-slate-500 hover:text-slate-900"
                          }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Source Dropdown Filter & Sync */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
                    <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
                      <span className="text-xs font-bold text-slate-500 shrink-0">Source:</span>
                      <select
                        value={allocationSourceFilter}
                        onChange={(e) => setAllocationSourceFilter(e.target.value as any)}
                        className="rounded-xl sm:rounded-full border border-slate-200 bg-slate-50 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold text-slate-700 outline-none focus:border-brand-green flex-1 sm:flex-initial"
                      >
                        <option value="all">All Sources (Manual + Online)</option>
                        <option value="manual">Manual Admissions Only</option>
                        <option value="online">Online Form Bookings Only</option>
                      </select>
                    </div>

                    <button
                      onClick={handleManualSync}
                      disabled={isSyncing}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl sm:rounded-full bg-brand-green hover:bg-brand-gold disabled:bg-slate-300 text-white px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs font-black shadow-sm transition-all cursor-pointer whitespace-nowrap shrink-0"
                    >
                      {isSyncing ? "Syncing..." : "Sync Sheet 🔄"}
                    </button>
                  </div>
                </div>

                {/* Allocation Customer List */}
                <div className="space-y-3">
                  {bookings.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 font-semibold border border-dashed border-slate-200 rounded-2xl sm:rounded-3xl text-xs">
                      No customer bookings found.
                    </div>
                  ) : (
                    bookings
                      .filter((c) => {
                        if (allocationFilter === "pending") return c.status === "pending";
                        if (allocationFilter === "allocated") return c.status === "allocated";
                        return true;
                      })
                      .filter((c) => {
                        if (allocationSourceFilter === "manual") return c.source === "manual";
                        if (allocationSourceFilter === "online") return c.source === "online";
                        return true;
                      })
                      .map((cust) => {
                        const isAllocated = cust.status === "allocated";
                        return (
                          <div
                            key={cust.id}
                            onClick={() => setSelectedHistoryResident(cust)}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50/80 border border-slate-200/70 gap-2.5 sm:gap-3 hover:border-slate-300 hover:bg-slate-100/70 transition cursor-pointer active:scale-[0.995]"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="relative flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-brand-green/10 text-brand-green font-black text-sm border border-brand-green/20">
                                {cust.name[0]}
                                <span
                                  className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 sm:h-4 sm:w-4 rounded-full border-2 border-white flex items-center justify-center ${
                                    cust.source === "online" ? "bg-indigo-600" : "bg-emerald-600"
                                  }`}
                                >
                                  {cust.source === "online" ? (
                                    <Globe className="h-2 w-2 sm:h-2.5 sm:w-2.5 text-white" />
                                  ) : (
                                    <UserCheck className="h-2 w-2 sm:h-2.5 sm:w-2.5 text-white" />
                                  )}
                                </span>
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                  <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate">{cust.name}</h4>
                                  <span
                                    className={`rounded-full px-2 py-0.5 text-[9px] sm:text-[10px] font-extrabold ${
                                      cust.source === "online"
                                        ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                        : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    }`}
                                  >
                                    {cust.source === "online" ? "Online" : "Manual"} (Google Form)
                                  </span>

                                  {cust.depositAmount !== undefined && (
                                    <span
                                      className={`rounded-full px-2 py-0.5 text-[9px] sm:text-[10px] font-extrabold ${
                                        cust.depositStatus === "refunded"
                                          ? "bg-slate-100 text-slate-700 border border-slate-300"
                                          : cust.depositStatus === "paid"
                                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                          : "bg-amber-100 text-amber-800 border border-amber-300"
                                      }`}
                                    >
                                      Deposit: ₹{(cust.depositAmount || 0).toLocaleString()} ({cust.depositStatus?.toUpperCase() || "PAID"})
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] sm:text-xs font-semibold text-slate-500 mt-0.5 truncate">
                                  {cust.phone} • Registered: {cust.timestamp}
                                </p>
                              </div>
                            </div>

                            {/* Status & Allocation Action Button */}
                            <div className="flex flex-wrap items-center gap-1.5 mt-1 sm:mt-0 w-full sm:w-auto justify-start sm:justify-end">
                              {isAllocated ? (
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-1 text-[11px] sm:text-xs font-extrabold flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-600 shrink-0" />
                                    <span>{cust.allocatedBuilding} • Room {cust.allocatedRoom} ({cust.allocatedBed})</span>
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedAllocateCustomer(cust);
                                      setBmsRentAmount(cust.rentAmount !== undefined ? cust.rentAmount : 5000);
                                      setBmsDepositAmount(cust.depositAmount !== undefined ? cust.depositAmount : 5000);
                                      setBmsDepositStatus(cust.depositStatus === "pending" ? "pending" : "paid");
                                      setBmsRentStartDate(cust.rentStartDate || new Date().toISOString().substring(0, 10));
                                    }}
                                    className="rounded-full bg-white border border-slate-200 px-2.5 py-1 text-[11px] sm:text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                                  >
                                    Change
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setCheckoutCustomer(cust);
                                      setCheckoutDeductions(0);
                                      setCheckoutDeductionReason("");
                                      setCheckoutRefundMethod("cash");
                                      setCheckoutTxnId("");
                                    }}
                                    className="rounded-full bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 text-[11px] sm:text-xs font-black hover:bg-rose-600 hover:text-white transition cursor-pointer flex items-center gap-1 shadow-2xs"
                                  >
                                    Check Out & Refund 🚪💸
                                  </button>
                                  <button
                                    title="Deallocate Room"
                                    onClick={(e) => handleDeallocateCustomer(cust.id, cust.name, e)}
                                    className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white transition cursor-pointer shrink-0"
                                  >
                                    <RotateCcw className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className="rounded-full bg-amber-100 text-amber-800 border border-amber-200 px-3 py-1 text-xs font-extrabold flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5 text-amber-600" />
                                    Pending Assignment
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedAllocateCustomer(cust);
                                      setBmsRentAmount(cust.rentAmount !== undefined ? cust.rentAmount : 5000);
                                      setBmsDepositAmount(cust.depositAmount !== undefined ? cust.depositAmount : 5000);
                                      setBmsDepositStatus(cust.depositStatus === "pending" ? "pending" : "paid");
                                      setBmsRentStartDate(cust.rentStartDate || new Date().toISOString().substring(0, 10));
                                    }}
                                    className="rounded-full bg-brand-green hover:bg-brand-gold text-white px-4 py-1.5 text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer"
                                  >
                                    Allocate Room & Bed
                                  </button>
                                </div>
                              )}

                              <button
                                title="Edit Customer Details"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingCustomer({ ...cust });
                                }}
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-brand-green hover:text-white transition cursor-pointer"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                title="Delete Booking"
                                onClick={(e) => handleDeleteCustomer(cust.id, cust.name, e)}
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* CREATE BOOKING / ADMISSION MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-3xl max-h-[88vh] overflow-y-auto bg-white p-5 sm:p-8 rounded-[2.5rem] shadow-2xl border border-slate-200/90 space-y-6 animate-in zoom-in-95">
            {/* Modal Top Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-green/10 text-brand-green border border-brand-green/20">
                  <UserPlus className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">Create Booking & Admission 📝</h2>
                  <p className="text-xs font-semibold text-slate-500">Manually add resident or sync online form submissions</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setFormSuccessMessage("");
                }}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Tabs Header */}
            <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100/90 border border-slate-200/80">
              <button
                onClick={() => setCreateModalTab("manual")}
                className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition-all text-center flex items-center justify-center gap-2 ${createModalTab === "manual"
                    ? "bg-white text-brand-green shadow-xs border border-slate-200"
                    : "text-slate-500 hover:text-slate-900"
                  }`}
              >
                <UserCheck className="h-4 w-4" />
                Manual Admission
              </button>
              <button
                onClick={() => setCreateModalTab("online")}
                className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition-all text-center flex items-center justify-center gap-2 ${createModalTab === "online"
                    ? "bg-white text-brand-green shadow-xs border border-slate-200"
                    : "text-slate-500 hover:text-slate-900"
                  }`}
              >
                <Globe className="h-4 w-4" />
                Online Google Form Submissions
              </button>
            </div>

            {/* TAB 1: MANUAL ADMISSION FORM */}
            {createModalTab === "manual" && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!newCustomerName || !newCustomerPhone) return;

                  try {
                    const res = await fetch(`${API_BASE_URL}/api/bookings`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        name: newCustomerName,
                        phone: newCustomerPhone,
                        email: newCustomerEmail || `${newCustomerName.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
                        guardianPhone: newCustomerGuardianPhone,
                        documents: newCustomerDocumentName || "Aadhaar Card Uploaded",
                        documentData: newCustomerDocumentData,
                        documentName: newCustomerDocumentName,
                        building: "Unallocated",
                        roomType: "Double Sharing",
                        source: "manual",
                        createdBy: isStaffMode ? activeStaffMember?.name || "Staff Member" : "Master Admin",
                        createdByRole: isStaffMode ? "staff" : "admin",
                        createdById: isStaffMode ? activeStaffMember?.id || "staff" : "admin",
                      }),
                    });
                    const data = await res.json();
                    if (data.success) {
                      setFormSuccessMessage(`Customer ${newCustomerName} successfully admitted!`);
                      fetchBookings();
                      setTimeout(() => {
                        setNewCustomerName("");
                        setNewCustomerPhone("");
                        setNewCustomerEmail("");
                        setNewCustomerGuardianPhone("");
                        setNewCustomerDocumentName("");
                        setNewCustomerDocumentData("");
                        setIsCreateModalOpen(false);
                        setFormSuccessMessage("");
                      }, 1500);
                    }
                  } catch (err) {
                    console.error("Failed to submit manual admission:", err);
                    const newBookingItem = {
                      id: `manual_${Date.now()}`,
                      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
                      name: newCustomerName,
                      phone: newCustomerPhone,
                      email: newCustomerEmail || `${newCustomerName.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
                      guardianPhone: newCustomerGuardianPhone,
                      documents: newCustomerDocumentName || "Aadhaar Card Uploaded",
                      building: "Unallocated",
                      roomType: "Double Sharing",
                      source: "manual",
                      status: "pending",
                      paymentHistory: [],
                    };
                    const localBookingsStr = localStorage.getItem("shripad_admin_bookings");
                    const bookingsList = localBookingsStr ? JSON.parse(localBookingsStr) : [];
                    bookingsList.unshift(newBookingItem);
                    localStorage.setItem("shripad_admin_bookings", JSON.stringify(bookingsList));
                    setFormSuccessMessage(`Customer ${newCustomerName} successfully admitted!`);
                    fetchBookings();
                    setTimeout(() => {
                      setNewCustomerName("");
                      setNewCustomerPhone("");
                      setNewCustomerEmail("");
                      setNewCustomerGuardianPhone("");
                      setNewCustomerDocumentName("");
                      setNewCustomerDocumentData("");
                      setIsCreateModalOpen(false);
                      setFormSuccessMessage("");
                    }, 1500);
                  }
                }}
                className="space-y-4 text-xs font-bold"
              >
                {formSuccessMessage && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 font-bold animate-in fade-in">
                    <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                    <span>{formSuccessMessage}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-600 mb-1.5">Customer Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Shivam Khude"
                      value={newCustomerName}
                      onChange={(e) => setNewCustomerName(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 p-3 text-slate-800 outline-none focus:border-brand-green focus:bg-white transition"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1.5">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 00000"
                      value={newCustomerPhone}
                      onChange={(e) => setNewCustomerPhone(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 p-3 text-slate-800 outline-none focus:border-brand-green focus:bg-white transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-600 mb-1.5">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="customer@example.com"
                      value={newCustomerEmail}
                      onChange={(e) => setNewCustomerEmail(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 p-3 text-slate-800 outline-none focus:border-brand-green focus:bg-white transition"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1.5">Guardian Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 11111 (Parent/Guardian)"
                      value={newCustomerGuardianPhone}
                      onChange={(e) => setNewCustomerGuardianPhone(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 p-3 text-slate-800 outline-none focus:border-brand-green focus:bg-white transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 mb-1.5">Document Upload (Aadhaar / Govt ID) *</label>
                  <div className="relative rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/70 p-4 text-center hover:bg-white hover:border-brand-green transition">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          setNewCustomerDocumentName(file.name);
                          const reader = new FileReader();
                          reader.onload = (uploadEvent) => {
                            setNewCustomerDocumentData(uploadEvent.target?.result as string || "");
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <UploadCloud className="h-7 w-7 text-brand-green" />
                      {newCustomerDocumentName ? (
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                          <CheckCircle className="h-4 w-4 text-emerald-600" />
                          <span>{newCustomerDocumentName}</span>
                        </div>
                      ) : (
                        <>
                          <span className="text-xs font-extrabold text-slate-700">Click or drag file to upload Aadhaar / Govt ID</span>
                          <span className="text-[10px] text-slate-400 font-semibold">Supports JPG, PNG, PDF (Max 5MB)</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="rounded-full px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-full bg-brand-green hover:bg-brand-gold text-white px-6 py-2.5 text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    Submit Manual Admission
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: ONLINE GOOGLE FORM SUBMISSIONS & LIVE GOOGLE SHEET SYNC */}
            {createModalTab === "online" && (
              <div className="space-y-5 text-xs font-bold">
                {/* Section 1: Active Sheet Link, Edit URL & Quick Export */}
                <div className="p-5 rounded-3xl bg-indigo-50/90 border border-indigo-200/90 space-y-4 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100 pb-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-3 py-1 text-xs font-extrabold text-indigo-800 border border-indigo-200">
                      <Globe className="h-4 w-4 text-indigo-600" /> Google Sheet Integration & URL Manager 🔗
                    </span>
                    <span className="text-[11px] font-black text-indigo-600 bg-white px-2.5 py-0.5 rounded-full border border-indigo-200">
                      Editable & Dynamic
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-slate-700 leading-relaxed">
                    Paste your custom Google Sheet URL below. Any new bookings will sync directly to this spreadsheet:
                  </p>

                  <div className="space-y-3">
                    {/* Online Sheet Input */}
                    <div>
                      <label className="block text-indigo-900 text-[11px] font-extrabold mb-1">
                        Online Booking Google Sheet URL *
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <input
                            type="url"
                            value={onlineBookingSheetUrl}
                            onChange={(e) => setOnlineBookingSheetUrl(e.target.value)}
                            placeholder="https://docs.google.com/spreadsheets/d/your-sheet-id/edit"
                            className="w-full rounded-2xl border border-indigo-200 bg-white px-4 py-3 text-xs font-mono text-slate-800 outline-none focus:border-indigo-600 shadow-inner"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleTestSheetUrl(onlineBookingSheetUrl, "online")}
                          disabled={isTestingOnlineUrl || !onlineBookingSheetUrl}
                          className="px-3.5 py-3 rounded-2xl bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-100 text-xs font-extrabold transition cursor-pointer disabled:opacity-50 shrink-0"
                        >
                          {isTestingOnlineUrl ? "Testing..." : "🧪 Test URL"}
                        </button>
                      </div>

                      {onlineUrlTestStatus && (
                        <div className={`mt-1.5 text-[11px] font-bold px-3 py-1.5 rounded-xl border ${
                          onlineUrlTestStatus.success
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-rose-50 text-rose-800 border-rose-200"
                        }`}>
                          {onlineUrlTestStatus.message}
                        </div>
                      )}
                    </div>

                    {/* Manual Sheet Input */}
                    <div>
                      <label className="block text-indigo-900 text-[11px] font-extrabold mb-1">
                        Manual Admission Google Sheet URL (Optional / Backup)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="url"
                          value={manualBookingSheetUrl}
                          onChange={(e) => setManualBookingSheetUrl(e.target.value)}
                          placeholder="https://docs.google.com/spreadsheets/d/your-manual-sheet-id/edit"
                          className="w-full rounded-2xl border border-indigo-200 bg-white px-4 py-3 text-xs font-mono text-slate-800 outline-none focus:border-indigo-600 shadow-inner"
                        />
                        <button
                          type="button"
                          onClick={() => handleTestSheetUrl(manualBookingSheetUrl, "manual")}
                          disabled={isTestingManualUrl || !manualBookingSheetUrl}
                          className="px-3.5 py-3 rounded-2xl bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-100 text-xs font-extrabold transition cursor-pointer disabled:opacity-50 shrink-0"
                        >
                          {isTestingManualUrl ? "Testing..." : "🧪 Test URL"}
                        </button>
                      </div>

                      {manualUrlTestStatus && (
                        <div className={`mt-1.5 text-[11px] font-bold px-3 py-1.5 rounded-xl border ${
                          manualUrlTestStatus.success
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-rose-50 text-rose-800 border-rose-200"
                        }`}>
                          {manualUrlTestStatus.message}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Save Toast Message */}
                  {settingsSaveToast && (
                    <div className={`text-xs font-bold p-3 rounded-2xl border flex items-center gap-2 ${
                      settingsSaveToast.success
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : "bg-rose-50 text-rose-800 border-rose-200"
                    }`}>
                      <span>{settingsSaveToast.message}</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={handleSaveSheetSettings}
                      disabled={isSavingSettings}
                      className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer disabled:bg-indigo-300"
                    >
                      <span>{isSavingSettings ? "Saving Settings..." : "💾 Save New Sheet URLs"}</span>
                    </button>

                    {onlineBookingSheetUrl && (
                      <a
                        href={onlineBookingSheetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 text-xs font-black shadow-md transition-all active:scale-95"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Open Active Sheet 📊
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => window.open(`${API_BASE_URL}/api/bookings/sheet-csv`, "_blank")}
                      className="inline-flex items-center gap-2 rounded-2xl bg-slate-800 hover:bg-slate-900 text-white px-4 py-3 text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer"
                    >
                      <Download className="h-4 w-4" />
                      Export Local CSV 📥
                    </button>
                  </div>
                </div>

                {/* Section 2: Google Apps Script Webhook Connection */}
                <div className="p-5 rounded-3xl bg-amber-50/90 border border-amber-200/90 space-y-4 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/70 pb-3">
                    <span className="text-xs sm:text-sm font-black text-amber-950 flex items-center gap-1.5">
                      ⚡ Automatic Live Writing into Google Sheet (Apps Script Webhook)
                    </span>
                    <span className="text-[10px] bg-amber-200 text-amber-900 px-2.5 py-1 rounded-full font-extrabold self-start sm:self-auto border border-amber-300">
                      30-Sec Setup Guide
                    </span>
                  </div>

                  <p className="text-xs text-amber-900 font-medium leading-relaxed">
                    To auto-append rows to your spreadsheet in real-time on every manual booking:
                    <br />
                    1. Open your Google Sheet → Click <strong>Extensions → Apps Script</strong>.
                    <br />
                    2. Delete everything, paste the code below, and click <strong>Save (Ctrl+S)</strong>.
                    <br />
                    3. Click <strong>Deploy → New deployment → Select Web app</strong> (Execute as: <em>Me</em>, Who has access: <em>Anyone</em>).
                    <br />
                    4. Copy the Web app URL and paste it in the field below.
                  </p>

                  {/* Clean Dedicated Code Box with Header */}
                  <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-inner">
                    <div className="flex items-center justify-between bg-slate-950 px-4 py-2.5 border-b border-slate-800">
                      <span className="font-mono text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                        <FileSpreadsheet className="h-4 w-4 text-emerald-500" /> Google Apps Script (Code.gs)
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const code = `function doGet(e) {
  return ContentService.createTextOutput("Google Sheet & Drive Webhook Active! ✅").setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);
  var docUrl = data.documents || "";

  if (data.documentData && data.documentName) {
    try {
      var folderName = "PG Resident Documents";
      var folders = DriveApp.getFoldersByName(folderName);
      var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);

      var contentType = "application/octet-stream";
      var base64Data = data.documentData;
      if (data.documentData.indexOf(";base64,") !== -1) {
        contentType = data.documentData.substring(5, data.documentData.indexOf(";"));
        base64Data = data.documentData.substring(data.documentData.indexOf(",") + 1);
      }

      var bytes = Utilities.base64Decode(base64Data);
      var blob = Utilities.newBlob(bytes, contentType, data.documentName);
      var file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      docUrl = file.getUrl();
    } catch (err) {
      console.log("Drive upload error: " + err);
    }
  }

  sheet.appendRow([
    data.timestamp || new Date(),
    data.name || "",
    data.phone || "",
    data.guardianPhone || "",
    data.email || "",
    docUrl,
    data.source || "manual"
  ]);

  return ContentService.createTextOutput(JSON.stringify({ result: "success", driveUrl: docUrl })).setMimeType(ContentService.MimeType.JSON);
}`;
                          navigator.clipboard.writeText(code);
                          setIsScriptCopied(true);
                          setTimeout(() => setIsScriptCopied(false), 2500);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-brand-green hover:bg-emerald-600 text-white text-[11px] font-sans font-extrabold transition cursor-pointer shadow-md active:scale-95"
                      >
                        {isScriptCopied ? "Copied to Clipboard! ✅" : "Copy Apps Script Code 📋"}
                      </button>
                    </div>

                    <div className="p-4 overflow-x-auto max-h-[240px] overflow-y-auto font-mono text-[11px] leading-relaxed text-emerald-300 bg-slate-900">
                      <pre className="whitespace-pre">
{`function doGet(e) {
  return ContentService.createTextOutput("Google Sheet & Drive Webhook Active! ✅").setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);
  var docUrl = data.documents || "";

  if (data.documentData && data.documentName) {
    try {
      var folderName = "PG Resident Documents";
      var folders = DriveApp.getFoldersByName(folderName);
      var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);

      var contentType = "application/octet-stream";
      var base64Data = data.documentData;
      if (data.documentData.indexOf(";base64,") !== -1) {
        contentType = data.documentData.substring(5, data.documentData.indexOf(";"));
        base64Data = data.documentData.substring(data.documentData.indexOf(",") + 1);
      }

      var bytes = Utilities.base64Decode(base64Data);
      var blob = Utilities.newBlob(bytes, contentType, data.documentName);
      var file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      docUrl = file.getUrl();
    } catch (err) {
      console.log("Drive upload error: " + err);
    }
  }

  sheet.appendRow([
    data.timestamp || new Date(),
    data.name || "",
    data.phone || "",
    data.guardianPhone || "",
    data.email || "",
    docUrl,
    data.source || "manual"
  ]);

  return ContentService.createTextOutput(JSON.stringify({ result: "success", driveUrl: docUrl })).setMimeType(ContentService.MimeType.JSON);
}`}
                      </pre>
                    </div>
                  </div>

                  <div>
                    <label className="block text-amber-900 text-xs font-extrabold mb-1">Google Apps Script Webhook URL</label>
                    <input
                      type="url"
                      placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                      value={googleSheetWebhookUrl}
                      onChange={(e) => {
                        setGoogleSheetWebhookUrl(e.target.value);
                        localStorage.setItem("shripad_google_sheet_webhook", e.target.value);
                      }}
                      className="w-full rounded-2xl border border-amber-300 bg-white p-3 text-xs text-slate-800 outline-none focus:border-brand-green font-mono shadow-inner"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={handlePushAllToGoogleSheet}
                      disabled={isSyncing || !googleSheetWebhookUrl}
                      className="w-full sm:w-auto flex-1 text-center py-3 px-5 rounded-2xl bg-brand-green text-white font-black hover:bg-emerald-700 disabled:bg-slate-300 text-xs shadow-md transition cursor-pointer active:scale-95"
                    >
                      {isSyncing ? "Pushing to Sheet..." : "⚡ Push All Bookings to Live Google Sheet Now"}
                    </button>
                    <button
                      type="button"
                      onClick={handleManualSync}
                      disabled={isSyncing}
                      className="w-full sm:w-auto py-3 px-5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer active:scale-95"
                    >
                      Fetch Form Responses 🔄
                    </button>
                  </div>
                </div>

                {formSuccessMessage && (
                  <div className="text-xs font-bold text-emerald-700 bg-emerald-50 p-3 rounded-2xl border border-emerald-200 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span>{formSuccessMessage}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADD NEW PG BUILDING MODAL */}
      {isAddBuildingModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-[2px] animate-in fade-in"
          onClick={() => setIsAddBuildingModalOpen(false)}
        >
          <div
            className="relative w-full max-w-md rounded-[2.5rem] bg-white p-6 sm:p-8 shadow-2xl border border-slate-200/90 space-y-5 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-green/10 text-brand-green border border-brand-green/20">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">Add New PG Building</h2>
                  <p className="text-[11px] font-semibold text-slate-400">Create a new building for allocations</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddBuildingModalOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddBuilding} className="space-y-4 text-xs font-bold">
              <div>
                <label className="block text-slate-600 mb-1.5">Building Name / Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PG E - Executive Wing"
                  value={newBuildingName}
                  onChange={(e) => setNewBuildingName(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 text-slate-800 outline-none focus:border-brand-green focus:bg-white transition"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1.5">Total Floors *</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    required
                    placeholder="e.g. 4"
                    value={newBuildingFloors === 0 ? "" : newBuildingFloors}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "") {
                        setNewBuildingFloors(0);
                      } else {
                        const parsed = parseInt(val.replace(/^0+/, "") || "0", 10);
                        setNewBuildingFloors(isNaN(parsed) ? 0 : parsed);
                      }
                    }}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 text-slate-800 outline-none focus:border-brand-green focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1.5">Rooms per Floor *</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    placeholder="e.g. 4"
                    value={newBuildingRoomsPerFloor === 0 ? "" : newBuildingRoomsPerFloor}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "") {
                        setNewBuildingRoomsPerFloor(0);
                      } else {
                        const parsed = parseInt(val.replace(/^0+/, "") || "0", 10);
                        setNewBuildingRoomsPerFloor(isNaN(parsed) ? 0 : parsed);
                      }
                    }}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 text-slate-800 outline-none focus:border-brand-green focus:bg-white transition"
                  />
                </div>
              </div>

              {/* LIVE ACCORDION FLOOR & ROOM PREVIEW WITH PER-FLOOR CUSTOMIZER */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5 text-xs">
                <div className="flex items-center justify-between font-extrabold text-slate-700">
                  <span className="flex items-center gap-1.5 text-brand-green">
                    <Layers className="h-4 w-4" /> Live Floor & Room Customizer
                  </span>
                  <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-100/70 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    {getTotalRoomsForBuilding({ floors: newBuildingFloors, roomsPerFloor: newBuildingRoomsPerFloor, floorRoomCounts: newFloorRoomCounts })} Total PG Rooms
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  Adjust PG rooms for each floor (e.g., set Ground Floor to 1 room if rest is personal/office use):
                </p>

                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {getBuildingFloorIndices({ floors: newBuildingFloors, roomsPerFloor: newBuildingRoomsPerFloor, floorRoomCounts: newFloorRoomCounts }).map((flIdx) => {
                    const flName = flIdx === 0 ? "Ground Floor" : flIdx === 1 ? "1st Floor" : flIdx === 2 ? "2nd Floor" : flIdx === 3 ? "3rd Floor" : `${flIdx}th Floor`;
                    const currentRooms = newFloorRoomCounts[flIdx] !== undefined ? newFloorRoomCounts[flIdx] : newBuildingRoomsPerFloor;
                    const startRoom = flIdx === 0 ? `G01` : `${flIdx}01`;
                    const endRoom = flIdx === 0 ? `G${currentRooms.toString().padStart(2, "0")}` : `${flIdx}${currentRooms.toString().padStart(2, "0")}`;

                    return (
                      <div key={flIdx} className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 shadow-2xs ${currentRooms === 0 ? "bg-amber-50/60 border-amber-200" : "bg-white border-slate-200/80"}`}>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-800 block truncate">🏢 {flName}</span>
                            {flIdx === 0 && currentRooms === 0 && (
                              <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300">Ground Floor Excluded</span>
                            )}
                          </div>
                          <span className={`text-[10px] font-extrabold block ${currentRooms === 0 ? "text-amber-800" : "text-brand-green"}`}>
                            {currentRooms === 0 ? "🚫 0 Rooms (Parking / Commercial / Reception)" : currentRooms === 1 ? `Room ${startRoom}` : `Rooms ${startRoom} – ${endRoom}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {flIdx === 0 && currentRooms > 0 && (
                            <button
                              type="button"
                              onClick={() => setNewFloorRoomCounts((prev) => ({ ...prev, 0: 0 }))}
                              className="text-[10px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded-lg border border-rose-200 transition cursor-pointer"
                              title="Set Ground Floor to 0 Rooms if used for Parking or Reception"
                            >
                              Exclude GF (0 Rooms)
                            </button>
                          )}
                          <span className="text-[10px] text-slate-500 font-semibold">PG Rooms:</span>
                          <input
                            type="number"
                            min="0"
                            max="50"
                            placeholder="0"
                            value={currentRooms === 0 ? "" : currentRooms}
                            onChange={(e) => {
                              const val = e.target.value;
                              const num = val === "" ? 0 : parseInt(val.replace(/^0+/, "") || "0", 10);
                              setNewFloorRoomCounts((prev) => ({ ...prev, [flIdx]: isNaN(num) ? 0 : num }));
                            }}
                            className="w-16 rounded-xl border border-slate-200 bg-slate-50 p-1.5 text-center text-xs font-bold text-slate-900 outline-none focus:border-brand-green focus:bg-white"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddBuildingModalOpen(false)}
                  className="rounded-full px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-brand-green hover:bg-brand-gold text-white px-6 py-2.5 text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  Create Building
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT BUILDING MODAL */}
      {editingBuilding && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-[2px] animate-in fade-in"
          onClick={() => setEditingBuilding(null)}
        >
          <div
            className="relative w-full max-w-md rounded-[2.5rem] bg-white p-6 sm:p-8 shadow-2xl border border-slate-200/90 space-y-5 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-green/10 text-brand-green border border-brand-green/20">
                  <Pencil className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">Edit Building Details</h2>
                  <p className="text-[11px] font-semibold text-slate-400">Modify property name & room configuration</p>
                </div>
              </div>
              <button
                onClick={() => setEditingBuilding(null)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateBuilding} className="space-y-4 text-xs font-bold">
              <div>
                <label className="block text-slate-600 mb-1.5">Building Name / Code *</label>
                <input
                  type="text"
                  required
                  value={editingBuilding.name}
                  onChange={(e) => setEditingBuilding({ ...editingBuilding, name: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 text-slate-800 outline-none focus:border-brand-green focus:bg-white transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1.5">Total Floors *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editingBuilding.floors === 0 ? "" : editingBuilding.floors}
                    onChange={(e) => {
                      const val = e.target.value;
                      const parsed = val === "" ? 0 : parseInt(val.replace(/^0+/, "") || "0", 10);
                      setEditingBuilding({ ...editingBuilding, floors: isNaN(parsed) ? 0 : parsed });
                    }}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 text-slate-800 outline-none focus:border-brand-green focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1.5">Standard Rooms per Floor *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editingBuilding.roomsPerFloor === 0 ? "" : editingBuilding.roomsPerFloor}
                    onChange={(e) => {
                      const val = e.target.value;
                      const parsed = val === "" ? 0 : parseInt(val.replace(/^0+/, "") || "0", 10);
                      setEditingBuilding({ ...editingBuilding, roomsPerFloor: isNaN(parsed) ? 0 : parsed });
                    }}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 text-slate-800 outline-none focus:border-brand-green focus:bg-white transition"
                  />
                </div>
              </div>

              {/* LIVE PER-FLOOR PG ROOM CUSTOMIZER IN EDIT MODAL */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5 text-xs">
                <div className="flex items-center justify-between font-extrabold text-slate-700">
                  <span className="flex items-center gap-1.5 text-brand-green">
                    <Layers className="h-4 w-4" /> Customize PG Rooms per Floor
                  </span>
                  <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-100/70 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    {getTotalRoomsForBuilding(editingBuilding)} Total PG Rooms
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  Set specific room counts (e.g., Ground Floor = 1 room, 1st Floor = 2 rooms):
                </p>

                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {getBuildingFloorIndices(editingBuilding).map((flIdx) => {
                    const flName = flIdx === 0 ? "Ground Floor" : flIdx === 1 ? "1st Floor" : flIdx === 2 ? "2nd Floor" : flIdx === 3 ? "3rd Floor" : `${flIdx}th Floor`;
                    const currentRooms = getFloorRoomCount(editingBuilding, flIdx);
                    const startRoom = flIdx === 0 ? `G01` : `${flIdx}01`;
                    const endRoom = flIdx === 0 ? `G${currentRooms.toString().padStart(2, "0")}` : `${flIdx}${currentRooms.toString().padStart(2, "0")}`;

                    return (
                      <div key={flIdx} className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 shadow-2xs ${currentRooms === 0 ? "bg-amber-50/60 border-amber-200" : "bg-white border-slate-200/80"}`}>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-800 block truncate">🏢 {flName}</span>
                            {flIdx === 0 && currentRooms === 0 && (
                              <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300">Ground Floor Excluded</span>
                            )}
                          </div>
                          <span className={`text-[10px] font-extrabold block ${currentRooms === 0 ? "text-amber-800" : "text-brand-green"}`}>
                            {currentRooms === 0 ? "🚫 0 Rooms (Parking / Commercial / Reception)" : currentRooms === 1 ? `Room ${startRoom}` : `Rooms ${startRoom} – ${endRoom}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {flIdx === 0 && currentRooms > 0 && (
                            <button
                              type="button"
                              onClick={() => setEditingBuilding({
                                ...editingBuilding,
                                floorRoomCounts: {
                                  ...editingBuilding.floorRoomCounts,
                                  0: 0,
                                },
                              })}
                              className="text-[10px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded-lg border border-rose-200 transition cursor-pointer"
                              title="Set Ground Floor to 0 Rooms if used for Parking or Reception"
                            >
                              Exclude GF (0 Rooms)
                            </button>
                          )}
                          <span className="text-[10px] text-slate-500 font-semibold">PG Rooms:</span>
                          <input
                            type="number"
                            min="0"
                            max="50"
                            placeholder="0"
                            value={currentRooms === 0 ? "" : currentRooms}
                            onChange={(e) => {
                              const val = e.target.value;
                              const num = val === "" ? 0 : parseInt(val.replace(/^0+/, "") || "0", 10);
                              setEditingBuilding({
                                ...editingBuilding,
                                floorRoomCounts: {
                                  ...editingBuilding.floorRoomCounts,
                                  [flIdx]: isNaN(num) ? 0 : num,
                                },
                              });
                            }}
                            className="w-16 rounded-xl border border-slate-200 bg-slate-50 p-1.5 text-center text-xs font-bold text-slate-900 outline-none focus:border-brand-green focus:bg-white"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingBuilding(null)}
                  className="rounded-full px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-brand-green hover:bg-brand-gold text-white px-6 py-2.5 text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CUSTOMER MODAL */}
      {editingCustomer && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in"
          onClick={() => setEditingCustomer(null)}
        >
          <div
            className="relative w-full max-w-lg rounded-[2.5rem] bg-white p-6 sm:p-8 shadow-2xl border border-slate-200/90 space-y-5 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200">
                  <Pencil className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">Edit Customer Information</h2>
                  <p className="text-[11px] font-semibold text-slate-400">Update resident contact & personal details</p>
                </div>
              </div>
              <button
                onClick={() => setEditingCustomer(null)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCustomer} className="space-y-4 text-xs font-bold">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1.5">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={editingCustomer.name || ""}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 p-3 text-slate-800 outline-none focus:border-brand-green focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1.5">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={editingCustomer.phone || ""}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 p-3 text-slate-800 outline-none focus:border-brand-green focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={editingCustomer.email || ""}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, email: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 p-3 text-slate-800 outline-none focus:border-brand-green focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1.5">Guardian Phone</label>
                  <input
                    type="tel"
                    value={editingCustomer.guardianPhone || ""}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, guardianPhone: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 p-3 text-slate-800 outline-none focus:border-brand-green focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1.5">Building Branch</label>
                <select
                  value={editingCustomer.building || "PG A"}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, building: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 p-3 text-slate-800 outline-none focus:border-brand-green focus:bg-white transition"
                >
                  {buildingsList.map((b) => (
                    <option key={b.name} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="rounded-full px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-brand-green hover:bg-brand-gold text-white px-6 py-2.5 text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  Save Customer Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BOOKMYSHOW-STYLE INTERACTIVE ROOM & BED ALLOCATION MODAL */}
      {selectedAllocateCustomer && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] bg-white p-6 sm:p-8 shadow-2xl border border-slate-200/90 space-y-5 animate-in zoom-in-95">
            {/* Clean Professional Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-green/10 text-brand-green border border-brand-green/20">
                  <Grid className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Room & Bed Allocation Matrix</h2>
                  <p className="text-xs font-semibold text-slate-500">
                    Allocating for resident: <span className="text-slate-900 font-bold">{selectedAllocateCustomer.name}</span> ({selectedAllocateCustomer.type})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAllocateCustomer(null)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* If NO buildings exist, show clean empty state instead of fake dummy rooms */}
            {scopedBuildingsList.length === 0 ? (
              <div className="p-8 text-center rounded-3xl bg-amber-50/90 border border-amber-200/90 space-y-4 my-2">
                <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-amber-100 text-amber-700 border border-amber-200 shadow-2xs">
                  <Building2 className="h-7 w-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-black text-slate-900">No PG Buildings Registered Yet</h3>
                  <p className="text-xs font-semibold text-slate-600 max-w-sm mx-auto">
                    You currently have 0 buildings created. Please add your PG property in the Buildings tab first before allocating rooms and beds to residents.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAllocateCustomer(null);
                      setIsAddBuildingModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-brand-green text-white text-xs font-black shadow-lg shadow-brand-green/20 hover:scale-105 transition cursor-pointer"
                  >
                    <Plus className="h-4 w-4" /> Add New Building Now
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* STEP 1: Building & Floor Selector */}
                <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="text-xs font-black text-slate-700 uppercase tracking-wider block">1. Select Building & Floor</span>
                    {/* Building Selector */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {scopedBuildingsList.map((bld) => (
                        <button
                          key={bld.name}
                          onClick={() => setBmsBuilding(bld.name)}
                          className={`rounded-full px-3.5 py-1 text-xs font-bold transition-all ${bmsBuilding === bld.name
                              ? "bg-brand-green text-white shadow-xs"
                              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                            }`}
                        >
                          {bld.name}
                        </button>
                      ))}
                      <button
                        onClick={() => setIsAddBuildingModalOpen(true)}
                        className="rounded-full px-3 py-1 text-xs font-bold bg-emerald-50 text-brand-green border border-brand-green/30 hover:bg-brand-green hover:text-white transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="h-3 w-3" /> Add Building
                      </button>
                    </div>
                  </div>

                  {/* Floor Selector Pills */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60 flex-wrap">
                    <span className="text-xs font-bold text-slate-500">Floor Level:</span>
                    {(() => {
                      const bldObj = scopedBuildingsList.find((b) => b.name === bmsBuilding) || scopedBuildingsList[0];
                      if (!bldObj) return null;
                      const floors = getBuildingFloorIndices(bldObj)
                        .filter((index) => getFloorRoomCount(bldObj, index) > 0)
                        .map((index) => {
                          if (index === 0) return { val: 0, label: "Ground Floor" };
                          if (index === 1) return { val: 1, label: "1st Floor" };
                          if (index === 2) return { val: 2, label: "2nd Floor" };
                          if (index === 3) return { val: 3, label: "3rd Floor" };
                          return { val: index, label: `${index}th Floor` };
                        });
                      return floors.map((f) => {
                        const rCount = getFloorRoomCount(bldObj, f.val);
                        const isDisabled = rCount === 0;
                        return (
                          <button
                            key={f.val}
                            type="button"
                            disabled={isDisabled}
                            onClick={() => !isDisabled && setBmsFloor(f.val)}
                            title={isDisabled ? "No PG Rooms on this floor (Parking / Reception)" : `Select ${f.label}`}
                            className={`rounded-xl px-4 py-1.5 text-xs font-bold transition-all ${
                              isDisabled
                                ? "bg-slate-100 text-slate-400 border border-slate-200/60 cursor-not-allowed opacity-60 line-through"
                                : bmsFloor === f.val
                                ? "bg-slate-900 text-white shadow-xs cursor-pointer"
                                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 cursor-pointer"
                            }`}
                          >
                            {f.label} {isDisabled && "🚫"}
                          </button>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* BOOKMYSHOW-STYLE LEGEND BAR WITH RED FULLY OCCUPIED INDICATOR */}
                <div className="flex items-center justify-center gap-5 py-2.5 rounded-2xl bg-slate-100/70 border border-slate-200/60 text-[11px] font-extrabold text-slate-700 flex-wrap">
                  <span className="flex items-center gap-2">
                    <span className="h-3.5 w-3.5 rounded-md border-2 border-emerald-500 bg-emerald-100 shadow-2xs" /> Available
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="h-3.5 w-3.5 rounded-md border-2 border-rose-400 bg-rose-100 shadow-2xs" /> Fully Occupied (Red)
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="h-3.5 w-3.5 rounded-md bg-brand-green shadow-xs" /> Selected
                  </span>
                </div>

                {/* STEP 2: BookMyShow Cinema-Style Room Seat Grid */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                      2. Select Room ({bmsBuilding || scopedBuildingsList[0]?.name} • {bmsFloor === 0 ? "Ground Floor" : bmsFloor === 1 ? "1st Floor" : bmsFloor === 2 ? "2nd Floor" : bmsFloor === 3 ? "3rd Floor" : `${bmsFloor}th Floor`})
                    </span>
                    <span className="text-[11px] font-bold text-slate-500">Tap an available room below</span>
                  </div>

                  {(() => {
                    const bldObj = scopedBuildingsList.find((b) => b.name === bmsBuilding) || scopedBuildingsList[0];
                    if (!bldObj) return null;
                    const roomCount = getFloorRoomCount(bldObj, bmsFloor);
                    if (roomCount === 0) {
                      return (
                        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-1 my-2">
                          <p className="text-xs font-black text-amber-900 flex items-center justify-center gap-1.5">
                            <AlertCircle className="h-4 w-4 text-amber-600" />
                            <span>No PG Rooms Allocated on {bmsFloor === 0 ? "Ground Floor" : `Floor ${bmsFloor}`}</span>
                          </p>
                          <p className="text-[11px] font-medium text-amber-800">
                            This floor is marked for Parking, Reception, Store, or Office use. Please select another floor level above.
                          </p>
                        </div>
                      );
                    }
                    return (
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5 max-h-60 overflow-y-auto p-1">
                    {Array.from({ length: roomCount }, (_, idx) => {
                      const roomNo = bmsFloor === 0
                        ? `G${(idx + 1).toString().padStart(2, "0")}`
                        : `${bmsFloor}${(idx + 1).toString().padStart(2, "0")}`;

                    const rmState = getRoomBedState(bmsBuilding, roomNo);
                    const isSelected = bmsRoom === roomNo;

                    return (
                      <button
                        key={roomNo}
                        disabled={rmState.isFull}
                        onClick={() => {
                          setBmsRoom(roomNo);
                          // Auto select first free bed in selected room
                          const firstFree = rmState.beds.find((b) => !b.isOccupied);
                          setBmsBed(firstFree ? firstFree.bedName : "Bed A");
                        }}
                        className={`relative flex flex-col items-center justify-center p-2.5 rounded-2xl border-2 font-black transition-all ${rmState.isFull
                            ? "bg-rose-50 border-rose-300 text-rose-700 cursor-not-allowed opacity-90"
                            : isSelected
                              ? "bg-brand-green text-white border-brand-green shadow-lg shadow-brand-green/30 scale-[1.03]"
                              : "bg-emerald-50/70 border-emerald-300 hover:border-brand-green text-emerald-900 hover:bg-emerald-100 hover:scale-[1.02] shadow-2xs"
                          }`}
                      >
                        <span className="text-xs font-black tracking-tight">Room {roomNo}</span>
                        <span className={`text-[9px] font-extrabold mt-0.5 ${isSelected ? "text-white/90" : rmState.isFull ? "text-rose-700" : "text-emerald-700"}`}>
                          {rmState.isFull ? "FULL" : `${rmState.freeCount}/${rmState.capacity} Free`}
                        </span>

                        {isSelected && (
                          <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white text-brand-green shadow-xs">
                            <Check className="h-2.5 w-2.5 stroke-[3]" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                  </div>
                );
              })()}
            </div>

            {/* STEP 3: Real Bed Layout Grid Inside Selected Room */}
            <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200/80 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <span className="text-xs font-black text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Bed className="h-4 w-4 text-indigo-600" /> 3. Select Bed in Room {bmsRoom}
                </span>

                {/* Dynamic Room Sharing / Bed Capacity Switcher (1 to 10 Beds) */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-black text-indigo-700 uppercase tracking-wider">Room Capacity:</span>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((cap) => {
                    const cleanRoom = (bmsRoom || "101").toString().replace(/^Room\s+/i, "").trim();
                    const currentCap = customRoomSharing[`${bmsBuilding}_${cleanRoom}`] || 2;
                    const isActive = currentCap === cap;
                    return (
                      <button
                        key={cap}
                        type="button"
                        onClick={() => {
                          const updated = {
                            ...customRoomSharing,
                            [`${bmsBuilding}_${cleanRoom}`]: cap,
                          };
                          setCustomRoomSharing(updated);
                          if (typeof window !== "undefined") {
                            localStorage.setItem("shripad_custom_room_sharing", JSON.stringify(updated));
                          }
                          const letterLabels = ["Bed A", "Bed B", "Bed C", "Bed D", "Bed E", "Bed F", "Bed G", "Bed H", "Bed I", "Bed J", "Bed K", "Bed L"];
                          const maxBedIndex = letterLabels.indexOf(bmsBed);
                          if (maxBedIndex >= cap) {
                            setBmsBed("Bed A");
                          }
                        }}
                        className={`px-2 py-0.5 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
                          isActive
                            ? "bg-indigo-600 text-white shadow-md scale-105"
                            : "bg-white text-indigo-900 border border-indigo-200 hover:bg-indigo-100"
                        }`}
                      >
                        {cap === 1 ? "1 (Single)" : `${cap} Beds`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {(() => {
                const rmState = getRoomBedState(bmsBuilding, bmsRoom);
                const gridColsClass = rmState.beds.length === 1
                  ? "grid-cols-1"
                  : rmState.beds.length === 2
                    ? "grid-cols-1 sm:grid-cols-2"
                    : rmState.beds.length <= 4
                      ? "grid-cols-2 sm:grid-cols-2 md:grid-cols-4"
                      : rmState.beds.length <= 6
                        ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-6"
                        : "grid-cols-2 sm:grid-cols-4 md:grid-cols-5";

                return (
                  <div className={`grid ${gridColsClass} gap-2.5 max-h-72 overflow-y-auto p-1`}>
                    {rmState.beds.map((b) => {
                      const isBedSelected = bmsBed === b.bedName;
                      return (
                        <button
                          key={b.bedName}
                          disabled={b.isOccupied}
                          onClick={() => setBmsBed(b.bedName)}
                          className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 font-extrabold transition-all cursor-pointer ${b.isOccupied
                              ? "bg-rose-50 border-rose-300 text-rose-700 opacity-90 cursor-not-allowed"
                              : isBedSelected
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-md scale-105"
                                : "bg-emerald-50 border-emerald-300 text-emerald-900 hover:border-indigo-600 hover:bg-emerald-100"
                            }`}
                        >
                          <div className="flex items-center gap-1.5">
                            {b.isOccupied ? <Lock className="h-3.5 w-3.5 text-rose-600" /> : <Bed className="h-3.5 w-3.5" />}
                            <span className="text-xs font-black">{b.bedName}</span>
                          </div>
                          <span className={`text-[10px] mt-0.5 font-extrabold ${isBedSelected ? "text-white/90" : b.isOccupied ? "text-rose-700 font-bold" : "text-emerald-700"}`}>
                            {b.isOccupied ? `Occupied (${b.occupantName})` : isBedSelected ? "Selected ✅" : "Available ⚡"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* STEP 4: Financial & Security Deposit Configuration */}
            <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200/90 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                  <IndianRupee className="h-4 w-4 text-amber-600" /> 4. Financial & Security Deposit Configuration
                </span>
                <span className="text-[11px] font-bold text-amber-700">Admin Custom Deposit</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-amber-900 mb-1">Monthly Rent Amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 5000"
                    value={bmsRentAmount === 0 ? "" : bmsRentAmount}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "") {
                        setBmsRentAmount(0);
                      } else {
                        const num = parseInt(val.replace(/^0+/, "") || "0", 10);
                        setBmsRentAmount(isNaN(num) ? 0 : num);
                      }
                    }}
                    className="w-full rounded-xl border border-amber-200 bg-white p-2.5 text-xs font-black text-slate-900 outline-none focus:border-brand-green"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-amber-900 mb-1">Security Deposit Amount (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 5000"
                    value={bmsDepositAmount === 0 ? "" : bmsDepositAmount}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "") {
                        setBmsDepositAmount(0);
                      } else {
                        const num = parseInt(val.replace(/^0+/, "") || "0", 10);
                        setBmsDepositAmount(isNaN(num) ? 0 : num);
                      }
                    }}
                    className="w-full rounded-xl border border-amber-200 bg-white p-2.5 text-xs font-black text-slate-900 outline-none focus:border-brand-green"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-amber-200/60">
                <div>
                  <label className="block text-[11px] font-bold text-amber-900 mb-1">Rent Start Date</label>
                  <input
                    type="date"
                    value={bmsRentStartDate}
                    onChange={(e) => setBmsRentStartDate(e.target.value)}
                    className="w-full rounded-xl border border-amber-200 bg-white p-2 text-xs font-bold text-slate-900 outline-none focus:border-brand-green"
                  />
                </div>
                <div className="flex flex-col justify-end">
                  <span className="text-[11px] font-bold text-amber-900 mb-1">Deposit Payment Status:</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setBmsDepositStatus("paid")}
                      className={`px-3 py-1 rounded-full text-xs font-extrabold transition ${bmsDepositStatus === "paid" ? "bg-emerald-600 text-white shadow-xs" : "bg-white text-slate-600 border border-slate-200"}`}
                    >
                      Paid ✅ (₹{bmsDepositAmount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setBmsDepositStatus("pending")}
                      className={`px-3 py-1 rounded-full text-xs font-extrabold transition ${bmsDepositStatus === "pending" ? "bg-amber-500 text-white shadow-xs" : "bg-white text-slate-600 border border-slate-200"}`}
                    >
                      Pending ⏳
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Confirm Allocation Footer Bar */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100">
              <div className="text-xs font-extrabold text-slate-700">
                Target Bed: <span className="text-brand-green font-black">{bmsBuilding} • Room {bmsRoom} ({bmsBed})</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedAllocateCustomer(null)}
                  className="rounded-full px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!selectedAllocateCustomer) return;

                    const targetId = selectedAllocateCustomer.id;
                    const targetName = selectedAllocateCustomer.name || "Resident";
                    const targetPhone = selectedAllocateCustomer.phone || "0000000000";

                    const creds = generateCustomerCredentials(targetName, targetPhone);
                    const paidDep = bmsDepositStatus === "paid" ? bmsDepositAmount : 0;

                    const cleanRoom = (bmsRoom || "101").toString().replace(/^Room\s+/i, "").trim();
                    const roomCap = customRoomSharing[`${bmsBuilding}_${cleanRoom}`] || 2;
                    const allocatedRoomType = roomCap === 1 ? "Single Room" : `${roomCap}-Sharing`;

                    // 1. Update React state immediately
                    setBookings((prev) =>
                      prev.map((b) =>
                        b.id === targetId
                          ? {
                              ...b,
                              status: "allocated",
                              allocatedBuilding: bmsBuilding,
                              allocatedFloor: bmsFloor,
                              allocatedRoom: bmsRoom,
                              allocatedBed: bmsBed,
                              roomType: allocatedRoomType,
                              customerId: creds.customerId,
                              customerPassword: creds.customerPassword,
                              rentAmount: bmsRentAmount,
                              depositAmount: bmsDepositAmount,
                              paidDepositAmount: paidDep,
                              depositStatus: bmsDepositStatus,
                              rentStartDate: bmsRentStartDate,
                            }
                          : b
                      )
                    );

                    // 2. Update LocalStorage immediately
                    try {
                      const localStr = localStorage.getItem("shripad_admin_bookings");
                      if (localStr) {
                        const list = JSON.parse(localStr);
                        const updatedList = list.map((b: any) =>
                          b.id === targetId
                            ? {
                                ...b,
                                status: "allocated",
                                allocatedBuilding: bmsBuilding,
                                allocatedFloor: bmsFloor,
                                allocatedRoom: bmsRoom,
                                allocatedBed: bmsBed,
                                roomType: allocatedRoomType,
                                customerId: creds.customerId,
                                customerPassword: creds.customerPassword,
                                rentAmount: bmsRentAmount,
                                depositAmount: bmsDepositAmount,
                                paidDepositAmount: paidDep,
                                depositStatus: bmsDepositStatus,
                                rentStartDate: bmsRentStartDate,
                              }
                            : b
                        );
                        localStorage.setItem("shripad_admin_bookings", JSON.stringify(updatedList));
                      }
                    } catch (e) {
                      console.error("LocalStorage allocation sync error:", e);
                    }

                    // 3. Set One-time credential modal data
                    setAllotmentSuccessData({
                      residentName: targetName,
                      building: bmsBuilding,
                      room: bmsRoom,
                      bed: bmsBed,
                      customerId: creds.customerId,
                      customerPassword: creds.customerPassword,
                      phone: targetPhone,
                    });

                    // 4. Close allocation matrix modal
                    setSelectedAllocateCustomer(null);

                    // 5. Send background API sync to backend
                    try {
                      await fetch(`${API_BASE_URL}/api/bookings/${targetId}/allocate`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          building: bmsBuilding,
                          floor: bmsFloor,
                          room: bmsRoom,
                          bed: bmsBed,
                          roomType: allocatedRoomType,
                          customerId: creds.customerId,
                          customerPassword: creds.customerPassword,
                          rentAmount: bmsRentAmount,
                          depositAmount: bmsDepositAmount,
                          paidDepositAmount: paidDep,
                          depositStatus: bmsDepositStatus,
                          rentStartDate: bmsRentStartDate,
                        }),
                      });
                    } catch (err) {
                      console.warn("Backend allocation sync notice:", err);
                    }
                  }}
                  className="rounded-full bg-brand-green hover:bg-brand-gold text-white px-6 py-2.5 text-xs font-black shadow-lg shadow-brand-green/30 transition-all active:scale-95 cursor-pointer"
                >
                  Confirm & Allocate {bmsBed}
                </button>
              </div>
            </div>
          </>
        )}
          </div>
        </div>
      )}

      {/* ONE-TIME CREDENTIAL DISPLAY & WHATSAPP SHARE MODAL */}
      {allotmentSuccessData && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-[2.5rem] bg-white p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in zoom-in-95 text-slate-900 space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-emerald-500 text-white font-bold">
                <KeyRound className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-black">Room Allocated Successfully!</h2>
                <p className="text-xs font-semibold text-slate-500">One-time resident credential reveal</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold space-y-1">
              <p className="font-extrabold text-sm flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 text-amber-600" /> One-Time Password Display
              </p>
              <p className="font-medium">
                For resident privacy, this plain-text password is shown <strong>ONE TIME ONLY</strong>. Once you dismiss this window, the password is encrypted and hidden from the Admin Dashboard.
              </p>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3 font-bold text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500">Resident:</span>
                <span className="text-slate-900 text-sm font-black">{allotmentSuccessData.residentName}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500">Allocated Seat:</span>
                <span className="text-brand-green text-sm font-black">
                  {allotmentSuccessData.building} • Room {allotmentSuccessData.room} ({allotmentSuccessData.bed})
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] text-slate-400 uppercase font-black">Customer User ID</span>
                  <p className="text-base font-black text-brand-navy mt-0.5">{allotmentSuccessData.customerId}</p>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-emerald-300 bg-emerald-50/50 shadow-2xs">
                  <span className="text-[10px] text-emerald-700 uppercase font-black">Generated Password</span>
                  <p className="text-base font-black text-emerald-800 tracking-wider mt-0.5">{allotmentSuccessData.customerPassword}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              <a
                href={`https://wa.me/91${allotmentSuccessData.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
                  `Welcome to Shripad PG! Your room allocation is complete:\n\n📍 Building: ${allotmentSuccessData.building}\n🛏️ Room: ${allotmentSuccessData.room} (${allotmentSuccessData.bed})\n\n🔑 Resident Portal: http://localhost:8080/login\n🆔 User ID: ${allotmentSuccessData.customerId}\n🔒 Password: ${allotmentSuccessData.customerPassword}\n\nPlease login and change your default password.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-2xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/30 transition cursor-pointer"
              >
                <PhoneCall className="h-4 w-4" />
                <span>Send Credentials via WhatsApp</span>
              </a>

              <button
                onClick={() => {
                  const textToCopy = `Welcome to Shripad PG!\nResident Portal: http://localhost:8080/login\nUser ID: ${allotmentSuccessData.customerId}\nPassword: ${allotmentSuccessData.customerPassword}`;
                  navigator.clipboard.writeText(textToCopy);
                  setCopiedCredentialText(true);
                  setTimeout(() => setCopiedCredentialText(false), 2000);
                }}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs font-extrabold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
              >
                {copiedCredentialText ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                <span>{copiedCredentialText ? "Credentials Copied to Clipboard!" : "Copy Credentials & Portal Link"}</span>
              </button>

              <button
                onClick={() => setAllotmentSuccessData(null)}
                className="w-full py-3 text-xs font-black text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                Done & Close ✨
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHECKOUT & SECURITY DEPOSIT REFUND CLEARANCE MODAL */}
      {checkoutCustomer && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in" onClick={() => setCheckoutCustomer(null)}>
          <div className="relative w-full max-w-lg rounded-[2.5rem] bg-white p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in zoom-in-95 text-slate-900 space-y-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-200">
                  <RotateCcw className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">Resident Exit & Deposit Refund Clearance</h2>
                  <p className="text-[11px] font-semibold text-slate-400">Checkout clearance for {checkoutCustomer.name}</p>
                </div>
              </div>
              <button onClick={() => setCheckoutCustomer(null)} className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Resident Summary Box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Resident:</span>
                <span className="text-slate-900 font-black">{checkoutCustomer.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Allocated Seat:</span>
                <span className="text-brand-green font-black">{checkoutCustomer.allocatedBuilding} • Room {checkoutCustomer.allocatedRoom} ({checkoutCustomer.allocatedBed})</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                <span className="text-slate-500">Security Deposit Collected:</span>
                <span className="text-emerald-700 font-black text-sm">₹{(checkoutCustomer.paidDepositAmount !== undefined ? checkoutCustomer.paidDepositAmount : (checkoutCustomer.depositAmount || 5000)).toLocaleString()}</span>
              </div>
            </div>

            {/* Deductions Input (No automatic rent deduction) */}
            <div className="space-y-3.5 text-xs font-bold">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Maintenance / Damage Deductions (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={checkoutDeductions === 0 ? "" : checkoutDeductions}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "") {
                      setCheckoutDeductions(0);
                    } else {
                      const num = parseInt(val.replace(/^0+/, "") || "0", 10);
                      setCheckoutDeductions(isNaN(num) ? 0 : Math.max(0, num));
                    }
                  }}
                  placeholder="0 (Enter 0 if no damages)"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-slate-900 outline-none focus:border-brand-green focus:bg-white"
                />
              </div>

              {checkoutDeductions > 0 && (
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Deduction Reason / Notes</label>
                  <input
                    type="text"
                    value={checkoutDeductionReason}
                    onChange={(e) => setCheckoutDeductionReason(e.target.value)}
                    placeholder="e.g. ₹500 key replacement / room repairs"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-slate-900 outline-none focus:border-brand-green focus:bg-white"
                  />
                </div>
              )}

              {/* Net Refund Calculation Card */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex justify-between items-center text-emerald-900 font-black">
                <span>Net Refund to Resident:</span>
                <span className="text-lg text-emerald-700 font-black">
                  ₹{Math.max(0, (checkoutCustomer.paidDepositAmount !== undefined ? checkoutCustomer.paidDepositAmount : (checkoutCustomer.depositAmount || 5000)) - checkoutDeductions).toLocaleString()}
                </span>
              </div>

              {/* Refund Method & Transaction ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Payment Method</label>
                  <select
                    value={checkoutRefundMethod}
                    onChange={(e) => setCheckoutRefundMethod(e.target.value as any)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-slate-800 outline-none focus:border-brand-green focus:bg-white"
                  >
                    <option value="cash">Cash 💵</option>
                    <option value="upi">UPI Transfer 📱</option>
                    <option value="bank_transfer">Bank Transfer 🏦</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Transaction Ref / Txn ID</label>
                  <input
                    type="text"
                    value={checkoutTxnId}
                    onChange={(e) => setCheckoutTxnId(e.target.value)}
                    placeholder="Optional (e.g. UPI Ref No.)"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-slate-800 outline-none focus:border-brand-green focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
              <button type="button" onClick={() => setCheckoutCustomer(null)} className="rounded-full px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition">
                Cancel
              </button>
              <button
                type="button"
                disabled={isCheckoutSubmitting}
                onClick={async () => {
                  if (!checkoutCustomer) return;
                  setIsCheckoutSubmitting(true);
                  const paidDep = checkoutCustomer.paidDepositAmount !== undefined ? checkoutCustomer.paidDepositAmount : (checkoutCustomer.depositAmount || 5000);
                  const netRefund = Math.max(0, paidDep - checkoutDeductions);

                  try {
                    const res = await fetch(`${API_BASE_URL}/api/bookings/${checkoutCustomer.id}/checkout-refund`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        deductions: checkoutDeductions,
                        deductionReason: checkoutDeductionReason,
                        refundAmount: netRefund,
                        refundMethod: checkoutRefundMethod,
                        transactionId: checkoutTxnId,
                      }),
                    });

                    const data = await res.json();
                    if (data.success && data.booking) {
                      setBookings((prev) => prev.map((b) => (b.id === data.booking.id ? data.booking : b)));
                      showToast(`Checkout clearance complete! ₹${netRefund} refunded to ${checkoutCustomer.name}.`, "success");
                      setCheckoutSuccessVoucher(data.booking);
                    }
                  } catch (err) {
                    console.error("Checkout refund error:", err);
                    showToast("Failed to process checkout. Please try again.", "error");
                  } finally {
                    setIsCheckoutSubmitting(false);
                    setCheckoutCustomer(null);
                  }
                }}
                className="rounded-full bg-rose-600 hover:bg-rose-700 text-white px-6 py-2.5 text-xs font-black shadow-lg shadow-rose-600/30 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isCheckoutSubmitting ? "Processing Exit..." : "Complete Checkout & Refund Deposit 🚪💸"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXIT CLEARANCE VOUCHER MODAL */}
      {checkoutSuccessVoucher && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in" onClick={() => setCheckoutSuccessVoucher(null)}>
          <div className="relative w-full max-w-lg rounded-[2.5rem] bg-white p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in zoom-in-95 text-slate-900 space-y-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-emerald-500 text-white font-bold">
                  <Receipt className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black">Exit Clearance Voucher</h2>
                  <p className="text-xs font-semibold text-slate-500">Security deposit refund voucher summary</p>
                </div>
              </div>
              <button onClick={() => setCheckoutSuccessVoucher(null)} className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 font-bold text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500">Resident:</span>
                <span className="text-slate-900 text-sm font-black">{checkoutSuccessVoucher.name}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500">Status:</span>
                <span className="text-emerald-700 text-xs font-black uppercase bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full">CHECKED OUT & DEPOSIT REFUNDED</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500">Security Deposit Refunded:</span>
                <span className="text-emerald-700 text-base font-black">₹{(checkoutSuccessVoucher.depositRefundDetails?.refundAmount || 0).toLocaleString()}</span>
              </div>
              {checkoutSuccessVoucher.depositRefundDetails?.deductions > 0 && (
                <div className="flex justify-between items-center pb-2 border-b border-slate-200 text-amber-800">
                  <span>Deductions ({checkoutSuccessVoucher.depositRefundDetails?.deductionReason || "Maintenance"}):</span>
                  <span>- ₹{checkoutSuccessVoucher.depositRefundDetails?.deductions}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-1 text-slate-500 text-[11px]">
                <span>Payment Mode: {checkoutSuccessVoucher.depositRefundDetails?.refundMethod?.toUpperCase()}</span>
                <span>Date: {checkoutSuccessVoucher.depositRefundDetails?.refundDate}</span>
              </div>
            </div>

            <button
              onClick={() => setCheckoutSuccessVoucher(null)}
              className="w-full py-3.5 px-4 rounded-2xl text-xs font-black text-white bg-brand-green hover:bg-brand-gold shadow-md transition cursor-pointer"
            >
              Done & Close Voucher
            </button>
          </div>
        </div>
      )}

      {/* RENT SETUP MODAL (Post-Allotment or Edit Flow) */}
      {rentSetupTarget && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-[2.5rem] bg-white p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in zoom-in-95 text-slate-900 space-y-5">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-brand-green text-white font-bold">
                <IndianRupee className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-black">Set Rent Details</h2>
                <p className="text-xs font-semibold text-slate-500">Define rent amount & billing schedule</p>
              </div>
            </div>

            {/* Resident Info Summary */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Resident:</span>
                <span className="text-slate-900 font-black">{rentSetupTarget.residentName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Allocated Seat:</span>
                <span className="text-brand-green font-black">{rentSetupTarget.building} • Room {rentSetupTarget.room} ({rentSetupTarget.bed})</span>
              </div>
            </div>

            {/* Stay Type Toggle */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">Stay Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { setRentSetupStayType("monthly"); setRentSetupCheckoutDate(""); }}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                    rentSetupStayType === "monthly"
                      ? "bg-brand-green text-white shadow-lg shadow-brand-green/30"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <CalendarRange className="h-4 w-4" />
                  Monthly PG
                </button>
                <button
                  type="button"
                  onClick={() => setRentSetupStayType("short_stay")}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                    rentSetupStayType === "short_stay"
                      ? "bg-amber-500 text-white shadow-lg shadow-amber-500/30"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <CalendarDays className="h-4 w-4" />
                  Short Stay
                </button>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-3">
              {/* Rent Amount */}
              <div>
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">Monthly Rent Amount (₹)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={rentSetupAmount}
                    onChange={(e) => setRentSetupAmount(e.target.value)}
                    placeholder="Enter rent amount"
                    className="w-full pl-9 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-green/40 focus:border-brand-green transition"
                  />
                </div>
              </div>

              {/* Rent Start Date */}
              <div>
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">Rent Start Date</label>
                <input
                  type="date"
                  value={rentSetupStartDate}
                  onChange={(e) => setRentSetupStartDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-green/40 focus:border-brand-green transition"
                />
              </div>

              {/* Checkout Date (only for short_stay) */}
              {rentSetupStayType === "short_stay" && (
                <div className="animate-in slide-in-from-top-2">
                  <label className="text-[11px] font-black text-amber-600 uppercase tracking-wider block mb-1.5">Checkout Date</label>
                  <input
                    type="date"
                    value={rentSetupCheckoutDate}
                    onChange={(e) => setRentSetupCheckoutDate(e.target.value)}
                    min={rentSetupStartDate}
                    className="w-full px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition"
                  />
                  {rentSetupStartDate && rentSetupCheckoutDate && (
                    <p className="text-[10px] font-bold text-amber-600 mt-1.5 ml-1">
                      Duration: {Math.max(1, Math.ceil((new Date(rentSetupCheckoutDate).getTime() - new Date(rentSetupStartDate).getTime()) / (1000 * 60 * 60 * 24)))} days
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                disabled={!rentSetupAmount || !rentSetupStartDate || isRentSetupSubmitting}
                onClick={async () => {
                  if (!rentSetupTarget || !rentSetupAmount || !rentSetupStartDate) return;
                  setIsRentSetupSubmitting(true);
                  try {
                    const res = await fetch(`${API_BASE_URL}/api/bookings/${rentSetupTarget.id}/rent-setup`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        rentAmount: Number(rentSetupAmount),
                        rentStartDate: rentSetupStartDate,
                        checkoutDate: rentSetupStayType === "short_stay" ? rentSetupCheckoutDate : undefined,
                        stayType: rentSetupStayType,
                      }),
                    });
                    const data = await res.json();
                    if (data.success && data.booking) {
                      setBookings((prev) => prev.map((b) => (b.id === data.booking.id ? data.booking : b)));
                    }
                    setRentSetupTarget(null);
                  } catch (err) {
                    console.error("Failed to save rent setup:", err);
                  } finally {
                    setIsRentSetupSubmitting(false);
                  }
                }}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-2xl text-xs font-black text-white bg-brand-green hover:bg-brand-gold shadow-lg shadow-brand-green/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>{isRentSetupSubmitting ? "Saving..." : "Save Rent Details"}</span>
              </button>

              <button
                type="button"
                onClick={() => setRentSetupTarget(null)}
                className="w-full py-3 text-xs font-black text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                Skip for Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESIDENT PROFILE & HISTORY MODAL */}
      {selectedHistoryResident && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in" onClick={() => setSelectedHistoryResident(null)}>
          <div
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-[2.5rem] bg-white shadow-2xl border border-slate-200/90 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-green/10 text-brand-green border border-brand-green/20 font-black text-xl">
                  {selectedHistoryResident.name[0]}
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">{selectedHistoryResident.name}</h2>
                  <p className="text-[11px] font-semibold text-slate-400">Resident Profile & History Log</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedHistoryResident(null)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* General Info Card */}
            <div className="mx-5 mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-3.5 text-xs font-bold text-slate-700">
              <h3 className="text-slate-950 font-black text-xs uppercase tracking-wider">Contact & Registration Info</h3>
              
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">Phone Number</span>
                  <span className="text-slate-900">{selectedHistoryResident.phone}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">Email Address</span>
                  <span className="text-slate-900 truncate block">{selectedHistoryResident.email || "N/A"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">Guardian Phone</span>
                  <span className="text-slate-900">{selectedHistoryResident.guardianPhone || "N/A"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">Admitted & Registered By</span>
                  {selectedHistoryResident.createdByRole === "staff" ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-black">
                      👤 Staff: {selectedHistoryResident.createdBy || "Staff Member"}
                    </span>
                  ) : selectedHistoryResident.createdByRole === "admin" ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-800 border border-indigo-200 text-[10px] font-black">
                      👑 Master Admin: {selectedHistoryResident.createdBy || "Admin"}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold">
                      🌐 Online Self-Booking
                    </span>
                  )}
                </div>
              </div>

              {/* Financial Ledger & Security Deposit Card */}
              <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/80 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-black text-amber-900 flex items-center gap-1">
                    <IndianRupee className="h-3.5 w-3.5 text-amber-600" /> Security Deposit Ledger
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                    selectedHistoryResident.depositStatus === "refunded"
                      ? "bg-slate-200 text-slate-700 border border-slate-300"
                      : selectedHistoryResident.depositStatus === "paid"
                      ? "bg-emerald-600 text-white shadow-2xs"
                      : "bg-amber-500 text-white shadow-2xs"
                  }`}>
                    {selectedHistoryResident.depositStatus === "refunded"
                      ? "REFUNDED 🚪"
                      : selectedHistoryResident.depositStatus === "paid"
                      ? "PAID ✅"
                      : "PENDING ⏳"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-amber-800 block">Security Deposit:</span>
                    <span className="text-slate-900 font-black text-sm">₹{(selectedHistoryResident.depositAmount || 5000).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-amber-800 block">Monthly Rent:</span>
                    <span className="text-slate-900 font-black text-sm">₹{(selectedHistoryResident.rentAmount || 5000).toLocaleString()}/mo</span>
                  </div>
                </div>

                {selectedHistoryResident.status === "allocated" && (
                  <button
                    onClick={() => {
                      const cust = selectedHistoryResident;
                      setSelectedHistoryResident(null);
                      setCheckoutCustomer(cust);
                      setCheckoutDeductions(0);
                      setCheckoutDeductionReason("");
                      setCheckoutRefundMethod("cash");
                      setCheckoutTxnId("");
                    }}
                    className="w-full mt-1.5 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    Check Out & Refund Deposit 🚪💸
                  </button>
                )}
              </div>
            </div>

            {/* 4-Tab Nav */}
            <div className="flex gap-1 px-5 pt-4 pb-2">
              {[
                { key: "room", label: "Room", icon: <Building2 className="h-3.5 w-3.5" /> },
                { key: "payment", label: "Payment", icon: <CreditCard className="h-3.5 w-3.5" /> },
                { key: "complaint", label: "Complaints", icon: <MessageSquare className="h-3.5 w-3.5" /> },
                { key: "documents", label: "Documents", icon: <FileText className="h-3.5 w-3.5" /> },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setHistoryTab(tab.key as any)}
                  className={`flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-[10px] font-black transition-all active:scale-95 ${
                    historyTab === tab.key
                      ? "bg-slate-900 text-white shadow-md"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="px-5 pb-6 pt-3 space-y-4">

              {/* ===== ROOM TAB ===== */}
              {historyTab === "room" && (
                <div className="space-y-4">
                  {selectedHistoryResident.status === "allocated" ? (
                    <>
                      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80">
                        <div className="flex items-center gap-2 mb-3">
                          <Building2 className="h-4 w-4 text-emerald-600" />
                          <h3 className="text-xs font-black text-emerald-900 uppercase tracking-wider">Allocated Room</h3>
                          <span className="ml-auto text-[9px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">Active</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 bg-white rounded-xl border border-emerald-100">
                            <span className="text-[10px] text-slate-400 block mb-1">Building</span>
                            <span className="text-sm font-black text-slate-900">{selectedHistoryResident.allocatedBuilding || "—"}</span>
                          </div>
                          <div className="p-3 bg-white rounded-xl border border-emerald-100">
                            <span className="text-[10px] text-slate-400 block mb-1">Floor</span>
                            <span className="text-sm font-black text-slate-900">Floor {selectedHistoryResident.allocatedFloor ?? "—"}</span>
                          </div>
                          <div className="p-3 bg-white rounded-xl border border-emerald-100">
                            <span className="text-[10px] text-slate-400 block mb-1">Room Number</span>
                            <span className="text-sm font-black text-slate-900">Room {selectedHistoryResident.allocatedRoom || "—"}</span>
                          </div>
                          <div className="p-3 bg-white rounded-xl border border-emerald-100">
                            <span className="text-[10px] text-slate-400 block mb-1">Bed</span>
                            <span className="text-sm font-black text-slate-900">{selectedHistoryResident.allocatedBed || "—"}</span>
                          </div>
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500 font-semibold">
                        <span className="font-black text-slate-900">Registered:</span> {selectedHistoryResident.timestamp} · Room type: {selectedHistoryResident.roomType}
                      </div>

                      {/* Rent Details Card */}
                      {selectedHistoryResident.rentAmount ? (
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-brand-green/5 to-emerald-50 border border-brand-green/20">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <IndianRupee className="h-4 w-4 text-brand-green" />
                              <h3 className="text-xs font-black text-brand-green uppercase tracking-wider">Rent Details</h3>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setRentSetupTarget({
                                  id: selectedHistoryResident.id,
                                  residentName: selectedHistoryResident.name,
                                  building: selectedHistoryResident.allocatedBuilding || selectedHistoryResident.building || "",
                                  room: selectedHistoryResident.allocatedRoom || selectedHistoryResident.room || "",
                                  bed: selectedHistoryResident.allocatedBed || selectedHistoryResident.bed || "",
                                });
                                setRentSetupAmount(String(selectedHistoryResident.rentAmount || ""));
                                setRentSetupStartDate(selectedHistoryResident.rentStartDate || new Date().toISOString().substring(0, 10));
                                setRentSetupCheckoutDate(selectedHistoryResident.checkoutDate || "");
                                setRentSetupStayType(selectedHistoryResident.stayType || "monthly");
                                setSelectedHistoryResident(null);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-brand-green/20 text-brand-green text-[10px] font-black hover:bg-brand-green hover:text-white transition-all cursor-pointer"
                            >
                              <Pencil className="h-3 w-3" />
                              Edit
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-white rounded-xl border border-emerald-100">
                              <span className="text-[10px] text-slate-400 block mb-1">Monthly Rent</span>
                              <span className="text-sm font-black text-slate-900">₹{selectedHistoryResident.rentAmount?.toLocaleString("en-IN")}</span>
                            </div>
                            <div className="p-3 bg-white rounded-xl border border-emerald-100">
                              <span className="text-[10px] text-slate-400 block mb-1">Rent Start Date</span>
                              <span className="text-sm font-black text-slate-900">{selectedHistoryResident.rentStartDate || "—"}</span>
                            </div>
                            <div className="p-3 bg-white rounded-xl border border-emerald-100">
                              <span className="text-[10px] text-slate-400 block mb-1">Stay Type</span>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black ${
                                selectedHistoryResident.stayType === "short_stay"
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              }`}>
                                {selectedHistoryResident.stayType === "short_stay" ? "Short Stay" : "Monthly PG"}
                              </span>
                            </div>
                            {selectedHistoryResident.stayType === "short_stay" && selectedHistoryResident.checkoutDate ? (
                              <div className="p-3 bg-white rounded-xl border border-amber-200">
                                <span className="text-[10px] text-amber-500 block mb-1">Checkout Date</span>
                                <span className="text-sm font-black text-amber-700">{selectedHistoryResident.checkoutDate}</span>
                              </div>
                            ) : (
                              <div className="p-3 bg-white rounded-xl border border-emerald-100">
                                <span className="text-[10px] text-slate-400 block mb-1">Checkout Status</span>
                                <span className="text-sm font-black text-emerald-700">Ongoing Stay 🔄</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center">
                          <IndianRupee className="h-6 w-6 text-slate-300 mx-auto mb-1.5" />
                          <p className="text-xs font-black text-slate-600">Rent Not Set</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 mb-3">No rent has been configured for this resident.</p>
                          <button
                            type="button"
                            onClick={() => {
                              setRentSetupTarget({
                                id: selectedHistoryResident.id,
                                residentName: selectedHistoryResident.name,
                                building: selectedHistoryResident.allocatedBuilding || selectedHistoryResident.building || "",
                                room: selectedHistoryResident.allocatedRoom || selectedHistoryResident.room || "",
                                bed: selectedHistoryResident.allocatedBed || selectedHistoryResident.bed || "",
                              });
                              setRentSetupAmount("");
                              setRentSetupStartDate(new Date().toISOString().substring(0, 10));
                              setRentSetupCheckoutDate("");
                              setRentSetupStayType("monthly");
                              setSelectedHistoryResident(null);
                            }}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-green text-white text-xs font-black hover:bg-brand-gold transition-all cursor-pointer shadow-xs"
                          >
                            <IndianRupee className="h-3.5 w-3.5" />
                            Set Rent Now
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-center">
                      <Building2 className="h-8 w-8 text-amber-400 mx-auto mb-2" />
                      <p className="text-xs font-black text-amber-800">Room Not Yet Assigned</p>
                      <p className="text-[11px] text-amber-600 mt-1">This resident is pending allocation.</p>
                    </div>
                  )}
                </div>
              )}

              {/* ===== PAYMENT TAB ===== */}
              {historyTab === "payment" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Payment History & Verification</h3>
                      <p className="text-[10px] text-slate-500 font-medium">Verify online payments & match with Bank SMS</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsRecordPaymentOpen(!isRecordPaymentOpen);
                        setNewPaymentPayerName(selectedHistoryResident.name);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-brand-green hover:bg-brand-gold text-white px-3 py-1.5 text-xs font-black shadow-xs transition-all cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      {isRecordPaymentOpen ? "Close Form" : "Record Payment"}
                    </button>
                  </div>

                  {/* SMS Verification Status Banner */}
                  {smsVerifyStatus && (
                    <div className={`p-3.5 rounded-2xl border text-xs font-bold flex items-start gap-2 animate-in fade-in ${
                      smsVerifyStatus.isMatch
                        ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                        : "bg-amber-50 border-amber-200 text-amber-800"
                    }`}>
                      <CheckCircle className={`h-4 w-4 shrink-0 mt-0.5 ${smsVerifyStatus.isMatch ? "text-emerald-600" : "text-amber-600"}`} />
                      <div className="flex-1">
                        <span>{smsVerifyStatus.message}</span>
                      </div>
                      <button
                        onClick={() => setSmsVerifyStatus(null)}
                        className="text-slate-400 hover:text-slate-600 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {/* RECORD PAYMENT FORM */}
                  {isRecordPaymentOpen && (
                    <form
                      onSubmit={handleAddPayment}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 animate-in zoom-in-95 text-xs font-bold"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                        <span className="font-black text-slate-800 flex items-center gap-1.5">
                          <CreditCard className="h-4 w-4 text-brand-green" /> Record Rent Payment
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">Admin Entry</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-600 mb-1">Amount (₹) *</label>
                          <input
                            type="number"
                            required
                            placeholder="e.g. 5000"
                            value={newPaymentAmount === 0 ? "" : newPaymentAmount}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === "") {
                                setNewPaymentAmount(0);
                              } else {
                                const num = parseInt(val.replace(/^0+/, "") || "0", 10);
                                setNewPaymentAmount(isNaN(num) ? 0 : num);
                              }
                            }}
                            className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-slate-800 outline-none focus:border-brand-green font-black"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-600 mb-1">
                            Transaction ID / UPI Ref {newPaymentMethod === "cash" ? "(Optional for Cash)" : "(Optional)"}
                          </label>
                          <input
                            type="text"
                            placeholder={newPaymentMethod === "cash" ? "Optional for Cash" : "e.g. 412345678912 (Optional)"}
                            value={newPaymentTxnId}
                            onChange={(e) => setNewPaymentTxnId(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-slate-800 outline-none focus:border-brand-green"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-600 mb-1">Payer Full Name</label>
                          <input
                            type="text"
                            value={newPaymentPayerName}
                            onChange={(e) => setNewPaymentPayerName(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-slate-800 outline-none focus:border-brand-green"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-600 mb-1">Payment Received Date *</label>
                          <input
                            type="date"
                            required
                            value={newPaymentDate}
                            onChange={(e) => {
                              const dtStr = e.target.value;
                              setNewPaymentDate(dtStr);
                              if (dtStr) {
                                const dt = new Date(dtStr);
                                if (!isNaN(dt.getTime())) {
                                  setNewPaymentMonth(dt.getMonth() + 1);
                                  setNewPaymentYear(dt.getFullYear());
                                }
                              }
                            }}
                            className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-slate-800 outline-none focus:border-brand-green font-bold"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-600 mb-1">Payment Method</label>
                          <select
                            value={newPaymentMethod}
                            onChange={(e) => setNewPaymentMethod(e.target.value as any)}
                            className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-slate-800 outline-none focus:border-brand-green text-xs font-extrabold"
                          >
                            <option value="cash">Cash 💵</option>
                            <option value="upi">UPI (GPay/PhonePe/Paytm) 📱</option>
                            <option value="bank_transfer">Bank Transfer (NEFT/IMPS) 🏦</option>
                            <option value="other">Other 💳</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-slate-600 mb-1">Rent Month & Year Target</label>
                          <div className="flex items-center gap-1">
                            <select
                              value={newPaymentMonth}
                              onChange={(e) => setNewPaymentMonth(Number(e.target.value))}
                              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-slate-800 outline-none focus:border-brand-green text-xs font-bold"
                            >
                              {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, idx) => (
                                <option key={m} value={idx + 1}>{m}</option>
                              ))}
                            </select>
                            <select
                              value={newPaymentYear}
                              onChange={(e) => setNewPaymentYear(Number(e.target.value))}
                              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-slate-800 outline-none focus:border-brand-green text-xs font-bold"
                            >
                              <option value={2026}>2026</option>
                              <option value={2025}>2025</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsRecordPaymentOpen(false)}
                          className="rounded-xl px-4 py-2 text-slate-500 hover:bg-slate-200 transition text-xs font-bold"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isPaymentSubmitting}
                          className="rounded-xl bg-brand-green hover:bg-brand-gold text-white px-5 py-2 text-xs font-black shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                        >
                          {isPaymentSubmitting ? "Submitting..." : "Submit Payment Record"}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Payment Summary Card */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400">Total Verified Payments</div>
                      <div className="text-2xl font-black text-emerald-400">
                        ₹
                        {(selectedHistoryResident.paymentHistory || [])
                          .filter((p: any) => p.status === "verified")
                          .reduce((sum: number, p: any) => sum + (p.amount || 0), 0)
                          .toLocaleString("en-IN")}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-bold text-slate-400">Records</div>
                      <div className="text-xs font-bold text-slate-200 mt-1">
                        <span className="text-emerald-400">
                          {(selectedHistoryResident.paymentHistory || []).filter((p: any) => p.status === "verified").length} Verified
                        </span>{" "}
                        ·{" "}
                        <span className="text-amber-400">
                          {(selectedHistoryResident.paymentHistory || []).filter((p: any) => p.status === "submitted").length} Pending
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* PAYMENT HISTORY LIST */}
                  {selectedHistoryResident.paymentHistory?.length ? (
                    <div className="space-y-3">
                      {selectedHistoryResident.paymentHistory.map((p: any) => (
                        <div
                          key={p.id}
                          className={`p-4 rounded-2xl border transition-all ${
                            p.status === "verified"
                              ? "bg-emerald-50/50 border-emerald-200"
                              : p.status === "rejected"
                              ? "bg-red-50/50 border-red-200"
                              : "bg-amber-50/50 border-amber-200"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-black text-slate-900">
                                  ₹{(p.amount || 0).toLocaleString("en-IN")}
                                </span>
                                <span className="text-[11px] font-bold text-slate-500">
                                  Month: {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][(p.month || 1) - 1]} {p.year}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-600 font-mono mt-1 flex items-center gap-2">
                                <span>Txn ID: <span className="font-bold text-slate-800">{p.transactionId}</span></span>
                                <button
                                  onClick={() => {
                                    const res = selectedHistoryResident;
                                    const invNo = p.transactionId && !p.transactionId.startsWith("CASH-") && !p.transactionId.startsWith("MANUAL-")
                                      ? p.transactionId
                                      : `INV-${p.id ? String(p.id).slice(-6).toUpperCase() : Math.floor(100000 + Math.random() * 900000)}`;

                                    const pDate = p.paymentDate || p.submittedAt?.substring(0, 10) || new Date().toISOString().substring(0, 10);
                                    const mName = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][(p.month || 1) - 1];

                                    setViewingAdminInvoiceData({
                                      invoiceNo: invNo,
                                      date: pDate,
                                      dueDate: pDate,
                                      tenantName: res?.name || p.payerName || "Resident",
                                      contact: res?.phone || "N/A",
                                      email: res?.email || "N/A",
                                      building: res?.allocatedBuilding || res?.building || "PG A",
                                      floor: res?.allocatedFloor !== undefined ? `Floor ${res.allocatedFloor}` : "Ground Floor",
                                      room: res?.allocatedRoom ? `Room ${res.allocatedRoom}` : "Unallocated",
                                      bed: res?.allocatedBed || "Bed A",
                                      rentAmount: p.amount || 0,
                                      paidAmount: p.amount || 0,
                                      balanceDue: 0,
                                      paymentModes: [(p.paymentMethod || "CASH").toUpperCase()],
                                      notes: `Official Rent Payment Receipt for ${mName} ${p.year}. Payment received & verified successfully.`,
                                    });
                                  }}
                                  className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-2 py-0.5 rounded-md transition cursor-pointer"
                                  title="View Invoice & Download PDF"
                                >
                                  <Receipt className="h-3 w-3" />
                                  <span>View & Download PDF</span>
                                </button>
                              </div>
                              <div className="text-[10px] text-slate-500 mt-0.5">
                                Paid by: <span className="font-bold text-slate-700">{p.payerName}</span> via <span className="uppercase font-bold">{p.paymentMethod || "UPI"}</span>
                              </div>
                            </div>

                            {/* Status Badge */}
                            <div className="text-right space-y-1">
                              {p.status === "verified" && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-300 px-3 py-1 text-[10px] font-black text-emerald-800">
                                  <CheckCircle className="h-3 w-3 text-emerald-600" />
                                  Verified ✅
                                </span>
                              )}
                              {p.status === "submitted" && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-300 px-3 py-1 text-[10px] font-black text-amber-800">
                                  <Clock className="h-3 w-3 text-amber-600" />
                                  Pending Verification
                                </span>
                              )}
                              {p.status === "rejected" && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 border border-red-300 px-3 py-1 text-[10px] font-black text-red-800">
                                  Rejected ❌
                                </span>
                              )}
                            </div>
                          </div>

                          {/* ACTION BUTTONS FOR PENDING PAYMENTS */}
                          {p.status === "submitted" && (
                            <div className="mt-3 pt-3 border-t border-amber-200/80 flex items-center justify-between gap-2">
                              <button
                                type="button"
                                onClick={() => handleVerifyAndRaiseInvoice(selectedHistoryResident.id, p.id)}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-1.5 text-xs font-black shadow-xs transition cursor-pointer"
                              >
                                <Receipt className="h-3.5 w-3.5" />
                                <span>Verify & Raise Invoice</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleRejectPayment(selectedHistoryResident.id, p.id)}
                                className="rounded-xl bg-red-100 hover:bg-red-200 text-red-700 px-3.5 py-1.5 text-xs font-black transition cursor-pointer"
                              >
                                Reject Request
                              </button>
                            </div>
                          )}

                          {/* SMS VERIFICATION DRAWER */}
                          {activeSmsVerifyPaymentId === p.id && (
                            <div className="mt-3 p-3 rounded-xl bg-indigo-50 border border-indigo-200 space-y-2 animate-in fade-in">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-black text-indigo-900">
                                  Paste Bank SMS for Txn #{p.transactionId}
                                </span>
                                <span className="text-[10px] text-indigo-600 font-bold">Auto Match</span>
                              </div>
                              <textarea
                                rows={2}
                                placeholder="Paste received bank SMS here (e.g. SBI/HDFC/Paytm credit SMS)..."
                                value={pasteSmsInput}
                                onChange={(e) => setPasteSmsInput(e.target.value)}
                                className="w-full rounded-xl border border-indigo-200 bg-white p-2.5 text-slate-800 text-[11px] font-mono outline-none focus:border-indigo-500"
                              />
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setActiveSmsVerifyPaymentId(null)}
                                  className="px-3 py-1 text-xs text-slate-500 font-bold"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleVerifyWithSms(selectedHistoryResident.id, p.id)}
                                  className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 text-xs font-black shadow-2xs transition cursor-pointer"
                                >
                                  Run SMS Auto Match ⚡
                                </button>
                              </div>
                            </div>
                          )}

                          {/* DISPLAY MATCHED SMS TEXT IF ANY */}
                          {p.bankSmsText && (
                            <div className="mt-2 text-[10px] font-mono text-slate-500 bg-white/80 p-2 rounded-xl border border-slate-200/70">
                              <span className="font-bold text-slate-700">Bank SMS Record:</span> {p.bankSmsText}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Empty State */
                    <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 text-center space-y-2">
                      <CreditCard className="h-8 w-8 text-slate-300 mx-auto" />
                      <p className="text-xs font-black text-slate-600">No Payment Records Found</p>
                      <p className="text-[11px] text-slate-400">Click "Record Payment" above to record customer online payment or paste bank SMS proof.</p>
                    </div>
                  )}
                </div>
              )}

              {/* ===== COMPLAINT TAB ===== */}
              {historyTab === "complaint" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Complaint History</h3>
                    <span className={`text-[10px] font-black px-3 py-1 rounded-full ${
                      (selectedHistoryResident.complaintHistory || []).filter((c: any) => c.status !== "resolved").length
                        ? "bg-rose-100 text-rose-700 border border-rose-200"
                        : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                    }`}>
                      {selectedHistoryResident.complaintHistory?.length || 0} Total • {(selectedHistoryResident.complaintHistory || []).filter((c: any) => c.status !== "resolved").length} Active
                    </span>
                  </div>

                  {selectedHistoryResident.complaintHistory?.length ? (
                    <div className="space-y-3">
                      {selectedHistoryResident.complaintHistory.map((c: any, i: number) => {
                        const compId = c.id || `comp_${i}`;
                        const isResolved = c.status === "resolved";
                        const isInProgress = c.status === "in_progress";
                        const isPending = !c.status || c.status === "pending";

                        return (
                          <div
                            key={compId}
                            className={`p-4 rounded-2xl border-2 space-y-3 transition-all ${
                              isResolved
                                ? "bg-emerald-50/60 border-emerald-200"
                                : isInProgress
                                  ? "bg-blue-50/70 border-blue-200"
                                  : "bg-rose-50/70 border-rose-200"
                            }`}
                          >
                            {/* Header: Category & Priority & Status Badge */}
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-800 shadow-2xs">
                                  {c.category === "wifi" ? "📶 Wi-Fi" : c.category === "food" ? "🍲 Food / Mess" : c.category === "electricity" ? "⚡ Electricity" : c.category === "plumbing" ? "🚰 Plumbing" : c.category === "cleaning" ? "🧹 Cleaning" : c.category === "maintenance" ? "🔧 Maintenance" : "📝 General"}
                                </span>
                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                                  c.priority === "high"
                                    ? "bg-rose-600 text-white"
                                    : c.priority === "low"
                                      ? "bg-slate-200 text-slate-700"
                                      : "bg-amber-100 text-amber-900 border border-amber-300"
                                }`}>
                                  {c.priority || "Medium"} Priority
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                                  isResolved
                                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                    : isInProgress
                                      ? "bg-blue-100 text-blue-800 border-blue-300"
                                      : "bg-amber-100 text-amber-800 border-amber-300"
                                }`}>
                                  {isResolved ? "✅ Resolved" : isInProgress ? "🔄 In Progress" : "⏳ Pending"}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400">
                                  {c.createdAt ? new Date(c.createdAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" }) : c.date || c.timestamp || "Recently"}
                                </span>
                              </div>
                            </div>

                            {/* Title & Description */}
                            <div className="space-y-1">
                              <h4 className="text-sm font-black text-slate-900">{c.title || c.subject || "Issue Report"}</h4>
                              <p className="text-xs font-semibold text-slate-700 bg-white/80 p-3 rounded-xl border border-slate-200/80 leading-relaxed">
                                {c.description}
                              </p>
                            </div>

                            {/* Admin Note / Response */}
                            {c.adminComment && (
                              <div className="p-2.5 rounded-xl bg-indigo-50/80 border border-indigo-100 text-[11px] font-bold text-indigo-950 flex items-start gap-2">
                                <span className="text-indigo-600 font-black">Admin Reply:</span>
                                <span>{c.adminComment}</span>
                              </div>
                            )}

                            {/* Action Controls for Admin */}
                            <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] font-black text-slate-500 uppercase">Change Status:</span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateComplaintStatus(selectedHistoryResident.id, compId, "pending")}
                                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition cursor-pointer ${
                                    isPending ? "bg-amber-500 text-white shadow-2xs" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                                  }`}
                                >
                                  ⏳ Pending
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateComplaintStatus(selectedHistoryResident.id, compId, "in_progress")}
                                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition cursor-pointer ${
                                    isInProgress ? "bg-blue-600 text-white shadow-2xs" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                                  }`}
                                >
                                  🔄 In Progress
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateComplaintStatus(selectedHistoryResident.id, compId, "resolved")}
                                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition cursor-pointer ${
                                    isResolved ? "bg-emerald-600 text-white shadow-2xs" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                                  }`}
                                >
                                  ✅ Resolved
                                </button>
                              </div>

                              {selectedHistoryResident.phone && (
                                <a
                                  href={`https://wa.me/91${selectedHistoryResident.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
                                    `Hello ${selectedHistoryResident.name}, regarding your complaint "${c.title || c.subject || "Issue"}": We are looking into this.`
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black transition shadow-2xs cursor-pointer"
                                >
                                  <MessageSquare className="h-3 w-3" /> WhatsApp
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100 text-center space-y-2">
                      <MessageSquare className="h-8 w-8 text-slate-300 mx-auto" />
                      <p className="text-xs font-black text-slate-600">No Complaints Filed</p>
                      <p className="text-[11px] text-slate-400">Great! This resident has zero registered complaints.</p>
                    </div>
                  )}
                </div>
              )}

              {/* ===== DOCUMENTS TAB ===== */}
              {historyTab === "documents" && (
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Submitted Documents</h3>
                  {selectedHistoryResident.documents && selectedHistoryResident.documents.trim() !== "" ? (
                    <div className="space-y-2">
                      {selectedHistoryResident.documents.split(",").map((doc: string, i: number) => {
                        const trimmed = doc.trim();
                        const isUrl = trimmed.startsWith("http");
                        // Derive a label: try to infer from common doc names
                        const docLabels = ["Aadhaar Card", "PAN Card", "Photo", "Passport", "Voter ID", "Driving License"];
                        const label = docLabels[i] || `Document ${i + 1}`;
                        return (
                          <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-300 transition">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 border border-indigo-100 flex-shrink-0">
                              <FileText className="h-4 w-4 text-indigo-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-black text-slate-900">{label}</p>
                              <p className="text-[10px] text-slate-400 truncate">{trimmed}</p>
                            </div>
                            {isUrl ? (
                              <a
                                href={trimmed}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-shrink-0 text-[10px] font-black text-indigo-600 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg hover:bg-indigo-100 transition"
                              >
                                View
                              </a>
                            ) : (
                              <span className="flex-shrink-0 text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
                                No Link
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                      <FileText className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-black text-slate-500">No Documents Found</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {selectedHistoryResident.source === 'online'
                          ? "Documents submitted via the Google Form will appear here."
                          : "No documents were submitted for this resident."}
                      </p>
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="px-5 pb-5 border-t border-slate-100 pt-4 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const res = selectedHistoryResident;
                    setSelectedHistoryResident(null);
                    setEditingCustomer({ ...res });
                  }}
                  className="rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit Profile
                </button>
                <button
                  onClick={() => {
                    const res = selectedHistoryResident;
                    setSelectedHistoryResident(null);
                    setActiveTab("Allocation");
                    setSelectedAllocateCustomer(res);
                  }}
                  className="rounded-full bg-brand-green hover:bg-brand-gold text-white px-4 py-2 text-xs font-black shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <KeyRound className="h-3.5 w-3.5" /> Allocate / Change Room
                </button>
              </div>
              <button
                onClick={() => setSelectedHistoryResident(null)}
                className="rounded-full bg-slate-900 text-white px-5 py-2 text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BOOKMYSHOW-STYLE OCCUPANCY EXPLORER MODAL (OCCUPIED vs UNOCCUPIED ROOMS) */}
      {occupancyExplorerModal && occupancyExplorerModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-3xl rounded-[2.5rem] bg-white border border-slate-200 p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${
                  occupancyExplorerModal.mode === "unoccupied"
                    ? "bg-emerald-100/80 text-emerald-700 border-emerald-300"
                    : "bg-rose-100/80 text-rose-600 border-rose-300"
                }`}>
                  {occupancyExplorerModal.mode === "unoccupied" ? <Bed className="h-6 w-6" /> : <CheckCircle2 className="h-6 w-6" />}
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    {occupancyExplorerModal.mode === "unoccupied" ? "🟢 Vacant / Available Rooms Matrix" : "🔴 Occupied Rooms Matrix"}
                  </h2>
                  <p className="text-xs font-semibold text-slate-500">
                    BookMyShow-style seat grid for building room & bed availability
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setOccupancyExplorerModal(null);
                  setSelectedRoomDetails(null);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Mode Switcher Toggle Pill Bar (BookMyShow Standard: Green = Free, Red = Taken) */}
            <div className="flex items-center justify-between gap-3 bg-slate-100 p-1.5 rounded-2xl">
              <button
                onClick={() => setOccupancyExplorerModal({ ...occupancyExplorerModal, mode: "unoccupied" })}
                className={`flex-1 py-2 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  occupancyExplorerModal.mode === "unoccupied"
                    ? "bg-emerald-600 text-white shadow-md"
                    : "text-slate-600 hover:bg-slate-200/70"
                }`}
              >
                🟢 Vacant / Free Rooms ({overallOccupancyStats.totalUnocc})
              </button>
              <button
                onClick={() => setOccupancyExplorerModal({ ...occupancyExplorerModal, mode: "occupied" })}
                className={`flex-1 py-2 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  occupancyExplorerModal.mode === "occupied"
                    ? "bg-rose-600 text-white shadow-md"
                    : "text-slate-600 hover:bg-slate-200/70"
                }`}
              >
                🔴 Occupied Rooms ({overallOccupancyStats.totalOcc})
              </button>
            </div>

            {/* Step 1: Small Building Cards Selection */}
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                1. Select PG Building:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {scopedBuildingsList.map((bld) => {
                  const isSelected = occupancyExplorerModal.selectedBuilding === bld.name;
                  const stats = getBuildingOccupancyDetails(bld.name);
                  const countToShow = occupancyExplorerModal.mode === "unoccupied" ? stats.availableRoomsCount : stats.occupiedRoomsCount;

                  return (
                    <button
                      key={bld.name}
                      onClick={() => setOccupancyExplorerModal({ ...occupancyExplorerModal, selectedBuilding: bld.name })}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? occupancyExplorerModal.mode === "unoccupied"
                            ? "bg-emerald-50 border-emerald-500 shadow-md ring-2 ring-emerald-500/20"
                            : "bg-rose-50 border-rose-500 shadow-md ring-2 ring-rose-500/20"
                          : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-extrabold text-xs text-slate-900">{bld.name}</span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          occupancyExplorerModal.mode === "unoccupied"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-800"
                        }`}>
                          {countToShow} {occupancyExplorerModal.mode === "unoccupied" ? "Vacant" : "Occupied"}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-semibold">{bld.floors} Floors • {stats.totalRooms} Rooms</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: BookMyShow Cinema Seat Layout Grid by Floor with Bed-level Details */}
            {(() => {
              const currentBld = scopedBuildingsList.find((b) => b.name === occupancyExplorerModal.selectedBuilding) || scopedBuildingsList[0];
              if (!currentBld) return null;

              return (
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                      2. Room & Bed Matrix ({currentBld.name} • {occupancyExplorerModal.mode === "unoccupied" ? "Green = Vacant / Free" : "Red = Occupied / Booked"})
                    </span>
                    <span className="text-[11px] font-bold text-slate-500">Tap a room box to view bed breakdown</span>
                  </div>

                  <div className="space-y-3.5 max-h-72 overflow-y-auto p-2 bg-slate-50/70 border border-slate-200/80 rounded-2xl">
                    {getBuildingFloorIndices(currentBld)
                      .filter((flIdx) => getFloorRoomCount(currentBld, flIdx) > 0)
                      .map((flIdx) => {
                      const flName = flIdx === 0 ? "Ground Floor" : flIdx === 1 ? "1st Floor" : flIdx === 2 ? "2nd Floor" : flIdx === 3 ? "3rd Floor" : `${flIdx}th Floor`;
                      const roomCount = getFloorRoomCount(currentBld, flIdx);

                      const roomsOnThisFloor = Array.from({ length: roomCount }, (_, idx) => {
                        const roomNo = flIdx === 0 ? `G${(idx + 1).toString().padStart(2, "0")}` : `${flIdx}${(idx + 1).toString().padStart(2, "0")}`;
                        const rmState = getRoomBedState(currentBld.name, roomNo);

                        return { roomNo, rmState, flIdx, flName };
                      }).filter((r) => (occupancyExplorerModal.mode === "occupied" ? !r.rmState.isVacant : !r.rmState.isFull));

                      return (
                        <div key={flIdx} className="space-y-1.5 bg-white p-3 rounded-xl border border-slate-200/70 shadow-2xs">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-800 border-b border-slate-100 pb-1.5">
                            <span>🏢 {flName}</span>
                            <span className="text-[10px] font-extrabold text-slate-500">
                              {roomsOnThisFloor.length} {occupancyExplorerModal.mode === "unoccupied" ? "Vacant/Partial Room(s)" : "Occupied Room(s)"}
                            </span>
                          </div>

                          {roomsOnThisFloor.length === 0 ? (
                            <p className="text-[11px] text-slate-400 italic py-1">
                              No {occupancyExplorerModal.mode === "unoccupied" ? "vacant" : "occupied"} rooms on this floor.
                            </p>
                          ) : (
                            <div className="flex flex-wrap gap-2 pt-1">
                              {roomsOnThisFloor.map((rm) => {
                                const isGreenVacant = occupancyExplorerModal.mode === "unoccupied";

                                return (
                                  <button
                                    key={rm.roomNo}
                                    onClick={() => {
                                      setSelectedRoomDetails({
                                        roomNo: rm.roomNo,
                                        building: currentBld.name,
                                        floor: rm.flName,
                                        flIdx: rm.flIdx,
                                      } as any);
                                    }}
                                    className={`h-12 min-w-[62px] px-2.5 rounded-xl border-2 font-black text-xs flex flex-col items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95 ${
                                      isGreenVacant
                                        ? "border-emerald-500 bg-emerald-50 text-emerald-900 hover:bg-emerald-600 hover:text-white shadow-emerald-100"
                                        : "border-rose-400 bg-rose-50 text-rose-900 hover:bg-rose-600 hover:text-white shadow-rose-100"
                                    }`}
                                  >
                                    <span>{rm.roomNo}</span>
                                    <span className="text-[8px] tracking-tight opacity-90">
                                      {rm.rmState.freeBedsLabel}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Selected Room Details Bed Breakdown Drawer (Clean Premium Light Card) */}
                  {selectedRoomDetails && (() => {
                    const rmState = getRoomBedState(selectedRoomDetails.building, selectedRoomDetails.roomNo);

                    return (
                      <div className="p-5 rounded-[2rem] bg-gradient-to-b from-slate-50 to-white text-slate-900 space-y-4 text-xs animate-in fade-in shadow-xl border border-slate-200/90">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 font-black">
                          <span className="text-sm flex items-center gap-2 text-slate-900">
                            <Bed className="h-4.5 w-4.5 text-brand-green" /> Room {rmState.roomNo} ({rmState.building} • {selectedRoomDetails.floor})
                          </span>
                          <button
                            onClick={() => setSelectedRoomDetails(null)}
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200/70 hover:bg-slate-300 text-slate-600 transition cursor-pointer"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        <div className={`grid grid-cols-1 ${rmState.beds.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"} gap-3.5 pt-1`}>
                          {rmState.beds.map((b) => (
                            <div
                              key={b.bedName}
                              className={`p-4 rounded-2xl border-2 space-y-2.5 transition-all ${
                                b.isOccupied
                                  ? "bg-rose-50/70 border-rose-200 text-rose-950 shadow-2xs"
                                  : "bg-emerald-50/70 border-emerald-300/80 text-emerald-950 shadow-2xs"
                              }`}
                            >
                              <div className="flex items-center justify-between font-black">
                                <span className="flex items-center gap-1.5 text-xs">🛏️ {b.bedName}</span>
                                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-black border ${
                                  b.isOccupied ? "bg-rose-100 text-rose-800 border-rose-200" : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                }`}>
                                  {b.isOccupied ? "🔴 Occupied" : "🟢 Vacant"}
                                </span>
                              </div>
                              {b.isOccupied ? (
                                <div
                                  onClick={() => b.booking && setSelectedHistoryResident(b.booking)}
                                  className="text-xs font-semibold space-y-1.5 bg-white hover:bg-rose-100/70 p-3 rounded-xl cursor-pointer transition border border-rose-200/90 shadow-2xs group"
                                  title="Click to view full resident profile & history"
                                >
                                  <div className="flex items-center justify-between gap-1">
                                    <p className="text-slate-900 font-black group-hover:text-brand-green group-hover:underline">Occupant: {b.occupantName}</p>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (b.booking) {
                                          setSelectedHistoryResident(b.booking);
                                        }
                                      }}
                                      className="text-[10px] bg-rose-100 group-hover:bg-brand-green text-rose-800 group-hover:text-white px-2.5 py-1 rounded-full font-black flex items-center gap-1 transition shrink-0 cursor-pointer active:scale-95"
                                    >
                                      View Profile 👤
                                    </button>
                                  </div>
                                  {b.occupantPhone && <p className="text-slate-600 font-bold text-[11px]">Phone: {b.occupantPhone}</p>}
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setBmsBuilding(rmState.building);
                                    setBmsFloor((selectedRoomDetails as any).flIdx || 0);
                                    setBmsRoom(rmState.roomNo);
                                    setBmsBed(b.bedName);
                                    setOccupancyExplorerModal(null);
                                    setActiveTab("Allocation");
                                  }}
                                  className="mt-2 w-full py-2 rounded-xl bg-brand-green hover:bg-brand-gold text-white text-xs font-black transition cursor-pointer shadow-xs active:scale-95"
                                >
                                  Allocate {b.bedName} Now →
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* FLOATING ACTION BUTTON (FAB) — MOBILE ONLY                       */}
      {/* ═══════════════════════════════════════════════════════════════════ */}

      {/* FAB Backdrop */}
      {isFabMenuOpen && (
        <div
          onClick={() => setIsFabMenuOpen(false)}
          className="fixed inset-0 z-[45] bg-slate-900/40 backdrop-blur-[2px] transition-opacity lg:hidden"
        />
      )}

      {/* FAB Expandable Action Menu */}
      <div className={`fixed right-4 z-[46] lg:hidden transition-all duration-300 ease-out ${
        isFabMenuOpen ? "bottom-24" : "bottom-20"
      }`}>
        {/* Expanded Actions List */}
        {isFabMenuOpen && (
          <div className="mb-3 flex flex-col items-end gap-2.5 animate-in slide-in-from-bottom-4 fade-in duration-200">
            {[
              { label: "Add Customer", icon: UserPlus, action: () => { setIsCreateModalOpen(true); setIsFabMenuOpen(false); }, color: "bg-emerald-600" },
              { label: "Add Building", icon: Building2, action: () => { setIsAddBuildingModalOpen(true); setIsFabMenuOpen(false); }, color: "bg-blue-600" },
              { label: "Allocate Room", icon: KeyRound, action: () => { handleTabClick("Allocation"); setIsFabMenuOpen(false); }, color: "bg-indigo-600" },
              { label: "Record Expense", icon: CreditCard, action: () => { resetExpenseForm(); setIsExpenseModalOpen(true); setIsFabMenuOpen(false); }, color: "bg-amber-600" },
              { label: "Create Invoice", icon: Receipt, action: () => { handleTabClick("Invoice"); setIsFabMenuOpen(false); }, color: "bg-purple-600" },
            ].map((item, i) => (
              <button
                key={item.label}
                onClick={item.action}
                className="flex items-center gap-2.5 active:scale-95 transition-all cursor-pointer"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <span className="px-3 py-1.5 rounded-full bg-white text-slate-800 text-xs font-bold shadow-lg border border-slate-200">
                  {item.label}
                </span>
                <span className={`flex h-10 w-10 items-center justify-center rounded-full ${item.color} text-white shadow-lg`}>
                  <item.icon className="h-4.5 w-4.5" />
                </span>
              </button>
            ))}
          </div>
        )}

        {/* FAB Main Button */}
        <button
          onClick={() => setIsFabMenuOpen(!isFabMenuOpen)}
          className={`flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-brand-green via-emerald-600 to-emerald-500 text-white shadow-xl shadow-brand-green/40 border-[3px] border-white active:scale-90 transition-all duration-300 cursor-pointer ${
            isFabMenuOpen ? "rotate-45 scale-110" : "rotate-0"
          }`}
          title="Quick Actions"
        >
          <Plus className="h-7 w-7 stroke-[3]" />
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MORE DRAWER — SLIDE-UP SHEET (MOBILE ONLY)                       */}
      {/* ═══════════════════════════════════════════════════════════════════ */}

      {/* More Drawer Backdrop */}
      {isMoreDrawerOpen && (
        <div
          onClick={() => setIsMoreDrawerOpen(false)}
          className="fixed inset-0 z-[55] bg-slate-900/40 backdrop-blur-[2px] transition-opacity lg:hidden"
        />
      )}

      {/* More Drawer Sheet */}
      <div className={`fixed bottom-0 left-0 right-0 z-[56] lg:hidden transition-transform duration-300 ease-out ${
        isMoreDrawerOpen ? "translate-y-0" : "translate-y-full"
      }`}>
        <div className="bg-white rounded-t-3xl shadow-2xl border-t border-slate-200 px-5 pt-3 pb-8 max-h-[70vh] overflow-y-auto">
          {/* Drawer Handle */}
          <div className="flex justify-center mb-4">
            <div className="h-1.5 w-12 rounded-full bg-slate-300" />
          </div>

          {/* Drawer Title */}
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-black text-slate-900">More Features</h3>
            <button
              onClick={() => setIsMoreDrawerOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Drawer Menu Grid */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { name: "Revenue", icon: Wallet, color: "bg-emerald-100 text-emerald-700", borderColor: "border-emerald-200" },
              { name: "Reports", icon: FileSpreadsheet, color: "bg-blue-100 text-blue-700", borderColor: "border-blue-200" },
              { name: "Invoice", icon: Receipt, color: "bg-purple-100 text-purple-700", borderColor: "border-purple-200", badge: pendingPaymentsCount },
              { name: "Allocation", icon: KeyRound, color: "bg-indigo-100 text-indigo-700", borderColor: "border-indigo-200" },
              { name: "Settings", icon: Settings, color: "bg-slate-100 text-slate-700", borderColor: "border-slate-200" },
            ].map((item) => (
              <button
                key={item.name}
                onClick={() => {
                  handleTabClick(item.name);
                  setIsMoreDrawerOpen(false);
                }}
                className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all active:scale-95 cursor-pointer ${
                  activeTab === item.name
                    ? `${item.color} ${item.borderColor} shadow-sm`
                    : `bg-white border-slate-200 hover:bg-slate-50`
                }`}
              >
                <item.icon className={`h-6 w-6 ${
                  activeTab === item.name ? "" : "text-slate-500"
                }`} />
                <span className={`text-[11px] font-bold ${
                  activeTab === item.name ? "" : "text-slate-600"
                }`}>{item.name}</span>
                {item.badge && item.badge > 0 && (
                  <span className="absolute top-2 right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-black text-white px-1">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Admin-Only Actions Section */}
          {!isStaffMode && (
            <div className="border-t border-slate-100 pt-4 space-y-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Admin Management</p>
              <button
                onClick={() => {
                  setIsStaffModalOpen(true);
                  setIsMoreDrawerOpen(false);
                }}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 hover:bg-emerald-50 transition cursor-pointer active:scale-[0.98]"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                  <UserCheck className="h-4.5 w-4.5" />
                </div>
                <span>Staff & Buildings</span>
              </button>
              <button
                onClick={() => {
                  setIsPaymentSettingsModalOpen(true);
                  setIsMoreDrawerOpen(false);
                }}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 hover:bg-amber-50 transition cursor-pointer active:scale-[0.98]"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                  <QrCode className="h-4.5 w-4.5" />
                </div>
                <span>Payment & QR</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* BOTTOM NAVIGATION BAR — 5-ITEM DOCK (MOBILE ONLY)                */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 px-2 py-1.5 flex lg:hidden shadow-2xl items-center justify-around" style={{ paddingBottom: 'max(0.375rem, env(safe-area-inset-bottom))' }}>
        {/* Tab 1: Dashboard / Home */}
        <button
          onClick={() => handleTabClick("Dashboard")}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all active:scale-90 cursor-pointer ${
            activeTab === "Dashboard" ? "text-brand-green font-black" : "text-slate-400 hover:text-slate-700"
          }`}
        >
          <LayoutDashboard className={`h-5 w-5 ${activeTab === "Dashboard" ? "stroke-[2.5]" : "stroke-[1.5]"}`} />
          <span className="text-[10px] font-bold mt-0.5">Home</span>
          {activeTab === "Dashboard" && <span className="h-1 w-1 rounded-full bg-brand-green mt-0.5" />}
        </button>

        {/* Tab 2: Customers / Residents */}
        <button
          onClick={() => handleTabClick("Customers")}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all active:scale-90 cursor-pointer ${
            activeTab === "Customers" ? "text-brand-green font-black" : "text-slate-400 hover:text-slate-700"
          }`}
        >
          <Users className={`h-5 w-5 ${activeTab === "Customers" ? "stroke-[2.5]" : "stroke-[1.5]"}`} />
          <span className="text-[10px] font-bold mt-0.5">Customers</span>
          {activeTab === "Customers" && <span className="h-1 w-1 rounded-full bg-brand-green mt-0.5" />}
        </button>

        {/* Tab 3: Buildings */}
        <button
          onClick={() => handleTabClick("Buildings")}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all active:scale-90 cursor-pointer ${
            activeTab === "Buildings" ? "text-brand-green font-black" : "text-slate-400 hover:text-slate-700"
          }`}
        >
          <Building2 className={`h-5 w-5 ${activeTab === "Buildings" ? "stroke-[2.5]" : "stroke-[1.5]"}`} />
          <span className="text-[10px] font-bold mt-0.5">Buildings</span>
          {activeTab === "Buildings" && <span className="h-1 w-1 rounded-full bg-brand-green mt-0.5" />}
        </button>

        {/* Tab 4: Payments */}
        <button
          onClick={() => handleTabClick("Revenue")}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all active:scale-90 cursor-pointer ${
            activeTab === "Revenue" ? "text-brand-green font-black" : "text-slate-400 hover:text-slate-700"
          }`}
        >
          <CreditCard className={`h-5 w-5 ${activeTab === "Revenue" ? "stroke-[2.5]" : "stroke-[1.5]"}`} />
          <span className="text-[10px] font-bold mt-0.5">Payments</span>
          {activeTab === "Revenue" && <span className="h-1 w-1 rounded-full bg-brand-green mt-0.5" />}
        </button>

        {/* Tab 5: More — opens the More Drawer */}
        {(() => {
          const moreTabNames = ["Reports", "Invoice", "Allocation", "Settings"];
          const isOtherActive = moreTabNames.includes(activeTab);

          return (
            <button
              onClick={() => setIsMoreDrawerOpen(true)}
              className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all active:scale-90 cursor-pointer ${
                isOtherActive || isMoreDrawerOpen ? "text-brand-green font-black" : "text-slate-400 hover:text-slate-700"
              }`}
            >
              <div className="relative">
                <Menu className={`h-5 w-5 ${isOtherActive ? "stroke-[2.5]" : "stroke-[1.5]"}`} />
                {(pendingPaymentsCount > 0 || activeComplaintsCount > 0) && (
                  <span className="absolute -top-1 -right-1.5 h-2 w-2 rounded-full bg-rose-600 ring-2 ring-white animate-pulse" />
                )}
              </div>
              <span className="text-[10px] font-bold mt-0.5">More</span>
              {isOtherActive && <span className="h-1 w-1 rounded-full bg-brand-green mt-0.5" />}
            </button>
          );
        })()}
      </div>

      {/* REAL PAYMENT DETAILS & QR CODE CONTROL MODAL */}
      {isPaymentSettingsModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in" onClick={() => setIsPaymentSettingsModalOpen(false)}>
          <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] bg-white p-6 sm:p-8 shadow-2xl border border-slate-200 text-slate-900 space-y-6 animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-slate-900 text-brand-gold font-bold">
                  <QrCode className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black">Official Payment & QR Settings</h2>
                  <p className="text-xs font-semibold text-slate-500">Configure real PG UPI ID, QR code image & Bank details for residents</p>
                </div>
              </div>
              <button
                onClick={() => setIsPaymentSettingsModalOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {paymentSettingsMsg && (
              <div className={`p-3.5 rounded-2xl border text-xs font-bold ${paymentSettingsMsg.includes("✓") ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800"}`}>
                {paymentSettingsMsg}
              </div>
            )}

            <form onSubmit={handleSavePaymentSettings} className="space-y-5 text-xs font-bold">
              {/* SECTION 1: OFFICIAL UPI & QR CODE */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
                <div className="flex items-center gap-2 text-slate-900 font-black text-xs uppercase tracking-wider">
                  <QrCode className="h-4 w-4 text-brand-green" />
                  <span>1. Official PG UPI ID & QR Code</span>
                </div>

                <div>
                  <label className="block text-slate-600 mb-1">Official UPI ID (GPay / PhonePe / Paytm)</label>
                  <input
                    type="text"
                    required
                    value={paymentSettings.upiId}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, upiId: e.target.value })}
                    placeholder="e.g. shripadpg@okaxis"
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-mono font-black text-slate-900 focus:ring-2 focus:ring-brand-green/30 focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-slate-600">Upload Real QR Code Image (File or Data URL)</label>
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleQrUpload}
                      className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-brand-green file:text-white hover:file:bg-brand-gold cursor-pointer"
                    />
                  </div>
                  <div className="pt-1">
                    <label className="block text-[11px] text-slate-500 font-semibold mb-1">OR Enter Direct Image URL (Optional):</label>
                    <input
                      type="text"
                      value={paymentSettings.qrCodeUrl && !paymentSettings.qrCodeUrl.startsWith("data:") ? paymentSettings.qrCodeUrl : ""}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, qrCodeUrl: e.target.value })}
                      placeholder="https://example.com/my-pg-qr.png"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800"
                    />
                  </div>
                </div>

                {/* LIVE PREVIEW OF QR CODE CARD */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-brand-navy text-white space-y-3 shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-black tracking-widest text-brand-gold bg-brand-gold/15 px-2.5 py-0.5 rounded-full border border-brand-gold/30">
                      Resident View Preview
                    </span>
                    <QrCode className="h-5 w-5 text-brand-gold" />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-24 w-24 shrink-0 rounded-2xl bg-white p-1.5 flex items-center justify-center overflow-hidden border border-brand-gold/40 shadow-md">
                      {paymentSettings.qrCodeUrl ? (
                        <img src={paymentSettings.qrCodeUrl} alt="QR Code Preview" className="h-full w-full object-contain rounded-xl" />
                      ) : (
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=${paymentSettings.upiId}&pn=${encodeURIComponent(paymentSettings.accountName)}`)}`}
                          alt="Generated QR Code"
                          className="h-full w-full object-contain rounded-xl"
                        />
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-slate-300 font-semibold">Official PG UPI ID</p>
                      <p className="text-base font-black text-brand-gold font-mono tracking-wide mt-0.5">{paymentSettings.upiId || "shripadpg@okaxis"}</p>
                      <p className="text-[10px] text-emerald-400 font-bold mt-1">✓ Live Auto-Generated / Custom QR Active</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: BANK ACCOUNT TRANSFER DETAILS */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex items-center gap-2 text-slate-900 font-black text-xs uppercase tracking-wider">
                  <Landmark className="h-4 w-4 text-brand-green" />
                  <span>2. PG Bank Account Transfer Details</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1">Bank Name</label>
                    <input
                      type="text"
                      required
                      value={paymentSettings.bankName}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, bankName: e.target.value })}
                      placeholder="e.g. Axis Bank Ltd"
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Account Number</label>
                    <input
                      type="text"
                      required
                      value={paymentSettings.accountNo}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, accountNo: e.target.value })}
                      placeholder="e.g. 924020058192041"
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-mono font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">IFSC Code</label>
                    <input
                      type="text"
                      required
                      value={paymentSettings.ifscCode}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, ifscCode: e.target.value })}
                      placeholder="e.g. UTIB0001824"
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-mono font-bold text-slate-900 uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Account Holder / Name</label>
                    <input
                      type="text"
                      required
                      value={paymentSettings.accountName}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, accountName: e.target.value })}
                      placeholder="e.g. Shripad PG Services"
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: PG SUPPORT & WARDEN HOTLINE NUMBERS */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex items-center gap-2 text-slate-900 font-black text-xs uppercase tracking-wider">
                  <PhoneCall className="h-4 w-4 text-brand-green" />
                  <span>3. PG Support & Warden Hotline Numbers</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1">PG Admin Desk Phone Number</label>
                    <input
                      type="text"
                      required
                      value={paymentSettings.adminPhone || ""}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, adminPhone: e.target.value })}
                      placeholder="e.g. +91 98765 43210"
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Warden & Maintenance Hotline</label>
                    <input
                      type="text"
                      required
                      value={paymentSettings.wardenPhone || ""}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, wardenPhone: e.target.value })}
                      placeholder="e.g. +91 98765 00000"
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* SAVE BUTTON */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingPaymentSettings}
                  className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-2xl text-xs font-black text-white bg-brand-green hover:bg-brand-gold shadow-lg shadow-brand-green/30 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{isSavingPaymentSettings ? "Saving Settings..." : "Save Payment Details & QR Code"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* LOG EXPENSE & SPEND MODAL */}
      {isExpenseModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in"
          onClick={() => setIsExpenseModalOpen(false)}
        >
          <div
            className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 animate-in zoom-in-95 p-6 sm:p-8 space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <CreditCard className="h-6 w-6 text-brand-green" />
                  {editingExpId ? "Edit Expense Record" : "Log New Expense / Spend 💸"}
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Record operational costs for electricity, mess food, salaries, or maintenance.
                </p>
              </div>
              <button
                onClick={() => setIsExpenseModalOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">Expense Title *</label>
                <input
                  type="text"
                  required
                  value={expTitle}
                  onChange={(e) => setExpTitle(e.target.value)}
                  placeholder="e.g. July Electricity Bill, Mess Grocery Supply, Wi-Fi Recharge"
                  className="w-full rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3 text-xs font-bold text-slate-800 outline-none focus:border-brand-green focus:bg-white transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-extrabold text-slate-700">Category *</label>
                    {isCustomCategorySelected && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomCategorySelected(false);
                          setExpCategory("maintenance");
                        }}
                        className="text-[10px] font-extrabold text-brand-green hover:underline cursor-pointer"
                      >
                        ← Back to Presets
                      </button>
                    )}
                  </div>
                  {!isCustomCategorySelected ? (
                    <select
                      value={expCategory}
                      onChange={(e) => {
                        if (e.target.value === "__CREATE_CUSTOM__") {
                          setIsCustomCategorySelected(true);
                        } else {
                          setExpCategory(e.target.value);
                        }
                      }}
                      className="w-full rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3 text-xs font-bold text-slate-800 outline-none focus:border-brand-green focus:bg-white transition cursor-pointer"
                    >
                      <optgroup label="Standard Categories">
                        <option value="electricity">⚡ Electricity & Water</option>
                        <option value="food">🍱 Food & Mess Catering</option>
                        <option value="maintenance">🔧 Maintenance & Repairs</option>
                        <option value="salaries">💼 Staff Salaries</option>
                        <option value="rent_lease">🏢 Rent & Lease</option>
                        <option value="wifi_utilities">🌐 Wi-Fi & Internet</option>
                        <option value="other">📝 Other Expense</option>
                      </optgroup>
                      {customCategoriesList.length > 0 && (
                        <optgroup label="Custom Created Categories">
                          {customCategoriesList.map((cat) => (
                            <option key={cat} value={cat}>
                              ✨ {cat}
                            </option>
                          ))}
                        </optgroup>
                      )}
                      <optgroup label="Action">
                        <option value="__CREATE_CUSTOM__">➕ + Add Custom Category...</option>
                      </optgroup>
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      value={customCategoryInput}
                      onChange={(e) => setCustomCategoryInput(e.target.value)}
                      placeholder="Type custom category name (e.g. Security, Laundry, Generator Fuel)..."
                      className="w-full rounded-2xl bg-emerald-50/70 border border-emerald-300 px-4 py-3 text-xs font-bold text-slate-800 outline-none focus:border-brand-green focus:bg-white transition"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={expAmount}
                    onChange={(e) => setExpAmount(e.target.value)}
                    placeholder="e.g. 15000"
                    className="w-full rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3 text-xs font-bold text-slate-800 outline-none focus:border-brand-green focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">Building *</label>
                  <select
                    value={expBuilding}
                    onChange={(e) => setExpBuilding(e.target.value)}
                    className="w-full rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3 text-xs font-bold text-slate-800 outline-none focus:border-brand-green focus:bg-white transition"
                  >
                    {scopedBuildingsList.map((b) => (
                      <option key={b.name} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                    <option value="ALL">ALL (General Expense)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">Expense Date *</label>
                  <input
                    type="date"
                    required
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    className="w-full rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3 text-xs font-bold text-slate-800 outline-none focus:border-brand-green focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">Notes / Description (Optional)</label>
                <textarea
                  rows={2}
                  value={expNotes}
                  onChange={(e) => setExpNotes(e.target.value)}
                  placeholder="Additional details regarding invoice number, vendor name, or transaction ID..."
                  className="w-full rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3 text-xs font-medium text-slate-800 outline-none focus:border-brand-green focus:bg-white transition resize-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-xs font-extrabold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-2xl bg-brand-green hover:bg-emerald-700 text-white font-extrabold text-xs px-6 py-3 shadow-lg shadow-brand-green/20 transition cursor-pointer active:scale-95"
                >
                  {editingExpId ? "Save Changes" : "Record Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STAFF MANAGEMENT & BUILDING ASSIGNMENT MODAL */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in" onClick={() => setIsStaffModalOpen(false)}>
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 animate-in zoom-in-95 p-5 sm:p-7 space-y-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <UserCheck className="h-6 w-6 text-brand-green" /> Staff & Building Assignments
                </h2>
                <p className="text-xs text-slate-500 font-medium">Assign staff members to specific PG buildings for dedicated building management</p>
              </div>
              <button onClick={() => setIsStaffModalOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Staff Registration & Assignment Form */}
            <form onSubmit={handleSaveStaffMember} className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                  <UserPlus className="h-4 w-4 text-emerald-700" /> {editingStaffId ? "Edit Staff Member" : "Add New Staff Member"}
                </span>
                {editingStaffId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingStaffId(null);
                      setNewStaffName("");
                      setNewStaffPhone("");
                      setNewStaffEmail("");
                      setNewStaffRole("building_manager");
                      setNewStaffAssignedBuildings(["PG A"]);
                    }}
                    className="text-xs font-bold text-rose-700 hover:underline cursor-pointer"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Staff Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={newStaffName}
                    onChange={(e) => setNewStaffName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-bold text-slate-900 outline-none focus:border-brand-green"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9812345678"
                    value={newStaffPhone}
                    onChange={(e) => setNewStaffPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-bold text-slate-900 outline-none focus:border-brand-green"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Login Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. ramesh@shripadpg.com"
                    value={newStaffEmail}
                    onChange={(e) => setNewStaffEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-bold text-slate-900 outline-none focus:border-brand-green"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Fixed Login Password *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ramesh123"
                    value={newStaffPassword}
                    onChange={(e) => setNewStaffPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-bold text-slate-900 outline-none focus:border-brand-green"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Staff Management Role</label>
                <select
                  value={newStaffRole}
                  onChange={(e) => setNewStaffRole(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-bold text-slate-900 outline-none focus:border-brand-green cursor-pointer"
                >
                  <option value="building_manager">Building Manager</option>
                  <option value="caretaker">Caretaker / Supervisor</option>
                  <option value="super_admin">Super Admin (All Buildings)</option>
                </select>
              </div>

              {/* Building Selection Checkboxes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Assigned PG Buildings:</label>
                <div className="flex flex-wrap items-center gap-2.5 bg-white p-3 rounded-xl border border-slate-200">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newStaffAssignedBuildings.includes("ALL")}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewStaffAssignedBuildings(["ALL"]);
                        } else {
                          setNewStaffAssignedBuildings([buildingsList[0]?.name || "PG A"]);
                        }
                      }}
                      className="h-4 w-4 accent-emerald-600 rounded cursor-pointer"
                    />
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-extrabold text-[11px]">ALL Buildings (Master Access)</span>
                  </label>

                  {!newStaffAssignedBuildings.includes("ALL") &&
                    buildingsList.map((bld) => (
                      <label key={bld.name} className="flex items-center gap-1.5 text-xs font-bold text-slate-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newStaffAssignedBuildings.includes(bld.name)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewStaffAssignedBuildings((prev) => [...prev.filter((x) => x !== "ALL"), bld.name]);
                            } else {
                              setNewStaffAssignedBuildings((prev) => prev.filter((x) => x !== bld.name));
                            }
                          }}
                          className="h-4 w-4 accent-brand-green rounded cursor-pointer"
                        />
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-800 border border-slate-200">🏢 {bld.name}</span>
                      </label>
                    ))}
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-brand-green hover:bg-brand-gold text-white font-black text-xs transition cursor-pointer shadow-md active:scale-95"
                >
                  {editingStaffId ? "Update Staff Member" : "+ Save & Assign Staff Credentials"}
                </button>
              </div>
            </form>

            {/* List of Registered Staff Members */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Allocated Staff Members & Access Credentials ({staffList.filter((st) => st.role !== "super_admin").length})
              </h3>
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {staffList.filter((st) => st.role !== "super_admin").length === 0 ? (
                  <div className="p-4 text-center text-xs font-bold text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                    No staff members allocated yet. Use the form above to allocate a staff member.
                  </div>
                ) : (
                  staffList
                    .filter((st) => st.role !== "super_admin")
                    .map((st) => (
                  <div key={st.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 hover:border-slate-300 transition">
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900">{st.name}</span>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-brand-navy text-white">
                          {st.role === "super_admin" ? "Super Admin" : st.role === "building_manager" ? "Building Manager" : "Caretaker"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-bold flex items-center gap-2">
                        <span>📞 {st.phone}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 font-mono text-[11px]">
                          ✉️ Login: {st.email}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="inline-flex items-center gap-1.5 text-indigo-900 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-200 font-mono text-[11px]">
                          <span>🔒 Password: {showStaffPasswordMap[st.id] ? (st.password || "ramesh123") : "••••••••"}</span>
                          <button
                            type="button"
                            onClick={() => setShowStaffPasswordMap((prev) => ({ ...prev, [st.id]: !prev[st.id] }))}
                            className="text-indigo-600 hover:text-indigo-950 transition cursor-pointer p-0.5 rounded-md hover:bg-indigo-100/80"
                            title={showStaffPasswordMap[st.id] ? "Hide Password" : "Show Password"}
                          >
                            {showStaffPasswordMap[st.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </button>
                        </span>
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <span className="text-[10px] font-bold text-slate-400">Assigned Property:</span>
                        {st.assignedBuildings.includes("ALL") ? (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-200">👑 All Buildings</span>
                        ) : (
                          st.assignedBuildings.map((b) => (
                            <span key={b} className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-800">
                              🏢 {b}
                            </span>
                          ))
                        )}
                      </div>
                    </div>

                    {st.role !== "super_admin" && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            const text = `📋 SHRIPAD PG - DEDICATED STAFF CREDENTIALS\n\n👤 Staff Name: ${st.name}\n📞 Phone: ${st.phone}\n🏢 Dedicated Property: ${st.assignedBuildings.join(", ")}\n🌐 Staff Portal URL: http://localhost:8081/staff/login\n✉️ Login ID (Email): ${st.email}\n🔑 Fixed Password: ${st.password || "ramesh123"}`;
                            navigator.clipboard.writeText(text);
                            setCopiedStaffId(st.id);
                            setTimeout(() => setCopiedStaffId(null), 2500);
                          }}
                          className="px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-xl transition cursor-pointer flex items-center gap-1"
                        >
                          <Copy className="h-3.5 w-3.5 text-emerald-600" />
                          <span>{copiedStaffId === st.id ? "Copied!" : "Copy Credentials"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingStaffId(st.id);
                            setNewStaffName(st.name);
                            setNewStaffPhone(st.phone);
                            setNewStaffEmail(st.email);
                            setNewStaffPassword(st.password || "ramesh123");
                            setNewStaffRole(st.role);
                            setNewStaffAssignedBuildings(st.assignedBuildings);
                          }}
                          className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteStaffMember(st.id, st.name)}
                          className="px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-xl transition cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INVOICE VIEW & DOWNLOAD MODAL */}
      {viewingAdminInvoiceData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in" onClick={() => setViewingAdminInvoiceData(null)}>
          <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 animate-in zoom-in-95 p-4 sm:p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-brand-green" />
                <h2 className="text-lg font-black text-slate-900">Official Rent Payment Receipt</h2>
              </div>
              <button onClick={() => setViewingAdminInvoiceData(null)} className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <InvoiceDesign
              initialInvoiceData={viewingAdminInvoiceData}
              readOnly={true}
              hideHeaderTabs={true}
              hideTopBar={true}
            />
          </div>
        </div>
      )}

      {/* CENTRAL COMPLAINTS MANAGEMENT HUB MODAL */}
      {isComplaintsHubModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in" onClick={() => setIsComplaintsHubModalOpen(false)}>
          <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 animate-in zoom-in-95 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-rose-50/50 via-white to-slate-50">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-700 shadow-sm">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    Complaints & Service Hub
                    {activeComplaintsCount > 0 && (
                      <span className="bg-rose-600 text-white text-xs px-2.5 py-0.5 rounded-full font-black animate-pulse">
                        {activeComplaintsCount} Active
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Real-time issue ticketing system for Wi-Fi, Food, Electricity, Plumbing & Maintenance
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsComplaintsHubModalOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Filter Toolbar & Search Bar */}
            <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70 space-y-3">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                {/* Status Tabs */}
                <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-slate-200 shadow-2xs w-full sm:w-auto overflow-x-auto">
                  {(["all", "pending", "in_progress", "resolved"] as const).map((st) => {
                    const count = st === "all"
                      ? allComplaintsList.length
                      : allComplaintsList.filter((item) =>
                          st === "pending"
                            ? !item.complaint.status || item.complaint.status === "pending"
                            : item.complaint.status === st
                        ).length;

                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setComplaintsHubFilter(st)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                          complaintsHubFilter === st
                            ? st === "pending"
                              ? "bg-rose-600 text-white shadow-2xs"
                              : st === "in_progress"
                                ? "bg-blue-600 text-white shadow-2xs"
                                : st === "resolved"
                                  ? "bg-emerald-600 text-white shadow-2xs"
                                  : "bg-slate-900 text-white shadow-2xs"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                        }`}
                      >
                        <span>{st === "all" ? "All" : st === "pending" ? "Pending" : st === "in_progress" ? "In Progress" : "Resolved"}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                          complaintsHubFilter === st ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Search Input */}
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search resident, room, title..."
                    value={complaintsHubSearch}
                    onChange={(e) => setComplaintsHubSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-rose-500 transition"
                  />
                  {complaintsHubSearch && (
                    <button onClick={() => setComplaintsHubSearch("")} className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider shrink-0">Category:</span>
                {[
                  { id: "all", label: "All Categories" },
                  { id: "wifi", label: "📶 Wi-Fi" },
                  { id: "food", label: "🍲 Food / Mess" },
                  { id: "electricity", label: "⚡ Electricity" },
                  { id: "plumbing", label: "🚰 Plumbing" },
                  { id: "cleaning", label: "🧹 Cleaning" },
                  { id: "maintenance", label: "🔧 Maintenance" },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setComplaintsHubCategoryFilter(cat.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition cursor-pointer whitespace-nowrap ${
                      complaintsHubCategoryFilter === cat.id
                        ? "bg-slate-800 text-white shadow-2xs scale-105"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Complaints List Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 max-h-[60vh]">
              {(() => {
                const filtered = allComplaintsList.filter((item) => {
                  const c = item.complaint;
                  // Status filter
                  if (complaintsHubFilter !== "all") {
                    const effectiveStatus = c.status || "pending";
                    if (effectiveStatus !== complaintsHubFilter) return false;
                  }
                  // Category filter
                  if (complaintsHubCategoryFilter !== "all") {
                    if ((c.category || "").toLowerCase() !== complaintsHubCategoryFilter.toLowerCase()) return false;
                  }
                  // Search query
                  if (complaintsHubSearch.trim()) {
                    const q = complaintsHubSearch.toLowerCase();
                    const matchName = item.residentName.toLowerCase().includes(q);
                    const matchRoom = item.room.toLowerCase().includes(q);
                    const matchBuilding = item.building.toLowerCase().includes(q);
                    const matchTitle = (c.title || c.subject || "").toLowerCase().includes(q);
                    const matchDesc = (c.description || "").toLowerCase().includes(q);
                    if (!matchName && !matchRoom && !matchBuilding && !matchTitle && !matchDesc) return false;
                  }
                  return true;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="py-16 text-center space-y-3">
                      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-50 text-slate-300 mx-auto border border-slate-100 shadow-inner">
                        <MessageSquare className="h-8 w-8" />
                      </div>
                      <p className="text-sm font-black text-slate-700">No Complaints Found</p>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        There are currently no complaints matching your selected filter. All issues may be resolved!
                      </p>
                    </div>
                  );
                }

                return filtered.map((item, idx) => {
                  const c = item.complaint;
                  const compId = c.id || `comp_${idx}`;
                  const isResolved = c.status === "resolved";
                  const isInProgress = c.status === "in_progress";
                  const isPending = !c.status || c.status === "pending";
                  const replyText = complaintAdminReplies[compId] !== undefined ? complaintAdminReplies[compId] : (c.adminComment || "");

                  return (
                    <div
                      key={compId}
                      className={`p-4 sm:p-5 rounded-2xl border-2 space-y-3 transition-all ${
                        isResolved
                          ? "bg-emerald-50/50 border-emerald-200"
                          : isInProgress
                            ? "bg-blue-50/60 border-blue-200 shadow-sm"
                            : "bg-rose-50/60 border-rose-200 shadow-sm"
                      }`}
                    >
                      {/* Resident Info & Badges Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-slate-200/70">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-slate-200 shadow-2xs">
                            <User className="h-3.5 w-3.5 text-slate-600" />
                            <span className="text-xs font-black text-slate-900">{item.residentName}</span>
                            <span className="text-[10px] font-bold text-slate-400">•</span>
                            <span className="text-xs font-extrabold text-indigo-700">{item.building} (Room {item.room} - {item.bed})</span>
                          </div>

                          <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 shadow-2xs">
                            {c.category === "wifi" ? "📶 Wi-Fi" : c.category === "food" ? "🍲 Food / Mess" : c.category === "electricity" ? "⚡ Electricity" : c.category === "plumbing" ? "🚰 Plumbing" : c.category === "cleaning" ? "🧹 Cleaning" : c.category === "maintenance" ? "🔧 Maintenance" : "📝 General"}
                          </span>

                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg ${
                            c.priority === "high"
                              ? "bg-rose-600 text-white"
                              : c.priority === "low"
                                ? "bg-slate-200 text-slate-700"
                                : "bg-amber-100 text-amber-900 border border-amber-300"
                          }`}>
                            {c.priority || "Medium"} Priority
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-black px-3 py-1 rounded-full border ${
                            isResolved
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                              : isInProgress
                                ? "bg-blue-100 text-blue-800 border-blue-300"
                                : "bg-amber-100 text-amber-800 border-amber-300"
                          }`}>
                            {isResolved ? "✅ Resolved" : isInProgress ? "🔄 In Progress" : "⏳ Pending"}
                          </span>
                          <span className="text-[11px] font-bold text-slate-400">
                            {c.createdAt ? new Date(c.createdAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" }) : c.date || c.timestamp || "Recently"}
                          </span>
                        </div>
                      </div>

                      {/* Complaint Title & Description Body */}
                      <div className="space-y-1.5">
                        <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                          <AlertCircle className={`h-4 w-4 shrink-0 ${isResolved ? "text-emerald-600" : isInProgress ? "text-blue-600" : "text-rose-600"}`} />
                          {c.title || c.subject || "Issue Report"}
                        </h4>
                        <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 leading-relaxed shadow-2xs">
                          {c.description}
                        </div>
                      </div>

                      {/* Admin Note / Resolution Comment Form */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                        <input
                          type="text"
                          placeholder="Add resolution note / response to resident..."
                          value={replyText}
                          onChange={(e) => setComplaintAdminReplies((prev) => ({ ...prev, [compId]: e.target.value }))}
                          className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-indigo-500 shadow-2xs"
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdateComplaintStatus(item.bookingId, compId, c.status || "pending", replyText)}
                          className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black transition cursor-pointer shadow-2xs whitespace-nowrap"
                        >
                          Save Note 💬
                        </button>
                      </div>

                      {/* Action Bar: Status Updater & WhatsApp */}
                      <div className="pt-2.5 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-black text-slate-500 uppercase">Change Status:</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateComplaintStatus(item.bookingId, compId, "pending", replyText)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                              isPending ? "bg-amber-500 text-white shadow-md scale-105" : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            ⏳ Pending
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateComplaintStatus(item.bookingId, compId, "in_progress", replyText)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                              isInProgress ? "bg-blue-600 text-white shadow-md scale-105" : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            🔄 In Progress
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateComplaintStatus(item.bookingId, compId, "resolved", replyText)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                              isResolved ? "bg-emerald-600 text-white shadow-md scale-105" : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            ✅ Mark Resolved
                          </button>
                        </div>

                        {item.residentPhone && (
                          <a
                            href={`https://wa.me/91${item.residentPhone.replace(/\D/g, "")}?text=${encodeURIComponent(
                              `Hello ${item.residentName}, regarding your complaint "${c.title || c.subject || "Issue"}": `
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition shadow-sm cursor-pointer"
                          >
                            <MessageSquare className="h-3.5 w-3.5" /> WhatsApp Resident
                          </a>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}

      {/* WHATSAPP BAILEYS AUTOMATION CENTER & CHATBOT MANAGER MODAL */}
      {isWhatsAppModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-md animate-in fade-in" onClick={() => setIsWhatsAppModalOpen(false)}>
          <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl border border-slate-200 animate-in zoom-in-95 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-emerald-50/70 via-white to-slate-50">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 shadow-sm shrink-0">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2 flex-wrap">
                    WhatsApp Automation & Chatbot
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-black ${
                      whatsappStatus?.connected ? "bg-emerald-600 text-white" : "bg-amber-500 text-white"
                    }`}>
                      {whatsappStatus?.connected ? "🟢 Online" : isCheckingWhatsApp ? "⏳ Checking..." : "🟡 Offline / Scan QR"}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Auto-send invoices, complaints, receipts & interactive location inquiry chatbot
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  type="button"
                  onClick={fetchWhatsAppStatus}
                  disabled={isCheckingWhatsApp}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-xs font-black text-slate-700 transition cursor-pointer shadow-2xs"
                >
                  {isCheckingWhatsApp ? "Checking..." : "🔄 Refresh"}
                </button>
                <button
                  onClick={() => setIsWhatsAppModalOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Navigation Sub-Tabs */}
            <div className="px-4 sm:px-6 pt-3 border-b border-slate-100 bg-slate-50/70 flex items-center gap-2 overflow-x-auto scrollbar-none">
              <button
                type="button"
                onClick={() => setWaModalTab("overview")}
                className={`px-4 py-2.5 rounded-t-xl text-xs font-black transition cursor-pointer flex items-center gap-2 border-b-2 ${
                  waModalTab === "overview"
                    ? "bg-white text-emerald-700 border-emerald-600 shadow-2xs"
                    : "text-slate-600 border-transparent hover:text-slate-900"
                }`}
              >
                <span>📊 Connection & QR</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setWaModalTab("templates");
                  if (!waTemplates) fetchWhatsAppTemplates();
                }}
                className={`px-4 py-2.5 rounded-t-xl text-xs font-black transition cursor-pointer flex items-center gap-2 border-b-2 ${
                  waModalTab === "templates"
                    ? "bg-white text-emerald-700 border-emerald-600 shadow-2xs"
                    : "text-slate-600 border-transparent hover:text-slate-900"
                }`}
              >
                <span>📝 Message Templates</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setWaModalTab("chatbot");
                  if (!waTemplates) fetchWhatsAppTemplates();
                }}
                className={`px-4 py-2.5 rounded-t-xl text-xs font-black transition cursor-pointer flex items-center gap-2 border-b-2 ${
                  waModalTab === "chatbot"
                    ? "bg-white text-emerald-700 border-emerald-600 shadow-2xs"
                    : "text-slate-600 border-transparent hover:text-slate-900"
                }`}
              >
                <Bot className="h-3.5 w-3.5" />
                <span>🤖 Location Chatbot (Auto-Reply)</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
              {/* TAB 1: OVERVIEW & CONNECTION */}
              {waModalTab === "overview" && (
                <div className="space-y-5">
                  {/* Connection Status Card */}
                  <div className={`p-4 sm:p-5 rounded-2xl border-2 space-y-3 ${
                    whatsappStatus?.connected ? "bg-emerald-50/70 border-emerald-300" : "bg-amber-50/70 border-amber-300"
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{whatsappStatus?.connected ? "🟢" : "📱"}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-black text-slate-900">
                              {whatsappStatus?.connected
                                ? "WhatsApp Multi-Device Baileys Connected"
                                : "WhatsApp Authentication Required"}
                            </h4>
                            {whatsappStatus?.phone && (
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white font-mono text-[11px] font-black tracking-wide shadow-xs">
                                +{whatsappStatus.phone}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 font-medium mt-0.5">
                            {whatsappStatus?.connected
                              ? `Linked Admin Account: ${whatsappStatus.pushName || "Shripad Admin"} (+${whatsappStatus.phone}). Real-time auto-dispatch & location chatbot are active.`
                              : "Start the session below or scan the QR code to link your PG Admin WhatsApp number."}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* QR Code Container or Session Starter */}
                    {!whatsappStatus?.connected && (
                      <div className="pt-3 border-t border-amber-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="text-xs font-semibold text-slate-700">
                          <span>Engine Status: </span>
                          <span className="font-mono font-black text-amber-900">{whatsappStatus?.status || "DISCONNECTED"}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleStartWhatsAppSession}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition cursor-pointer shadow-sm active:scale-95"
                          >
                            ⚡ Start Session & Get QR
                          </button>
                          <a
                            href="https://shripad-openwa-gateway.onrender.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black transition cursor-pointer shadow-sm"
                          >
                            Open OpenWA Gateway ↗
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Automated Workflows Enabled */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Automated WhatsApp Workflows</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-black text-slate-900">Room Allotment</p>
                          <p className="text-[11px] text-slate-500">Auto-sends ID, Password, Wi-Fi to new resident</p>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-black text-slate-900">Invoices & Dues</p>
                          <p className="text-[11px] text-slate-500">Sends PDF invoice link & UPI payment QR</p>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-black text-slate-900">Service Complaints</p>
                          <p className="text-[11px] text-slate-500">Notifies resident on status update & warden notes</p>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-black text-slate-900">Location Chatbot</p>
                          <p className="text-[11px] text-slate-500">Auto-replies with Wakad, Chinchwad, Hinjewadi details</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Instant WhatsApp Test Message Box */}
                  <form onSubmit={handleSendWhatsAppTest} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <span>🚀</span> Send Test WhatsApp Message
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Target Phone Number *</label>
                        <input
                          type="tel"
                          required
                          placeholder="e.g. 9876543210"
                          value={waTestPhone}
                          onChange={(e) => setWaTestPhone(e.target.value)}
                          className="w-full rounded-xl bg-white border border-slate-200 p-2.5 text-xs font-bold text-slate-900 outline-none focus:border-emerald-600"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1">Message Text *</label>
                        <input
                          type="text"
                          required
                          placeholder="Message content..."
                          value={waTestMessage}
                          onChange={(e) => setWaTestMessage(e.target.value)}
                          className="w-full rounded-xl bg-white border border-slate-200 p-2.5 text-xs font-medium text-slate-900 outline-none focus:border-emerald-600"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="submit"
                        disabled={isSendingWaTest}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs transition cursor-pointer shadow-md active:scale-95 flex items-center gap-2"
                      >
                        <span>{isSendingWaTest ? "Sending..." : "Send Test WhatsApp"}</span>
                        <span>📨</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 2: MESSAGE TEMPLATES */}
              {waModalTab === "templates" && (
                <div className="space-y-4">
                  {isLoadingWaTemplates ? (
                    <div className="p-12 text-center text-slate-500 font-bold text-sm">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-emerald-600" />
                      Loading customizable templates...
                    </div>
                  ) : waTemplates ? (
                    <div className="space-y-4">
                      {/* Template Selector Bar */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveTemplateType("invoice")}
                          className={`p-2.5 rounded-xl text-xs font-black transition cursor-pointer border flex flex-col items-center gap-1 ${
                            activeTemplateType === "invoice"
                              ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          <span>🧾 Invoice Notice</span>
                          <span className="text-[10px] opacity-80 font-normal">PDF Link & UPI</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveTemplateType("complaint")}
                          className={`p-2.5 rounded-xl text-xs font-black transition cursor-pointer border flex flex-col items-center gap-1 ${
                            activeTemplateType === "complaint"
                              ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          <span>📢 Complaint Update</span>
                          <span className="text-[10px] opacity-80 font-normal">Ticket Resolution</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveTemplateType("payment")}
                          className={`p-2.5 rounded-xl text-xs font-black transition cursor-pointer border flex flex-col items-center gap-1 ${
                            activeTemplateType === "payment"
                              ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          <span>💳 Payment Receipt</span>
                          <span className="text-[10px] opacity-80 font-normal">Rent Confirmation</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveTemplateType("welcome")}
                          className={`p-2.5 rounded-xl text-xs font-black transition cursor-pointer border flex flex-col items-center gap-1 ${
                            activeTemplateType === "welcome"
                              ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          <span>🏠 Resident Allotment</span>
                          <span className="text-[10px] opacity-80 font-normal">Credentials & Wi-Fi</span>
                        </button>
                      </div>

                      {/* Variable Insert Helper Bar */}
                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                        <p className="text-[11px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1">
                          <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Click any tag to insert into message template:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            "{customerName}",
                            "{amount}",
                            "{invoiceLink}",
                            "{month}",
                            "{room}",
                            "{bed}",
                            "{building}",
                            "{upiId}",
                            "{accountName}",
                            "{complaintTitle}",
                            "{status}",
                            "{adminComment}",
                            "{amountPaid}",
                            "{invoiceNo}",
                            "{paymentDate}",
                            "{customerId}",
                            "{customerPassword}",
                            "{adminPhone}",
                            "{wardenPhone}",
                          ].map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => {
                                const currentKey =
                                  activeTemplateType === "invoice"
                                    ? "invoiceMessage"
                                    : activeTemplateType === "complaint"
                                      ? "complaintUpdateMessage"
                                      : activeTemplateType === "payment"
                                        ? "paymentConfirmationMessage"
                                        : "welcomeAllotmentMessage";
                                setWaTemplates({
                                  ...waTemplates,
                                  [currentKey]: (waTemplates[currentKey] || "") + " " + tag,
                                });
                                showToast(`Inserted ${tag}`, "info");
                              }}
                              className="px-2 py-1 rounded-lg bg-white border border-slate-300 hover:border-emerald-500 hover:bg-emerald-50 text-[11px] font-mono font-bold text-slate-700 transition cursor-pointer active:scale-95"
                            >
                              + {tag}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Template Editor Grid (Editor + Live Phone Preview) */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Editor Box */}
                        <div className="space-y-2">
                          <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
                            Template Text (Supports *bold*, _italics_, `code`)
                          </label>
                          <textarea
                            rows={12}
                            value={
                              activeTemplateType === "invoice"
                                ? waTemplates.invoiceMessage
                                : activeTemplateType === "complaint"
                                  ? waTemplates.complaintUpdateMessage
                                  : activeTemplateType === "payment"
                                    ? waTemplates.paymentConfirmationMessage
                                    : waTemplates.welcomeAllotmentMessage
                            }
                            onChange={(e) => {
                              const currentKey =
                                activeTemplateType === "invoice"
                                  ? "invoiceMessage"
                                  : activeTemplateType === "complaint"
                                    ? "complaintUpdateMessage"
                                    : activeTemplateType === "payment"
                                      ? "paymentConfirmationMessage"
                                      : "welcomeAllotmentMessage";
                              setWaTemplates({
                                ...waTemplates,
                                [currentKey]: e.target.value,
                              });
                            }}
                            className="w-full rounded-2xl bg-white border border-slate-300 p-3.5 text-xs font-mono text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 leading-relaxed resize-y"
                          />
                        </div>

                        {/* Live Phone Preview */}
                        <div className="space-y-2">
                          <label className="block text-xs font-black text-slate-800 uppercase tracking-wider flex items-center justify-between">
                            <span>📱 Resident Live WhatsApp Preview</span>
                            <span className="text-[10px] text-slate-400 lowercase">sample view</span>
                          </label>
                          <div className="rounded-2xl bg-[#EFEAE2] p-4 border border-slate-300 min-h-[260px] flex flex-col justify-start">
                            <div className="max-w-[95%] bg-white rounded-2xl rounded-tl-xs p-3.5 shadow-sm text-xs text-slate-800 space-y-1 whitespace-pre-wrap font-sans leading-relaxed border border-slate-200/60">
                              {(() => {
                                const raw =
                                  activeTemplateType === "invoice"
                                    ? waTemplates.invoiceMessage
                                    : activeTemplateType === "complaint"
                                      ? waTemplates.complaintUpdateMessage
                                      : activeTemplateType === "payment"
                                        ? waTemplates.paymentConfirmationMessage
                                        : waTemplates.welcomeAllotmentMessage;
                                return (raw || "")
                                  .replace(/\{customerName\}/g, "Rahul Sharma")
                                  .replace(/\{residentName\}/g, "Rahul Sharma")
                                  .replace(/\{amount\}/g, "8,500")
                                  .replace(/\{amountPaid\}/g, "8,500")
                                  .replace(/\{rentAmount\}/g, "8,500")
                                  .replace(/\{month\}/g, "August 2026")
                                  .replace(/\{room\}/g, "204")
                                  .replace(/\{bed\}/g, "Bed B")
                                  .replace(/\{building\}/g, "Wakad Luxury Branch")
                                  .replace(/\{invoiceLink\}/g, "https://shripadpg.pages.dev/my-rooms")
                                  .replace(/\{upiId\}/g, "shripadpg@okaxis")
                                  .replace(/\{accountName\}/g, "Shripad PG Services")
                                  .replace(/\{complaintTitle\}/g, "Wi-Fi Speed Low in Room 204")
                                  .replace(/\{category\}/g, "WI-FI")
                                  .replace(/\{status\}/g, "IN PROGRESS")
                                  .replace(/\{adminComment\}/g, "Technician scheduled for visit at 4 PM.")
                                  .replace(/\{invoiceNo\}/g, "REC-948210")
                                  .replace(/\{paymentDate\}/g, "16/08/2026")
                                  .replace(/\{paymentMode\}/g, "ONLINE UPI")
                                  .replace(/\{customerId\}/g, "CUST-987654")
                                  .replace(/\{phone\}/g, "9876543210")
                                  .replace(/\{customerPassword\}/g, "shripad@2026")
                                  .replace(/\{adminPhone\}/g, "+91 98765 43210")
                                  .replace(/\{wardenPhone\}/g, "+91 98765 00000");
                              })()}
                            </div>
                            <span className="text-[10px] text-slate-500 self-end mt-1 font-mono">12:30 PM ✓✓</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                        <button
                          type="button"
                          onClick={handleResetWhatsAppTemplates}
                          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                        >
                          🔄 Reset to System Defaults
                        </button>

                        <button
                          type="button"
                          onClick={handleSaveWhatsAppTemplates}
                          disabled={isSavingWaTemplates}
                          className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs transition cursor-pointer shadow-md active:scale-95 flex items-center gap-2"
                        >
                          <Save className="h-4 w-4" />
                          <span>{isSavingWaTemplates ? "Saving Changes..." : "Save All Templates"}</span>
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {/* TAB 3: INTERACTIVE LOCATION CHATBOT */}
              {waModalTab === "chatbot" && (
                <div className="space-y-5">
                  {isLoadingWaTemplates ? (
                    <div className="p-12 text-center text-slate-500 font-bold text-sm">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-emerald-600" />
                      Loading chatbot configuration...
                    </div>
                  ) : waTemplates ? (
                    <div className="space-y-5">
                      {/* Chatbot Master Switch */}
                      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                            <Bot className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-slate-900">Interactive Location-Based WhatsApp Chatbot</h4>
                            <p className="text-xs text-slate-600 font-medium">
                              Auto-replies when customers message "hii", "wakad", "chinchwad", "hinjewadi", etc. with branch details.
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setWaTemplates({ ...waTemplates, chatbotEnabled: !waTemplates.chatbotEnabled })}
                          className={`px-4 py-2 rounded-full text-xs font-black transition cursor-pointer shadow-xs ${
                            waTemplates.chatbotEnabled
                              ? "bg-emerald-600 text-white hover:bg-emerald-700"
                              : "bg-slate-300 text-slate-700 hover:bg-slate-400"
                          }`}
                        >
                          {waTemplates.chatbotEnabled ? "🟢 Chatbot ACTIVE" : "⏸️ Chatbot DISABLED"}
                        </button>
                      </div>

                      {/* 1. Greeting Auto-Reply Message */}
                      <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                        <label className="block text-xs font-black text-slate-900 uppercase tracking-wider flex items-center justify-between">
                          <span>1. Greeting & Welcome Message (Triggered on "hii", "hello", "pg")</span>
                          <span className="text-[11px] text-emerald-700 font-mono">Use tag: &#123;locationsList&#125;</span>
                        </label>
                        <textarea
                          rows={4}
                          value={waTemplates.chatbotGreetingMessage}
                          onChange={(e) => setWaTemplates({ ...waTemplates, chatbotGreetingMessage: e.target.value })}
                          className="w-full rounded-xl bg-white border border-slate-300 p-3 text-xs font-mono text-slate-900 outline-none focus:border-emerald-600 leading-relaxed"
                          placeholder="Greeting message..."
                        />
                      </div>

                      {/* 2. PG Location Branches Manager */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                              <MapPin className="h-4 w-4 text-emerald-600" />
                              2. Configured PG Branches & Auto-Reply Locations ({waTemplates.chatbotLocations?.length || 0})
                            </h4>
                            <p className="text-[11px] text-slate-500">
                              When customer texts the area name or number, bot automatically replies with these details.
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setEditingBranch({
                                id: String(Date.now()),
                                name: "",
                                keyword: "",
                                address: "",
                                rooms: "1, 2, 3 Sharing",
                                rentRange: "₹7,000 - ₹12,000 / month",
                                amenities: "Food (3 Times), WiFi, Washing Machine, Geyser, Cleaning",
                                mapLink: "https://maps.google.com",
                                contactPhone: "+91 98765 43210",
                              });
                              setIsBranchModalOpen(true);
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition cursor-pointer shadow-sm flex items-center gap-1.5"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Add New Location</span>
                          </button>
                        </div>

                        {/* Location Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {waTemplates.chatbotLocations?.map((branch, idx) => (
                            <div key={branch.id || idx} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2 relative group hover:border-emerald-400 transition">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 text-xs font-black">
                                    {idx + 1}
                                  </span>
                                  <div>
                                    <h5 className="text-xs font-black text-slate-900">{branch.name}</h5>
                                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold">
                                      Trigger: "{branch.keyword}"
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingBranch({ ...branch });
                                      setIsBranchModalOpen(true);
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg transition cursor-pointer"
                                    title="Edit Branch Details"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteBranch(branch.id)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                                    title="Delete Branch"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>

                              <div className="text-[11px] text-slate-600 space-y-1 pt-1 border-t border-slate-100">
                                <p><strong className="text-slate-800">📍 Address:</strong> {branch.address}</p>
                                <p><strong className="text-slate-800">🛏️ Rooms:</strong> {branch.rooms}</p>
                                <p><strong className="text-slate-800">💰 Rent:</strong> {branch.rentRange}</p>
                                <p><strong className="text-slate-800">✨ Amenities:</strong> {branch.amenities}</p>
                                <p><strong className="text-slate-800">📞 Phone:</strong> {branch.contactPhone}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 3. Fallback / Default Reply */}
                      <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                        <label className="block text-xs font-black text-slate-900 uppercase tracking-wider">
                          3. Default / General Help Reply (When user asks unlisted question)
                        </label>
                        <textarea
                          rows={3}
                          value={waTemplates.chatbotDefaultReply}
                          onChange={(e) => setWaTemplates({ ...waTemplates, chatbotDefaultReply: e.target.value })}
                          className="w-full rounded-xl bg-white border border-slate-300 p-3 text-xs font-mono text-slate-900 outline-none focus:border-emerald-600 leading-relaxed"
                          placeholder="Default auto-reply..."
                        />
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                        <button
                          type="button"
                          onClick={handleResetWhatsAppTemplates}
                          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                        >
                          🔄 Reset to System Defaults
                        </button>

                        <button
                          type="button"
                          onClick={handleSaveWhatsAppTemplates}
                          disabled={isSavingWaTemplates}
                          className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs transition cursor-pointer shadow-md active:scale-95 flex items-center gap-2"
                        >
                          <Save className="h-4 w-4" />
                          <span>{isSavingWaTemplates ? "Saving Changes..." : "Save Chatbot Settings"}</span>
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* LOCATION BRANCH EDIT / CREATE SUB-MODAL */}
      {isBranchModalOpen && editingBranch && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in" onClick={() => setIsBranchModalOpen(false)}>
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 p-5 sm:p-6 space-y-4 animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-emerald-600" />
                <span>{editingBranch.name ? "Edit Branch Location" : "Add New PG Location"}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsBranchModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Branch Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Wakad Luxury Branch"
                    value={editingBranch.name}
                    onChange={(e) => setEditingBranch({ ...editingBranch, name: e.target.value })}
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 p-2.5 font-bold text-slate-900 outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Trigger Keyword *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. wakad"
                    value={editingBranch.keyword}
                    onChange={(e) => setEditingBranch({ ...editingBranch, keyword: e.target.value.toLowerCase().trim() })}
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 p-2.5 font-mono font-bold text-slate-900 outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Address / Landmark *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Near Dutta Mandir & Phoenix Mall, Wakad, Pune"
                  value={editingBranch.address}
                  onChange={(e) => setEditingBranch({ ...editingBranch, address: e.target.value })}
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 p-2.5 font-medium text-slate-900 outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Room Sharing Types *</label>
                  <input
                    type="text"
                    placeholder="e.g. 1, 2, 3 Sharing AC & Non-AC"
                    value={editingBranch.rooms}
                    onChange={(e) => setEditingBranch({ ...editingBranch, rooms: e.target.value })}
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 p-2.5 font-medium text-slate-900 outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Monthly Rent Range *</label>
                  <input
                    type="text"
                    placeholder="e.g. ₹7,000 - ₹12,500 / month"
                    value={editingBranch.rentRange}
                    onChange={(e) => setEditingBranch({ ...editingBranch, rentRange: e.target.value })}
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 p-2.5 font-medium text-slate-900 outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Included Amenities</label>
                <input
                  type="text"
                  placeholder="e.g. 3-Time Food, 200Mbps Wi-Fi, RO Water, Auto Washing Machine, Daily Cleaning"
                  value={editingBranch.amenities}
                  onChange={(e) => setEditingBranch({ ...editingBranch, amenities: e.target.value })}
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 p-2.5 font-medium text-slate-900 outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Google Maps Link</label>
                  <input
                    type="url"
                    placeholder="https://maps.google.com/?q=..."
                    value={editingBranch.mapLink}
                    onChange={(e) => setEditingBranch({ ...editingBranch, mapLink: e.target.value })}
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 p-2.5 font-mono text-[11px] text-slate-900 outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Manager Phone *</label>
                  <input
                    type="tel"
                    placeholder="e.g. +91 98765 43210"
                    value={editingBranch.contactPhone}
                    onChange={(e) => setEditingBranch({ ...editingBranch, contactPhone: e.target.value })}
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 p-2.5 font-bold text-slate-900 outline-none focus:border-emerald-600"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsBranchModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveBranch(editingBranch)}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition cursor-pointer shadow-md active:scale-95"
              >
                Save Branch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INVOICE & PAYMENT RECEIPT PREVIEW MODAL */}
      {viewingAdminInvoiceData && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in" onClick={() => setViewingAdminInvoiceData(null)}>
          <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 via-white to-slate-50">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 shadow-sm shrink-0">
                  <Receipt className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    Payment Receipt & Invoice
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                      PAID ✅
                    </span>
                  </h3>
                  <p className="text-[11px] font-medium text-slate-500 font-mono">
                    Receipt #{viewingAdminInvoiceData.invoiceNo} • {viewingAdminInvoiceData.date}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`/invoice?invoiceNo=${viewingAdminInvoiceData.invoiceNo}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer text-xs font-bold flex items-center gap-1.5"
                  title="Open Full Page Invoice"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span className="hidden sm:inline">Full Page</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      window.print();
                    }
                  }}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer text-xs font-bold flex items-center gap-1.5"
                  title="Print Receipt"
                >
                  <Printer className="h-4 w-4" />
                  <span className="hidden sm:inline">Print</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewingAdminInvoiceData(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Printable Receipt Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-slate-800 printable-receipt-area">
              {/* Top Branding */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                    <span className="text-brand-green">SHRIPAD</span> LUXURY PG
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Premium Co-Living & Student Accommodations</p>
                  <p className="text-[11px] text-slate-400">Pune, Maharashtra • +91 84469 82438</p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-black text-emerald-700">
                    ₹{(viewingAdminInvoiceData.paidAmount || viewingAdminInvoiceData.rentAmount || 0).toLocaleString("en-IN")}
                  </div>
                  <span className="text-[10px] font-black uppercase text-slate-400">Total Received</span>
                </div>
              </div>

              {/* Resident & Property Meta Grid */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
                <div>
                  <span className="block text-[10px] font-bold uppercase text-slate-400">Resident Name</span>
                  <span className="font-black text-slate-900 text-sm">{viewingAdminInvoiceData.tenantName}</span>
                  <span className="block text-[11px] text-slate-500 font-mono mt-0.5">{viewingAdminInvoiceData.contact}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase text-slate-400">Allocated Room</span>
                  <span className="font-bold text-slate-900">{viewingAdminInvoiceData.building}</span>
                  <span className="block text-[11px] text-indigo-700 font-extrabold mt-0.5">{viewingAdminInvoiceData.room} ({viewingAdminInvoiceData.bed})</span>
                </div>
              </div>

              {/* Breakdown Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-black text-[10px]">
                    <tr>
                      <th className="p-3">Description</th>
                      <th className="p-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-3">
                        <span className="font-bold text-slate-800 block">Monthly Accommodation & Mess Rent</span>
                        <span className="text-[10px] text-slate-400 font-medium">{viewingAdminInvoiceData.notes}</span>
                      </td>
                      <td className="p-3 text-right font-black text-slate-900">
                        ₹{(viewingAdminInvoiceData.rentAmount || 0).toLocaleString("en-IN")}
                      </td>
                    </tr>
                    <tr className="bg-emerald-50/50">
                      <td className="p-3 font-bold text-emerald-900 flex items-center gap-1.5">
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Amount Paid (via {(viewingAdminInvoiceData.paymentModes?.[0] || "CASH").toUpperCase()})</span>
                      </td>
                      <td className="p-3 text-right font-black text-emerald-700">
                        ₹{(viewingAdminInvoiceData.paidAmount || 0).toLocaleString("en-IN")}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-slate-500">Balance Due</td>
                      <td className="p-3 text-right font-black text-slate-500">₹0</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Verified Stamp & Footer */}
              <div className="pt-2 flex items-center justify-between gap-3 text-[11px] text-slate-500 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>Computer Generated Verified Receipt • No signature required</span>
                </div>
                {viewingAdminInvoiceData.contact && (
                  <a
                    href={`https://wa.me/91${viewingAdminInvoiceData.contact.replace(/\D/g, "")}?text=${encodeURIComponent(
                      `Hello ${viewingAdminInvoiceData.tenantName}, here is your payment receipt of ₹${viewingAdminInvoiceData.paidAmount} for ${viewingAdminInvoiceData.building}: https://shripadpg.pages.dev/invoice?invoiceNo=${viewingAdminInvoiceData.invoiceNo}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>Send on WhatsApp</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM FLOATING TOAST POPUP NOTIFICATION */}
      {customToast.isOpen && (
        <div className="fixed top-6 right-6 z-[100] flex items-center gap-3.5 px-5 py-4 rounded-2xl bg-slate-900 text-white shadow-2xl border border-slate-700/80 animate-in slide-in-from-top-5 duration-300 max-w-md">
          <div className={`p-2 rounded-xl text-white ${customToast.type === "error" ? "bg-rose-500" : "bg-brand-green"}`}>
            {customToast.type === "error" ? <AlertCircle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
          </div>
          <div className="flex-1 pr-2">
            <p className="text-xs font-black text-slate-100">{customToast.type === "error" ? "Error" : "Success"}</p>
            <p className="text-xs font-bold text-slate-300 mt-0.5">{customToast.message}</p>
          </div>
          <button
            onClick={() => setCustomToast((prev) => ({ ...prev, isOpen: false }))}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
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
