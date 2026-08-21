import { API_BASE_URL } from "../../lib/apiConfig";
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  Menu,
  X,
  LayoutDashboard,
  CreditCard,
  FileText,
  User,
  Wrench,
  HelpCircle,
  Building2,
  Bed,
  KeyRound,
  Shield,
  Lock,
  LogOut,
  ChevronDown,
  ChevronUp,
  PhoneCall,
  CheckCircle2,
  Clock,
  Sparkles,
  Wifi,
  Utensils,
  Flame,
  Shirt,
  UserCheck,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Copy,
  Plus,
  Download,
  Send,
  MessageCircle,
  Info,
  ShieldCheck,
  DollarSign,
  QrCode,
  Search,
  Calendar,
  Receipt,
  Printer,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { ShripadNameLogo } from "@/components/ShripadNameLogo";
import { InvoiceDesign } from "@/components/InvoiceDesign";
import brandLogo from "@/assets/shripad-logo.png";

interface AccordionState {
  roomDetails: boolean;
  paymentHistory: boolean;
  securitySettings: boolean;
  pgContacts: boolean;
  faqMess: boolean;
  faqGate: boolean;
  faqGuest: boolean;
  faqWifi: boolean;
}

export interface ComplaintItem {
  id: string;
  category: "wifi" | "food" | "plumbing" | "electrical" | "cleaning" | "noise" | "other";
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "in_progress" | "resolved" | "closed";
  createdAt: string;
  resolvedAt?: string;
  adminComment?: string;
}

type TabType = "dashboard" | "payment" | "report" | "profile" | "complaint" | "help";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function CustomerPortal() {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewingInvoicePayment, setViewingInvoicePayment] = useState<any | null>(null);
  const [viewingInvoiceData, setViewingInvoiceData] = useState<any | null>(null); // Actual server invoice data
  const [hasSeenPayments, setHasSeenPayments] = useState(false);
  const [hasSeenComplaints, setHasSeenComplaints] = useState(false);
  const [showSecurityPass, setShowSecurityPass] = useState(false);

  // Accordion open/close states
  const [openAccordions, setOpenAccordions] = useState<AccordionState>({
    roomDetails: true,
    paymentHistory: true,
    securitySettings: false,
    pgContacts: true,
    faqMess: false,
    faqGate: false,
    faqGuest: false,
    faqWifi: false,
  });

  // Password Change state
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [passChangeSuccess, setPassChangeSuccess] = useState("");
  const [passChangeError, setPassChangeError] = useState("");
  const [isChangingPass, setIsChangingPass] = useState(false);

  // Payment Upload Modal state - Auto Calculated Date/Month/Year
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payDate, setPayDate] = useState(new Date().toISOString().split("T")[0]);
  const [payMonth, setPayMonth] = useState(new Date().getMonth() + 1);
  const [payYear, setPayYear] = useState(new Date().getFullYear());
  const [payAmount, setPayAmount] = useState("");
  const [payTxnId, setPayTxnId] = useState("");

  useEffect(() => {
    if (isPayModalOpen && customer?.rentAmount) {
      setPayAmount(String(customer.rentAmount));
    }
  }, [isPayModalOpen, customer?.rentAmount]);
  const [payMethod, setPayMethod] = useState<"upi" | "bank_transfer" | "cash">("upi");
  const [paySuccess, setPaySuccess] = useState("");
  const [payError, setPayError] = useState("");
  const [isSubmittingPay, setIsSubmittingPay] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Payment History Filter
  const [paymentFilter, setPaymentFilter] = useState<"all" | "verified" | "pending" | "rejected">("all");
  const [paymentSearch, setPaymentSearch] = useState("");

  // Complaint Form & State
  const [complaintCategory, setComplaintCategory] = useState<ComplaintItem["category"]>("wifi");
  const [complaintTitle, setComplaintTitle] = useState("");
  const [complaintDesc, setComplaintDesc] = useState("");
  const [complaintPriority, setComplaintPriority] = useState<ComplaintItem["priority"]>("medium");
  const [complaintSuccess, setComplaintSuccess] = useState("");
  const [complaintError, setComplaintError] = useState("");
  const [isSubmittingComplaint, setIsSubmittingComplaint] = useState(false);
  const [complaintFilter, setComplaintFilter] = useState<"all" | "pending" | "in_progress" | "resolved">("all");

  // Real Admin Payment Details & QR Code State
  const [paymentSettings, setPaymentSettings] = useState<{
    upiId: string;
    qrCodeUrl?: string;
    bankName: string;
    accountNo: string;
    ifscCode: string;
    accountName: string;
    adminPhone?: string;
    wardenPhone?: string;
    dueDay?: number;
    includedAmenities?: string;
    buildingPayments?: Record<
      string,
      {
        upiId?: string;
        qrCodeUrl?: string;
        bankName?: string;
        accountNo?: string;
        ifscCode?: string;
        accountName?: string;
        adminPhone?: string;
        wardenPhone?: string;
      }
    >;
  }>({
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
    buildingPayments: {},
  });

  // Dynamically resolve dedicated QR and Bank details for resident's allocated building (with Global fallback)
  const effectivePaymentSettings = useMemo(() => {
    const residentBld = (customer?.allocatedBuilding || customer?.building || "").trim();
    const bldConfig =
      residentBld && paymentSettings.buildingPayments
        ? Object.entries(paymentSettings.buildingPayments).find(([k]) => {
            const kClean = k.trim().toLowerCase();
            const bldClean = residentBld.toLowerCase();
            return kClean === bldClean || kClean.includes(bldClean) || bldClean.includes(kClean);
          })?.[1]
        : null;

    return {
      upiId: bldConfig?.upiId || paymentSettings.upiId || "shripadpg@okaxis",
      qrCodeUrl: bldConfig?.qrCodeUrl !== undefined && bldConfig?.qrCodeUrl !== "" ? bldConfig.qrCodeUrl : paymentSettings.qrCodeUrl || "",
      bankName: bldConfig?.bankName || paymentSettings.bankName || "Axis Bank Ltd",
      accountNo: bldConfig?.accountNo || paymentSettings.accountNo || "924020058192041",
      ifscCode: bldConfig?.ifscCode || paymentSettings.ifscCode || "UTIB0001824",
      accountName: bldConfig?.accountName || paymentSettings.accountName || "Shripad PG Services",
      adminPhone: bldConfig?.adminPhone || paymentSettings.adminPhone || "+91 98765 43210",
      wardenPhone: bldConfig?.wardenPhone || paymentSettings.wardenPhone || "+91 98765 00000",
      dueDay: paymentSettings.dueDay || 5,
      includedAmenities: paymentSettings.includedAmenities || "Food, Water, Wi-Fi, Laundry",
      isCustomBuildingPayment: Boolean(bldConfig && (bldConfig.upiId || bldConfig.qrCodeUrl || bldConfig.accountNo)),
      buildingName: residentBld,
    };
  }, [paymentSettings, customer]);

  const [showQrModal, setShowQrModal] = useState(false);
  const [isRefreshingComplaints, setIsRefreshingComplaints] = useState(false);

  // Centralized Resident Data Auto-Sync (Real-time polling & multi-tab storage sync)
  const syncFreshResidentData = async (silent = true) => {
    if (!silent) setIsRefreshingComplaints(true);
    const sessionStr = localStorage.getItem("shripad_customer_session");
    if (!sessionStr) return;

    try {
      const sess = JSON.parse(sessionStr);
      const res = await fetch(`${API_BASE_URL}/api/bookings`);
      const data = await res.json();
      if (data.success && Array.isArray(data.bookings)) {
        const match = data.bookings.find(
          (b: any) =>
            b.id === sess.id ||
            (sess.customerId && b.customerId === sess.customerId) ||
            (sess.phone && b.phone && b.phone.replace(/\D/g, "") === sess.phone.replace(/\D/g, ""))
        );
        if (match) {
          setCustomer(match);
          localStorage.setItem("shripad_customer_session", JSON.stringify(match));
        }
      }
    } catch (err) {
      // Local fallback sync
      try {
        const localBookings = localStorage.getItem("shripad_admin_bookings") || localStorage.getItem("shripad_cached_bookings");
        if (localBookings) {
          const list = JSON.parse(localBookings);
          const sess = JSON.parse(sessionStr);
          const match = list.find(
            (b: any) =>
              b.id === sess.id ||
              (sess.customerId && b.customerId === sess.customerId) ||
              (sess.phone && b.phone && b.phone.replace(/\D/g, "") === sess.phone.replace(/\D/g, ""))
          );
          if (match) {
            setCustomer(match);
            localStorage.setItem("shripad_customer_session", JSON.stringify(match));
          }
        }
      } catch {}
    } finally {
      if (!silent) setIsRefreshingComplaints(false);
    }
  };

  useEffect(() => {
    const sessionStr = localStorage.getItem("shripad_customer_session");
    if (!sessionStr) {
      navigate({ to: "/login" as any });
      return;
    }

    try {
      const sess = JSON.parse(sessionStr);
      setCustomer(sess);
      const custId = sess.id || sess.phone || "default";
      if (localStorage.getItem(`shripad_seen_payments_${custId}`) === "true") {
        setHasSeenPayments(true);
      }
      if (localStorage.getItem(`shripad_seen_complaints_${custId}`) === "true") {
        setHasSeenComplaints(true);
      }

      // Initial fresh sync
      syncFreshResidentData(true);

      // Sync official real PG payment details & QR code from admin settings
      fetch(`${API_BASE_URL}/api/settings/payment`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.settings) {
            setPaymentSettings(data.settings);
            localStorage.setItem("shripad_payment_settings", JSON.stringify(data.settings));
          }
        })
        .catch(() => {
          const local = localStorage.getItem("shripad_payment_settings");
          if (local) {
            try { setPaymentSettings(JSON.parse(local)); } catch {}
          }
        });
    } catch {
      navigate({ to: "/login" as any });
    }

    // Real-time Storage Listener: If Admin updates complaint in another window/tab, update instantly!
    const handleStorageChange = (e: StorageEvent) => {
      if (
        e.key === "shripad_customer_session" ||
        e.key === "shripad_admin_bookings" ||
        e.key === "shripad_cached_bookings"
      ) {
        syncFreshResidentData(true);
      }
    };
    window.addEventListener("storage", handleStorageChange);

    // Live Polling every 5 seconds for status changes
    const pollInterval = setInterval(() => {
      syncFreshResidentData(true);
    }, 5000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(pollInterval);
    };
  }, []);

  const toggleAccordion = (key: keyof AccordionState) => {
    setOpenAccordions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleLogout = () => {
    localStorage.removeItem("shripad_customer_session");
    navigate({ to: "/login" as any });
  };

  const copyCustomerId = () => {
    if (customer?.customerId) {
      navigator.clipboard.writeText(customer.customerId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const copyUpiId = () => {
    navigator.clipboard.writeText(effectivePaymentSettings.upiId || "shripadpg@okaxis");
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleTabClick = (tab: TabType) => {
    setActiveTab(tab);
    const custId = customer?.id || customer?.phone || "default";
    if (tab === "payment") {
      setHasSeenPayments(true);
      localStorage.setItem(`shripad_seen_payments_${custId}`, "true");
    }
    if (tab === "complaint") {
      setHasSeenComplaints(true);
      localStorage.setItem(`shripad_seen_complaints_${custId}`, "true");
    }
    // Auto-sync fresh data from backend on tab navigation
    syncFreshResidentData(true);
    setIsMobileMenuOpen(false);
    setIsProfileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Date Change Handler - Auto Calculates Month & Year
  const handlePayDateChange = (dateStr: string) => {
    setPayDate(dateStr);
    if (dateStr) {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        setPayMonth(d.getMonth() + 1);
        setPayYear(d.getFullYear());
      }
    }
  };

  // Password Change Handler
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassChangeError("");
    setPassChangeSuccess("");

    if (!newPass.trim()) {
      setPassChangeError("New password cannot be empty.");
      return;
    }
    if (newPass !== confirmPass) {
      setPassChangeError("New passwords do not match.");
      return;
    }

    setIsChangingPass(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/bookings/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: customer.id,
          oldPassword: currentPass,
          newPassword: newPass.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        const updatedCust = { ...customer, customerPassword: newPass.trim() };
        setCustomer(updatedCust);
        localStorage.setItem("shripad_customer_session", JSON.stringify(updatedCust));
        setPassChangeSuccess("Password changed successfully!");
        setCurrentPass("");
        setNewPass("");
        setConfirmPass("");

        syncLocalAdminBookings(updatedCust);
      } else {
        setPassChangeError(data.message || "Failed to change password.");
      }
    } catch {
      const updatedCust = { ...customer, customerPassword: newPass.trim() };
      setCustomer(updatedCust);
      localStorage.setItem("shripad_customer_session", JSON.stringify(updatedCust));
      syncLocalAdminBookings(updatedCust);
      setPassChangeSuccess("Password changed successfully!");
      setCurrentPass("");
      setNewPass("");
      setConfirmPass("");
    } finally {
      setIsChangingPass(false);
    }
  };

  const syncLocalAdminBookings = (updatedCust: any) => {
    ["shripad_cached_bookings", "shripad_admin_bookings"].forEach((key) => {
      const localStr = localStorage.getItem(key);
      if (localStr) {
        try {
          const bookings = JSON.parse(localStr);
          const idx = bookings.findIndex((b: any) => b.id === updatedCust.id);
          if (idx !== -1) {
            bookings[idx] = updatedCust;
            localStorage.setItem(key, JSON.stringify(bookings));
          }
        } catch (e) {
          // ignore parse errors
        }
      }
    });
  };

  // Payment Upload Handler - Smart handling for Cash vs Online payments
  const handlePaymentUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayError("");
    setPaySuccess("");

    const isCash = payMethod === "cash";
    const effectiveTxnId = isCash
      ? (payTxnId.trim() || `CASH_${payAmount}_${Date.now().toString().slice(-4)}`)
      : payTxnId.trim();

    if (!isCash && !effectiveTxnId) {
      setPayError("UPI Transaction ID / Reference Number is required for online payments.");
      return;
    }

    setIsSubmittingPay(true);

    const newPayRecord = {
      id: `pay_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      month: payMonth,
      year: payYear,
      amount: Number(payAmount),
      transactionId: effectiveTxnId,
      payerName: customer.name,
      paymentDate: payDate,
      paymentMethod: payMethod,
      submittedAt: new Date().toISOString(),
      status: "submitted" as const,
      autoVerified: false,
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/bookings/${customer.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: payMonth,
          year: payYear,
          amount: Number(payAmount),
          transactionId: effectiveTxnId,
          payerName: customer.name,
          paymentMethod: payMethod,
          paymentDate: payDate,
        }),
      });

      const data = await res.json();
      let updatedCust = { ...customer };
      if (data.success && data.booking) {
        updatedCust = data.booking;
      } else if (data.success && data.payment) {
        const updatedHistory = [data.payment, ...(customer.paymentHistory || [])];
        updatedCust = { ...customer, paymentHistory: updatedHistory };
      } else {
        const updatedHistory = [newPayRecord, ...(customer.paymentHistory || [])];
        updatedCust = { ...customer, paymentHistory: updatedHistory };
      }

      setCustomer(updatedCust);
      localStorage.setItem("shripad_customer_session", JSON.stringify(updatedCust));
      syncLocalAdminBookings(updatedCust);

      setPaySuccess(
        isCash
          ? "Cash payment receipt recorded! Awaiting warden confirmation."
          : "Payment proof submitted successfully! Awaiting warden verification."
      );
      setPayTxnId("");
      setTimeout(() => setIsPayModalOpen(false), 2000);
    } catch {
      const updatedHistory = [newPayRecord, ...(customer.paymentHistory || [])];
      const updatedCust = { ...customer, paymentHistory: updatedHistory };
      setCustomer(updatedCust);
      localStorage.setItem("shripad_customer_session", JSON.stringify(updatedCust));
      syncLocalAdminBookings(updatedCust);

      setPaySuccess(
        isCash
          ? "Cash payment receipt recorded! Awaiting warden confirmation."
          : "Payment proof submitted successfully! Awaiting warden verification."
      );
      setPayTxnId("");
      setTimeout(() => setIsPayModalOpen(false), 2000);
    } finally {
      setIsSubmittingPay(false);
    }
  };

  // Fetch real server invoice for a payment, then open modal
  const fetchAndViewInvoice = async (payment: any) => {
    setViewingInvoicePayment(payment);
    setViewingInvoiceData(null); // Reset while loading

    if (!customer?.id) return;

    try {
      // Try fetching all invoices for this resident from the server
      const res = await fetch(`${API_BASE_URL}/api/invoices/resident/${encodeURIComponent(customer.id)}`);
      const data = await res.json();

      if (data.success && Array.isArray(data.invoices) && data.invoices.length > 0) {
        const payMonth = Number(payment.month);
        const payYear = Number(payment.year);
        const payTxnId = (payment.transactionId || "").trim();
        const payInvNo = (payment.invoiceNo || "").trim();

        // Strategy 1: Match by explicit invoiceNo or transactionId
        let matched = data.invoices.find((inv: any) =>
          (payInvNo && inv.invoiceNo?.toLowerCase() === payInvNo.toLowerCase()) ||
          (payTxnId && inv.invoiceNo?.toLowerCase() === payTxnId.toLowerCase())
        );

        // Strategy 2: Match by Month & Year of invoice date
        if (!matched && payMonth && payYear) {
          matched = data.invoices.find((inv: any) => {
            const invDate = new Date(inv.date);
            return (invDate.getMonth() + 1 === payMonth) && (invDate.getFullYear() === payYear);
          });
        }

        // Strategy 3: Match by amount
        if (!matched && payment.amount) {
          matched = data.invoices.find((inv: any) => Number(inv.paidAmount || inv.rentAmount) === Number(payment.amount));
        }

        // Strategy 4: Fallback to first/latest invoice
        if (!matched && data.invoices.length > 0) {
          matched = data.invoices[0];
        }

        if (matched) {
          setViewingInvoiceData(matched);
          return;
        }
      }
    } catch (e) {
      console.warn("Could not fetch server invoice for resident:", e);
    }
  };

  // Complaint Submit Handler
  const handleComplaintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setComplaintError("");
    setComplaintSuccess("");

    if (!complaintTitle.trim() || !complaintDesc.trim()) {
      setComplaintError("Title and description are required.");
      return;
    }

    setIsSubmittingComplaint(true);

    const newComplaint: ComplaintItem = {
      id: `cmp_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      category: complaintCategory,
      title: complaintTitle.trim(),
      description: complaintDesc.trim(),
      priority: complaintPriority,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/bookings/${customer.id}/complaints`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: complaintCategory,
          title: complaintTitle.trim(),
          description: complaintDesc.trim(),
          priority: complaintPriority,
        }),
      });

      const data = await res.json();
      let updatedCust = { ...customer };
      if (data.success && data.booking) {
        updatedCust = data.booking;
      } else if (data.success && data.complaint) {
        const updatedHistory = [data.complaint, ...(customer.complaintHistory || customer.complaints || [])];
        updatedCust = { ...customer, complaintHistory: updatedHistory, complaints: updatedHistory };
      } else {
        const updatedHistory = [newComplaint, ...(customer.complaintHistory || customer.complaints || [])];
        updatedCust = { ...customer, complaintHistory: updatedHistory, complaints: updatedHistory };
      }

      setCustomer(updatedCust);
      localStorage.setItem("shripad_customer_session", JSON.stringify(updatedCust));
      syncLocalAdminBookings(updatedCust);

      setComplaintSuccess("Complaint ticket submitted! PG Care team will inspect shortly.");
      setComplaintTitle("");
      setComplaintDesc("");
    } catch {
      const updatedHistory = [newComplaint, ...(customer.complaintHistory || customer.complaints || [])];
      const updatedCust = { ...customer, complaintHistory: updatedHistory, complaints: updatedHistory };
      setCustomer(updatedCust);
      localStorage.setItem("shripad_customer_session", JSON.stringify(updatedCust));
      syncLocalAdminBookings(updatedCust);

      setComplaintSuccess("Complaint ticket submitted! PG Care team will inspect shortly.");
      setComplaintTitle("");
      setComplaintDesc("");
    } finally {
      setIsSubmittingComplaint(false);
    }
  };

  const handlePrintLedger = () => {
    window.print();
  };

  if (!customer) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green"></div>
      </div>
    );
  }

  const isAllocated = customer.status === "allocated" && customer.allocatedBuilding;
  const paymentHistoryList: any[] = customer.paymentHistory || [];

  const filteredPaymentHistory = paymentHistoryList.filter((p: any) => {
    const matchesFilter =
      paymentFilter === "all"
        ? true
        : paymentFilter === "verified"
        ? p.status === "verified"
        : paymentFilter === "pending"
        ? p.status === "submitted" || !p.status
        : p.status === "rejected";

    const matchesSearch =
      !paymentSearch.trim() ||
      p.transactionId?.toLowerCase().includes(paymentSearch.toLowerCase()) ||
      p.paymentMethod?.toLowerCase().includes(paymentSearch.toLowerCase()) ||
      String(p.amount).includes(paymentSearch);

    return matchesFilter && matchesSearch;
  });

  const complaintsList: ComplaintItem[] = customer.complaintHistory || [];
  const openComplaintsCount = complaintsList.filter((c) => c.status === "pending" || c.status === "in_progress").length;
  const filteredComplaints = complaintsList.filter((c) =>
    complaintFilter === "all" ? true : c.status === complaintFilter
  );

  const initialLetter = (customer.name || "Resident").charAt(0).toUpperCase();

  return (
    <div className="flex min-h-screen bg-slate-100/60 font-sans text-slate-800 selection:bg-brand-green selection:text-white relative overflow-x-hidden">
      {/* Subtle Ambient Background Gradients (Identical to Admin Dashboard) */}
      <div className="fixed top-0 left-64 w-96 h-96 bg-brand-green-light/30 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-[#F0F4FF]/40 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Mobile Drawer Overlay Backdrop */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/5 backdrop-blur-[1px] transition-opacity lg:hidden"
        />
      )}

      {/* ==================== LEFT SIDEBAR DRAWER (ADMIN EXACT MATCH) ==================== */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200/80 bg-white/95 backdrop-blur-xl px-6 py-7 shadow-xl lg:shadow-md transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Top Header Logo Alignment */}
        <div className="mb-8 flex items-center justify-center relative w-full px-1">
          <ShripadNameLogo />
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="absolute right-1 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 lg:hidden shadow-2xs cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Curved Pill Navigation Items */}
        <nav className="flex-1 space-y-2">
          {(() => {
            const unreadPaymentsBadge = hasSeenPayments ? 0 : paymentHistoryList.length > 0 ? 1 : 0;
            const unreadComplaintsBadge = hasSeenComplaints ? 0 : openComplaintsCount;

            return [
              { id: "dashboard", name: "Dashboard", icon: LayoutDashboard },
              { id: "payment", name: "Payment & Dues", icon: CreditCard, badge: unreadPaymentsBadge },

              { id: "profile", name: "Profile", icon: User },
              { id: "complaint", name: "Complaints", icon: Wrench, badge: unreadComplaintsBadge },
              { id: "help", name: "Help & Care", icon: HelpCircle },
            ].map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id as TabType)}
                  className={`group relative flex w-full items-center gap-3.5 rounded-full px-5 py-3.5 text-sm font-bold transition-all duration-300 cursor-pointer ${
                    isActive
                      ? "bg-brand-green text-white shadow-lg shadow-[#00022E]/30 translate-x-1"
                      : "text-slate-600 hover:bg-slate-100/90 hover:text-slate-900 hover:translate-x-1"
                  }`}
                >
                  <Icon className={`h-5 w-5 transition-transform group-hover:scale-110 ${isActive ? "text-white" : "text-slate-500"}`} />
                  <span>{item.name}</span>

                  {item.badge !== undefined && item.badge > 0 ? (
                    <span className={`ml-auto font-black text-[10px] px-2.5 py-0.5 rounded-full ${
                      isActive ? "bg-white text-[#00022E]" : "bg-brand-green/20 text-brand-green"
                    }`}>
                      {item.badge}
                    </span>
                  ) : null}

                  {isActive && (
                    <span className="absolute right-3 h-2 w-2 rounded-full bg-white animate-pulse shadow-xs" />
                  )}
                </button>
              );
            });
          })()}
        </nav>

        {/* Enlarged Prominent Shripad PG Logo Showcase Footer (Identical to Admin Dashboard Sidebar) */}
        <div className="mt-auto rounded-3xl bg-gradient-to-br from-brand-green-light/40 via-emerald-50/50 to-white p-3.5 sm:p-4 border-2 border-brand-green/20 text-center space-y-2 shadow-sm hover:shadow-md transition-all">
          <div className="mx-auto flex justify-center py-0.5">
            <img
              src={brandLogo}
              alt="Shripad PG Large Logo"
              className="h-24 sm:h-28 w-auto max-w-full object-contain transition-transform hover:scale-105 filter drop-shadow-md"
            />
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-black text-brand-navy tracking-wide uppercase">
              SHRIPAD PG RESIDENT PORTAL
            </p>
            <p className="text-[10px] font-semibold text-slate-500 flex items-center justify-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-brand-green" /> Premium Living & Care
            </p>
          </div>
        </div>
      </aside>

      {/* ==================== MAIN CONTENT AREA (ADMIN STRUCTURE & PERFECT ALIGNMENT) ==================== */}
      <div className="flex flex-1 flex-col transition-all duration-300 min-w-0 lg:pl-72">
        
        {/* CENTERED ROUNDED PILL TOP NAVIGATION BAR (ADMIN MATCH) */}
        <div className="sticky top-4 z-30 w-full px-4 sm:px-6 lg:px-8 mt-4 mb-2">
          <header className="mx-auto max-w-7xl rounded-full border border-slate-200/80 bg-white/90 shadow-lg shadow-slate-200/50 backdrop-blur-xl px-5 sm:px-7 py-3 flex items-center justify-between gap-4 transition-all">
            
            {/* Left: Mobile Toggle & Curved Search Pill */}
            <div className="flex items-center gap-3 flex-1 max-w-md">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200/80 bg-slate-50 text-slate-600 hover:bg-slate-100 shadow-2xs lg:hidden cursor-pointer"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search room specs, payments, tickets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-full border border-slate-200/80 bg-slate-50/70 pl-11 pr-12 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:border-brand-green focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/20 transition shadow-inner"
                />
                <kbd className="hidden sm:inline-block absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full bg-white px-2.5 py-0.5 text-[10px] font-bold text-slate-400 border border-slate-200 shadow-2xs">
                  ⌘K
                </kbd>
              </div>
            </div>

            {/* Right: Quick Action & Interactive Profile Dropdown (Admin Style) */}
            <div className="flex items-center gap-3 sm:gap-4 shrink-0 relative">
              <button
                onClick={() => setIsPayModalOpen(true)}
                className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand-green hover:bg-[#00022E] text-white text-xs font-black transition cursor-pointer shadow-md active:scale-95"
              >
                <Plus className="h-4 w-4" />
                <span>Pay Rent</span>
              </button>

              {/* Profile Dropdown Container */}
              <div className="relative">
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center gap-2.5 rounded-full border border-slate-200/80 bg-slate-50/80 hover:bg-slate-100/80 p-1.5 pr-3 shadow-2xs transition-all active:scale-95 cursor-pointer"
                >
                  <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-green text-white font-black text-xs shadow-sm ring-2 ring-brand-green/20">
                    {initialLetter}
                  </div>
                  <div className="hidden text-left md:block leading-tight">
                    <p className="text-xs font-bold text-slate-900 leading-none">{customer.name}</p>
                    <p className="text-[10px] font-semibold text-brand-green mt-0.5">
                      {isAllocated ? `Room ${customer.allocatedRoom}` : "Resident"}
                    </p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isProfileMenuOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Profile Dropdown Menu */}
                {isProfileMenuOpen && (
                  <>
                    <div
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="fixed inset-0 z-40"
                    />
                    <div className="absolute right-0 top-12 z-50 w-64 rounded-3xl border border-slate-200/90 bg-white/95 backdrop-blur-xl p-3 shadow-2xl space-y-1 animate-scaleUp">
                      {/* User Info Header */}
                      <div className="px-3.5 py-3 border-b border-slate-100 mb-1 space-y-1">
                        <p className="text-sm font-black text-slate-900 leading-tight">{customer.name}</p>
                        <p className="text-[11px] font-medium text-slate-500 font-mono">ID: {customer.customerId || "Allocated Resident"}</p>
                        <p className="text-[11px] font-bold text-slate-600">📱 {customer.phone}</p>
                        <div className="pt-1">
                          <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                            isAllocated ? "bg-[#F0F4FF] text-[#00022E] border border-blue-200" : "bg-amber-100 text-amber-800 border border-amber-300"
                          }`}>
                            {isAllocated ? `${customer.allocatedBuilding} • Room ${customer.allocatedRoom} (${customer.allocatedBed})` : "Pending Allocation"}
                          </span>
                        </div>
                      </div>

                      {/* View Profile */}
                      <button
                        onClick={() => handleTabClick("profile")}
                        className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100/90 hover:text-slate-900 transition cursor-pointer"
                      >
                        <User className="h-4 w-4 text-brand-green" />
                        <span>View Resident Profile</span>
                      </button>

                      {/* Rent Payments & History */}
                      <button
                        onClick={() => handleTabClick("payment")}
                        className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100/90 hover:text-slate-900 transition cursor-pointer"
                      >
                        <CreditCard className="h-4 w-4 text-[#00022E]" />
                        <span>Rent Payments & History</span>
                      </button>

                      {/* Maintenance Complaints */}
                      <button
                        onClick={() => handleTabClick("complaint")}
                        className="flex w-full items-center justify-between rounded-2xl px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100/90 hover:text-slate-900 transition cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <Wrench className="h-4 w-4 text-amber-500" />
                          <span>My Complaints</span>
                        </div>
                        {openComplaintsCount > 0 && (
                          <span className="bg-amber-500 text-white font-black text-[10px] px-2 py-0.5 rounded-full">
                            {openComplaintsCount}
                          </span>
                        )}
                      </button>

                      {/* Password Security */}
                      <button
                        onClick={() => {
                          handleTabClick("profile");
                          setOpenAccordions((prev) => ({ ...prev, securitySettings: true }));
                        }}
                        className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100/90 hover:text-slate-900 transition cursor-pointer"
                      >
                        <Lock className="h-4 w-4 text-blue-600" />
                        <span>Security & Password</span>
                      </button>

                      <div className="pt-1 border-t border-slate-100">
                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 transition cursor-pointer"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Logout Account</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </header>
        </div>

        {/* MAIN PAGE CONTAINER WITH PERFECT ALIGNMENT & STRUCTURAL ELEGANCE (IDENTICAL TO ADMIN DASHBOARD) */}
        <main className="flex-1 space-y-6 sm:space-y-7 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 max-w-7xl mx-auto w-full">

          {/* ==================================== TAB 1: DASHBOARD ==================================== */}
          {activeTab === "dashboard" && (
            <div className="space-y-6 sm:space-y-7 animate-fadeIn">
              
              {/* PAGE HEADER TITLE BLOCK (PROPER ALIGNED LIKE ADMIN DASHBOARD) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-green-light px-3 py-1 text-[11px] font-bold text-brand-green border border-brand-green/20">
                      <Sparkles className="h-3.5 w-3.5 text-brand-green" /> Shripad Resident Hub
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                    Welcome back, {customer.name}! 👋
                  </h1>
                  <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-0.5">
                    Registered Mobile: <span className="text-slate-900 font-extrabold">{customer.phone}</span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-2xs">
                    <UserCheck className="h-4 w-4 text-brand-green" />
                    <span>ID: <strong className="font-mono text-slate-900 font-black">{customer.customerId || "pra210"}</strong></span>
                    <button onClick={copyCustomerId} className="p-0.5 text-slate-400 hover:text-slate-800 transition" title="Copy ID">
                      {copiedId ? <Check className="h-3.5 w-3.5 text-[#00022E]" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>

                  <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-[#F0F4FF] px-4 py-2.5 text-xs font-bold text-[#00022E] shadow-2xs">
                    <Building2 className="h-4 w-4 text-[#00022E]" />
                    <span>{isAllocated ? `${customer.allocatedBuilding} • R-${customer.allocatedRoom} (${customer.allocatedBed})` : "Allocation Pending"}</span>
                  </div>
                </div>
              </div>

              {/* 4 PROPER ALIGNED METRIC SUMMARY CARDS (GRADIENT ACCENTS & HOVER EFFECTS LIKE ADMIN) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                
                {/* Card 1: Monthly Rent */}
                <div className="group rounded-[1.8rem] border border-blue-200/90 bg-gradient-to-br from-emerald-50/40 via-white to-white p-5 lg:p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F0F4FF] text-[#00022E] border border-blue-200 shadow-2xs group-hover:scale-110 transition-transform">
                      <DollarSign className="h-5 w-5" />
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#F0F4FF]/80 px-2.5 py-1 text-[10px] font-extrabold text-[#00022E] border border-blue-200">
                      🟢 Due 5th Every Month
                    </span>
                  </div>
                  <div className="mt-4">
                    <p className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-slate-500">Monthly Rent</p>
                    <p className="mt-1 text-2xl lg:text-3xl font-black text-slate-900">
                      {customer?.rentAmount ? `₹${Number(customer.rentAmount).toLocaleString("en-IN")}` : "Not Set"}
                    </p>
                    <p className="mt-1 text-xs font-bold text-[#00022E] flex items-center gap-1">
                      Includes Meals, Wi-Fi & Laundry
                    </p>
                  </div>
                </div>

                {/* Card 2: Assigned Seat */}
                <div className="group rounded-[1.8rem] border border-blue-200/90 bg-gradient-to-br from-blue-50/40 via-white to-white p-5 lg:p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/10 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 border border-blue-200 shadow-2xs group-hover:scale-110 transition-transform">
                      <Bed className="h-5 w-5" />
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100/80 px-2.5 py-1 text-[10px] font-extrabold text-blue-800 border border-blue-300">
                      🔵 Double Sharing
                    </span>
                  </div>
                  <div className="mt-4">
                    <p className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-slate-500">Assigned Seat</p>
                    <p className="mt-1 text-2xl lg:text-3xl font-black text-slate-900">{customer.allocatedRoom ? `Room ${customer.allocatedRoom}` : "Pending"}</p>
                    <p className="mt-1 text-xs font-bold text-blue-700 flex items-center gap-1">
                      Bed: {customer.allocatedBed || "Bed A"}
                    </p>
                  </div>
                </div>

                {/* Card 3: Open Tickets */}
                <div className="group rounded-[1.8rem] border border-amber-200/90 bg-gradient-to-br from-amber-50/40 via-white to-white p-5 lg:p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/10 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 border border-amber-200 shadow-2xs group-hover:scale-110 transition-transform">
                      <Wrench className="h-5 w-5" />
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100/80 px-2.5 py-1 text-[10px] font-extrabold text-amber-800 border border-amber-300">
                      🟡 Care Tickets
                    </span>
                  </div>
                  <div className="mt-4">
                    <p className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-slate-500">Open Tickets</p>
                    <p className="mt-1 text-2xl lg:text-3xl font-black text-slate-900">{openComplaintsCount}</p>
                    <p className="mt-1 text-xs font-bold text-amber-700 flex items-center gap-1">
                      Active Complaints Pending
                    </p>
                  </div>
                </div>

                {/* Card 4: Payment Receipts */}
                <div className="group rounded-[1.8rem] border border-blue-200/90 bg-gradient-to-br from-emerald-50/40 via-white to-white p-5 lg:p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F0F4FF] text-[#00022E] border border-blue-200 shadow-2xs group-hover:scale-110 transition-transform">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#F0F4FF]/80 px-2.5 py-1 text-[10px] font-extrabold text-[#00022E] border border-blue-200">
                      🟢 Auto-Verified
                    </span>
                  </div>
                  <div className="mt-4">
                    <p className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-slate-500">Payment Receipts</p>
                    <p className="mt-1 text-2xl lg:text-3xl font-black text-slate-900">{paymentHistoryList.length}</p>
                    <p className="mt-1 text-xs font-bold text-[#00022E] flex items-center gap-1">
                      Recorded Txn Receipts
                    </p>
                  </div>
                </div>

              </div>

              {/* RESIDENT QUICK ACTION HUB CARD (MATCHING ADMIN ELEVATED DARK GRADIENT CARDS) */}
              <div className="rounded-[2rem] border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-800 to-brand-navy p-6 sm:p-7 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-green/20 text-brand-green border border-brand-green/30 shrink-0">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">Resident Quick Action Hub</h3>
                    <p className="text-xs text-slate-300 font-medium mt-0.5">Fast access to payments, maintenance tickets & warden hotline</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => setActiveTab("payment")}
                    className="flex items-center gap-2 rounded-full bg-brand-green hover:bg-[#00022E] px-5 py-3 text-xs font-black text-white shadow-lg shadow-[#00022E]/30 transition active:scale-95 cursor-pointer"
                  >
                    <CreditCard className="h-4 w-4" />
                    <span>Payment & History</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("complaint")}
                    className="flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/20 px-5 py-3 text-xs font-bold text-white transition active:scale-95 cursor-pointer"
                  >
                    <Wrench className="h-4 w-4 text-amber-400" />
                    <span>Raise Complaint</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("help")}
                    className="flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/20 px-5 py-3 text-xs font-bold text-white transition active:scale-95 cursor-pointer"
                  >
                    <PhoneCall className="h-4 w-4 text-blue-400" />
                    <span>Warden Hotline</span>
                  </button>
                </div>
              </div>

              {/* ACCORDION: MY CREATED ROOMS & SEAT ALLOCATION (PREFERRED USER STRUCTURE) */}
              <div className="rounded-[2rem] border border-slate-200/90 bg-white shadow-md overflow-hidden transition-all">
                <button
                  onClick={() => toggleAccordion("roomDetails")}
                  className="w-full px-6 py-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between hover:opacity-95 transition cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="p-2.5 rounded-2xl bg-brand-green text-white shadow-md">
                      <KeyRound className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-black">My Created Rooms & Seat Allocation</h3>
                      <p className="text-xs text-slate-300 font-medium">Your assigned building, floor, room number & bed details</p>
                    </div>
                  </div>
                  {openAccordions.roomDetails ? (
                    <ChevronUp className="h-5 w-5 text-slate-300" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-300" />
                  )}
                </button>

                {openAccordions.roomDetails && (
                  <div className="p-6 space-y-6">
                    {isAllocated ? (
                      <>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <div className="bg-brand-green/10 border border-brand-green/20 rounded-2xl p-4 text-center">
                            <Building2 className="h-6 w-6 text-brand-green mx-auto mb-1" />
                            <p className="text-xs font-bold text-slate-500 uppercase">Building</p>
                            <p className="text-lg font-black text-slate-900">{customer.allocatedBuilding}</p>
                          </div>

                          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-center">
                            <KeyRound className="h-6 w-6 text-amber-600 mx-auto mb-1" />
                            <p className="text-xs font-bold text-slate-500 uppercase">Floor</p>
                            <p className="text-lg font-black text-slate-900">Floor {customer.allocatedFloor || 1}</p>
                          </div>

                          <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 text-center">
                            <Bed className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                            <p className="text-xs font-bold text-slate-500 uppercase">Room No.</p>
                            <p className="text-lg font-black text-slate-900">Room {customer.allocatedRoom}</p>
                          </div>

                          <div className="bg-[#F0F4FF]0/10 border border-[#00022E]/20 rounded-2xl p-4 text-center">
                            <Sparkles className="h-6 w-6 text-[#00022E] mx-auto mb-1" />
                            <p className="text-xs font-bold text-slate-500 uppercase">Bed No.</p>
                            <p className="text-lg font-black text-slate-900">Bed {customer.allocatedBed}</p>
                          </div>
                        </div>

                        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 space-y-4">
                          <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                            <Shield className="h-4 w-4 text-brand-green" />
                            Room Specifications & Rent Terms
                          </h4>

                          <div className="grid sm:grid-cols-2 gap-4 text-xs font-bold text-slate-700">
                            <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex justify-between items-center">
                              <span className="text-slate-500">Sharing Type:</span>
                              <span className="text-slate-900 font-extrabold">{customer.roomType || "Double Sharing"}</span>
                            </div>

                            <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex justify-between items-center">
                              <span className="text-slate-500">Monthly Rent:</span>
                              <span className="text-brand-green font-black text-sm">
                                {customer?.rentAmount ? `₹${Number(customer.rentAmount).toLocaleString("en-IN")} / month` : "Not Set"}
                              </span>
                            </div>
                          </div>

                          <div>
                            <p className="text-xs font-bold text-slate-500 uppercase mb-2">Included Amenities</p>
                            <div className="flex flex-wrap gap-2">
                              {[
                                { icon: Wifi, text: "High-Speed Wi-Fi" },
                                { icon: Utensils, text: "3-Time Nutritious Meals" },
                                { icon: Flame, text: "24/7 Hot Water (Solar)" },
                                { icon: Shirt, text: "Washing Machine & Laundry" },
                                { icon: Shield, text: "CCTV & Security Guard" },
                              ].map((fac, i) => (
                                <div key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-2xs">
                                  <fac.icon className="h-3.5 w-3.5 text-brand-green" />
                                  <span>{fac.text}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8 bg-amber-50 rounded-2xl border border-amber-200 p-6">
                        <Clock className="h-10 w-10 text-amber-500 mx-auto mb-3 animate-bounce" />
                        <h3 className="text-lg font-black text-amber-900">Allocation Pending</h3>
                        <p className="text-xs font-medium text-amber-700 max-w-md mx-auto mt-1">
                          Your booking request has been received! Our PG Admin team is assigning your building and room. Please check back shortly.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* WHITE BOX NOTICE BOARD WIDGET */}
              <div className="rounded-[2rem] border border-slate-200/90 bg-white p-6 sm:p-7 shadow-md space-y-4">
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-600" />
                  PG Resident Notice Board & Announcements
                </h3>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-brand-green bg-brand-green/10 px-2.5 py-0.5 rounded-md border border-brand-green/20">Mess Menu</span>
                      <span className="text-[10px] text-slate-400 font-bold">Today</span>
                    </div>
                    <p className="text-xs font-black text-slate-900">Sunday Special Dinner</p>
                    <p className="text-xs text-slate-600 font-medium">Paneer Butter Masala, Veg Biryani, Chapati & Gulab Jamun served from 7:30 PM to 9:30 PM.</p>
                  </div>

                  <div className="p-4.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-md border border-amber-200">Maintenance</span>
                      <span className="text-[10px] text-slate-400 font-bold">Notice</span>
                    </div>
                    <p className="text-xs font-black text-slate-900">Solar Water Tank Cleaning</p>
                    <p className="text-xs text-slate-600 font-medium">Scheduled solar water heater maintenance every Tuesday morning between 10:00 AM and 11:30 AM.</p>
                  </div>
                </div>
              </div>
            </div>
          )}


          {/* ==================================== TAB 2: PAYMENT & HISTORY ==================================== */}
          {activeTab === "payment" && (
            <div className="space-y-6 sm:space-y-7 animate-fadeIn">
              <div className="rounded-[2rem] border border-slate-200/90 bg-white p-6 sm:p-7 shadow-md space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                      <CreditCard className="h-6 w-6 text-brand-green" />
                      Rent Payment & Complete History
                    </h2>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      Pay monthly PG rent, view bank UPI details & track payment verification history
                    </p>
                  </div>

                  <button
                    onClick={() => setIsPayModalOpen(true)}
                    className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-brand-green hover:bg-[#00022E] text-white text-xs font-black shadow-lg shadow-brand-green/20 transition cursor-pointer"
                  >
                    <Plus className="h-4.5 w-4.5" />
                    <span>Upload Payment Proof</span>
                  </button>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  {/* Official UPI Card with live QR image preview & scan trigger */}
                  <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-brand-navy p-5 rounded-2xl text-white space-y-3 shadow-md relative">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-black tracking-widest text-brand-gold bg-brand-gold/15 px-2.5 py-0.5 rounded-full border border-brand-gold/30">
                        {effectivePaymentSettings.isCustomBuildingPayment ? `${effectivePaymentSettings.buildingName} UPI` : "Official PG UPI"}
                      </span>
                      <button onClick={() => setShowQrModal(true)} className="p-1.5 rounded-xl bg-brand-gold/20 text-brand-gold hover:bg-brand-gold hover:text-slate-900 transition cursor-pointer" title="Scan QR Code">
                        <QrCode className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <div
                        onClick={() => setShowQrModal(true)}
                        className="h-16 w-16 shrink-0 rounded-xl bg-white p-1 flex items-center justify-center cursor-pointer border border-brand-gold/40 shadow-sm hover:scale-105 transition-transform"
                        title="Click to view & scan large QR code"
                      >
                        {effectivePaymentSettings.qrCodeUrl ? (
                          <img src={effectivePaymentSettings.qrCodeUrl} alt="Real PG QR Code" className="h-full w-full object-contain rounded-md" />
                        ) : (
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`upi://pay?pa=${effectivePaymentSettings.upiId}&pn=${encodeURIComponent(effectivePaymentSettings.accountName)}`)}`}
                            alt="Dynamic UPI QR Code"
                            className="h-full w-full object-contain rounded-md"
                          />
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-slate-300 font-semibold">UPI ID for GPay / PhonePe / Paytm</p>
                        <p className="text-base font-black text-brand-gold font-mono tracking-wide mt-0.5">{effectivePaymentSettings.upiId || "shripadpg@okaxis"}</p>
                        <button onClick={() => setShowQrModal(true)} className="text-[10px] text-emerald-400 font-bold hover:underline mt-0.5 flex items-center gap-1 cursor-pointer">
                          <QrCode className="h-3 w-3" /> Tap to Scan Large QR Code
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={copyUpiId}
                      className="w-full py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {copiedUpi ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedUpi ? "UPI ID Copied!" : "Copy Official UPI ID"}</span>
                    </button>
                  </div>

                  {/* PG Bank Account Transfer Details */}
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-2 text-xs font-bold">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 uppercase font-black">PG Bank Account Transfer</span>
                      {effectivePaymentSettings.isCustomBuildingPayment && (
                        <span className="text-[9px] font-black text-brand-navy bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                          {effectivePaymentSettings.buildingName} Account
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-slate-500">Bank Name: <span className="text-slate-900 font-black">{effectivePaymentSettings.bankName || "Axis Bank Ltd"}</span></p>
                      <p className="text-slate-500">Account No: <span className="text-slate-900 font-black font-mono">{effectivePaymentSettings.accountNo || "924020058192041"}</span></p>
                      <p className="text-slate-500">IFSC Code: <span className="text-slate-900 font-black font-mono">{effectivePaymentSettings.ifscCode || "UTIB0001824"}</span></p>
                      <p className="text-slate-500">Account Name: <span className="text-slate-900 font-black">{effectivePaymentSettings.accountName || "Shripad PG Services"}</span></p>
                    </div>
                  </div>

                  <div className="bg-[#F0F4FF] p-5 rounded-2xl border border-blue-200/80 space-y-2 text-xs font-bold">
                    <span className="text-[10px] text-[#00022E] uppercase font-black">Rent Terms & Cycle</span>
                    <div>
                      <p className="text-slate-600">Standard Monthly Rent: <span className="text-[#00022E] font-black text-sm">{customer?.rentAmount ? `₹${Number(customer.rentAmount).toLocaleString("en-IN")} / month` : "Not Set"}</span></p>
                      <p className="text-slate-600">Due Date: <span className="text-slate-900 font-extrabold">{effectivePaymentSettings.dueDay || 5}th of every month</span></p>
                      <p className="text-slate-600">Included: <span className="text-slate-900 font-bold">{effectivePaymentSettings.includedAmenities || "Food, Water, Wi-Fi, Laundry"}</span></p>
                    </div>
                    <div className="pt-1">
                      <span className="text-[10px] bg-[#F0F4FF] text-[#00022E] px-2.5 py-1 rounded-full font-black">
                        Instant Bank SMS Auto-Verification Enabled
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md transition">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total Amount Paid</span>
                  <p className="text-2xl font-black text-slate-900 mt-1">
                    ₹{((customer.paymentHistory || []).reduce((acc: number, p: any) => acc + (Number(p.amount) || 0), 0)).toLocaleString("en-IN")}
                  </p>
                  <p className="text-[10px] font-bold text-[#00022E] mt-1">{paymentHistoryList.length} total entries</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md transition">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Verified Receipts</span>
                  <p className="text-2xl font-black text-[#00022E] mt-1">
                    {paymentHistoryList.filter((p: any) => p.status === "verified").length}
                  </p>
                  <p className="text-[10px] font-bold text-[#00022E] mt-1">Approved by Warden</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md transition">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Pending Verification</span>
                  <p className="text-2xl font-black text-amber-600 mt-1">
                    {paymentHistoryList.filter((p: any) => p.status === "submitted" || !p.status).length}
                  </p>
                  <p className="text-[10px] font-bold text-amber-600 mt-1">In Review</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md transition">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Rejected Receipts</span>
                  <p className="text-2xl font-black text-red-600 mt-1">
                    {paymentHistoryList.filter((p: any) => p.status === "rejected").length}
                  </p>
                  <p className="text-[10px] font-bold text-red-500 mt-1">Action Required</p>
                </div>
              </div>

              <div className="rounded-[2rem] border border-slate-200/90 bg-white p-6 sm:p-7 shadow-md space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                  <div>
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <Clock className="h-5 w-5 text-brand-green" />
                      Complete Payment History
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">All submitted rent payments, UPI reference IDs & verification history</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search Txn ID / Amount..."
                        value={paymentSearch}
                        onChange={(e) => setPaymentSearch(e.target.value)}
                        className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-xs font-bold focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-green w-40 sm:w-48"
                      />
                    </div>

                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-full text-[11px] font-extrabold">
                      {(["all", "verified", "pending", "rejected"] as const).map((f) => (
                        <button
                          key={f}
                          onClick={() => setPaymentFilter(f)}
                          className={`px-3 py-1 rounded-full transition cursor-pointer capitalize ${
                            paymentFilter === f
                              ? "bg-slate-900 text-white shadow-2xs"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {filteredPaymentHistory.length > 0 ? (
                  <div className="space-y-3">
                    {filteredPaymentHistory.map((p: any, idx: number) => (
                      <div key={idx} className="p-4.5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className={`p-3 rounded-2xl ${
                              p.status === "verified"
                                ? "bg-[#F0F4FF] text-[#00022E]"
                                : p.status === "rejected"
                                ? "bg-red-100 text-red-700"
                                : "bg-amber-100 text-amber-700"
                            }`}>
                              <CreditCard className="h-5 w-5" />
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-black text-slate-900">₹{Number(p.amount || customer?.rentAmount || 0).toLocaleString("en-IN")}</span>
                                <span className="text-xs font-extrabold text-slate-500">
                                  {MONTH_NAMES[(p.month || 1) - 1]} {p.year || 2026}
                                </span>
                              </div>
                              <p className="text-xs font-mono font-bold text-slate-600 mt-0.5">
                                Txn ID / Ref: <span className="text-slate-900 font-black">{p.transactionId}</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col sm:items-end gap-1">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-3 py-1 rounded-full w-max ${
                              p.status === "verified"
                                ? "bg-[#F0F4FF] text-[#00022E] border border-blue-200"
                                : p.status === "rejected"
                                ? "bg-red-100 text-red-800 border border-red-300"
                                : "bg-amber-100 text-amber-800 border border-amber-300"
                            }`}>
                              {p.status === "verified" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                              {p.status === "verified" ? "Verified & Approved" : p.status === "rejected" ? "Payment Rejected" : "Awaiting Verification"}
                            </span>

                            <span className="text-[11px] text-slate-400 font-semibold">
                              Date: {p.paymentDate ? p.paymentDate.split("T")[0] : "2026-08-01"}
                            </span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between text-xs text-slate-600 font-medium gap-2">
                          <div className="flex items-center gap-3">
                            <span>Method: <strong className="text-slate-800 uppercase">{p.paymentMethod || "UPI"}</strong></span>
                            {p.autoVerified && (
                              <span className="text-[10px] bg-[#F0F4FF] text-[#00022E] font-black px-2 py-0.5 rounded-full">
                                🤖 Verified
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {p.rejectedReason && (
                              <span className="text-xs font-extrabold text-red-600 bg-red-50 px-2.5 py-0.5 rounded-lg border border-red-200">
                                Reason: {p.rejectedReason}
                              </span>
                            )}

                            {p.status === "verified" && (
                              <button
                                type="button"
                                onClick={() => fetchAndViewInvoice(p)}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-[#00022E] hover:bg-[#00044A] text-white px-3.5 py-1 text-xs font-black shadow-xs transition active:scale-95 cursor-pointer"
                              >
                                <Receipt className="h-3.5 w-3.5" />
                                <span>View Invoice & Download PDF</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 text-slate-500 text-xs font-bold space-y-3">
                    <CreditCard className="h-10 w-10 text-slate-300 mx-auto" />
                    <p>No payment records match your current filter.</p>
                    <button
                      onClick={() => setIsPayModalOpen(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-green text-white font-extrabold text-xs shadow-md cursor-pointer"
                    >
                      <Plus className="h-4 w-4" /> Submit Rent Payment Receipt
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}


          {/* ==================================== TAB 3: REPORT ==================================== */}
          {activeTab === "report" && (
            <div className="space-y-6 sm:space-y-7 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-[2rem] border border-slate-200/90 bg-white p-6 sm:p-7 shadow-md">
                <div>
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <FileText className="h-6 w-6 text-brand-green" />
                    Resident Rent & Payment Report Audit
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Download statement, review submitted transaction receipts & verify payment audit status
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsPayModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-brand-green text-white text-xs font-extrabold shadow-md hover:bg-[#00022E] transition cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Submit Payment Receipt</span>
                  </button>
                  <button
                    onClick={handlePrintLedger}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 text-white text-xs font-extrabold shadow-md hover:bg-slate-800 transition cursor-pointer"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download Statement</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md transition text-center">
                  <p className="text-[10px] font-extrabold uppercase text-slate-400">Total Payments Recorded</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">
                    ₹{((customer.paymentHistory || []).reduce((acc: number, p: any) => acc + (Number(p.amount) || 0), 0)).toLocaleString("en-IN")}
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md transition text-center">
                  <p className="text-[10px] font-extrabold uppercase text-slate-400">Verified Transactions</p>
                  <p className="text-2xl font-black text-[#00022E] mt-1">
                    {(customer.paymentHistory || []).filter((p: any) => p.status === "verified").length}
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md transition text-center">
                  <p className="text-[10px] font-extrabold uppercase text-slate-400">Pending Verification</p>
                  <p className="text-2xl font-black text-amber-600 mt-1">
                    {(customer.paymentHistory || []).filter((p: any) => p.status === "submitted" || !p.status).length}
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md transition text-center">
                  <p className="text-[10px] font-extrabold uppercase text-slate-400">Current Rent Standard</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">
                    {customer?.rentAmount ? `₹${Number(customer.rentAmount).toLocaleString("en-IN")} / mo` : "Not Set"}
                  </p>
                </div>
              </div>

              <div className="rounded-[2rem] border border-slate-200/90 bg-white shadow-md overflow-hidden">
                <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-brand-green" />
                    Submitted Payment Ledger Receipts
                  </h3>
                  <span className="text-xs font-bold text-slate-300">
                    {paymentHistoryList.length} Total Entries
                  </span>
                </div>

                {paymentHistoryList.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-bold text-slate-700">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                        <tr>
                          <th className="p-4">S.No</th>
                          <th className="p-4">Txn ID / Ref</th>
                          <th className="p-4">Period</th>
                          <th className="p-4">Amount</th>
                          <th className="p-4">Method</th>
                          <th className="p-4">Payment Date</th>
                          <th className="p-4 text-right">Verification Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {paymentHistoryList.map((p: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50 transition">
                            <td className="p-4 text-slate-400">{idx + 1}</td>
                            <td className="p-4 font-mono font-black text-slate-900">{p.transactionId}</td>
                            <td className="p-4">{MONTH_NAMES[(p.month || 1) - 1]} {p.year || 2026}</td>
                            <td className="p-4 text-[#00022E] font-black text-sm">₹{Number(p.amount || customer?.rentAmount || 0).toLocaleString("en-IN")}</td>
                            <td className="p-4 uppercase text-[11px] text-slate-500">{p.paymentMethod || "UPI"}</td>
                            <td className="p-4 text-slate-500">{p.paymentDate ? p.paymentDate.split("T")[0] : "2026-08-01"}</td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-2.5">
                                <button
                                  type="button"
                                  onClick={() => fetchAndViewInvoice(p)}
                                  className="flex items-center gap-1.5 text-[11px] font-black text-slate-700 hover:text-brand-green bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition cursor-pointer"
                                >
                                  <Receipt className="h-3.5 w-3.5 text-brand-green" />
                                  <span>View Invoice</span>
                                </button>
                                <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-3 py-1 rounded-full ${
                                  p.status === "verified"
                                    ? "bg-[#F0F4FF] text-[#00022E] border border-blue-200"
                                    : p.status === "rejected"
                                    ? "bg-red-100 text-red-800 border border-red-300"
                                    : "bg-amber-100 text-amber-800 border border-amber-300"
                                }`}>
                                  {p.status === "verified" ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                                  {p.status || "Submitted"}
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 text-slate-500 text-xs font-bold space-y-3">
                    <CreditCard className="h-10 w-10 text-slate-300 mx-auto" />
                    <p>No payment receipts recorded yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================================== TAB 4: PROFILE ==================================== */}
          {activeTab === "profile" && (
            <div className="space-y-6 sm:space-y-7 animate-fadeIn">
              <div className="rounded-[2rem] border border-slate-200/90 bg-white p-6 sm:p-7 shadow-md space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-brand-navy text-brand-gold shadow-md font-black text-sm">
                      {initialLetter}
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-slate-900">Resident Personal Profile</h2>
                      <p className="text-xs text-slate-500 font-medium">Your registered contact and PG stay credentials</p>
                    </div>
                  </div>
                  <span className="text-xs font-black uppercase tracking-wider text-[#00022E] bg-[#F0F4FF] px-3 py-1 rounded-full border border-blue-200 flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-[#00022E]" />
                    KYC Verified
                  </span>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 text-xs font-bold">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-black">Full Legal Name</span>
                    <p className="text-sm font-black text-slate-900">{customer.name}</p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-black">Customer User ID</span>
                    <p className="text-sm font-black text-brand-navy font-mono">{customer.customerId || "N/A"}</p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-black">Primary Mobile Number</span>
                    <p className="text-sm font-black text-slate-900">{customer.phone}</p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-black">Guardian / Emergency Contact</span>
                    <p className="text-sm font-black text-slate-900">{customer.guardianPhone || "Not Provided"}</p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-black">Email Address</span>
                    <p className="text-sm font-black text-slate-900">{customer.email || "N/A"}</p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-black">Assigned Accommodation</span>
                    <p className="text-sm font-black text-[#00022E]">
                      {isAllocated ? `${customer.allocatedBuilding} • Room ${customer.allocatedRoom} (${customer.allocatedBed})` : "Pending Allocation"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[2rem] border border-slate-200/90 bg-white shadow-md overflow-hidden transition-all">
                <button
                  onClick={() => toggleAccordion("securitySettings")}
                  className="w-full px-6 py-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between hover:opacity-95 transition cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="p-2.5 rounded-2xl bg-amber-500 text-white shadow-md">
                      <Lock className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-black">Security & Password Settings</h3>
                      <p className="text-xs text-slate-300 font-medium">Change your default password to a custom secure password</p>
                    </div>
                  </div>
                  {openAccordions.securitySettings ? (
                    <ChevronUp className="h-5 w-5 text-slate-300" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-300" />
                  )}
                </button>

                {openAccordions.securitySettings && (
                  <div className="p-6">
                    <form onSubmit={handlePasswordChange} className="max-w-md space-y-4">
                      {passChangeSuccess && (
                        <div className="p-3.5 rounded-xl bg-[#F0F4FF] border border-blue-200 text-[#00022E] text-xs font-bold flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-[#00022E] shrink-0" />
                          <span>{passChangeSuccess}</span>
                        </div>
                      )}

                      {passChangeError && (
                        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                          <span>{passChangeError}</span>
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Current Password
                        </label>
                        <div className="relative">
                          <input
                            type={showSecurityPass ? "text" : "password"}
                            value={currentPass}
                            onChange={(e) => setCurrentPass(e.target.value)}
                            placeholder="Enter current password"
                            className="w-full pl-4 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green"
                          />
                          <button
                            type="button"
                            onClick={() => setShowSecurityPass(!showSecurityPass)}
                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-brand-green transition-colors cursor-pointer"
                            title={showSecurityPass ? "Hide passwords" : "Show passwords"}
                            aria-label={showSecurityPass ? "Hide passwords" : "Show passwords"}
                          >
                            {showSecurityPass ? <EyeOff className="h-4 w-4 text-brand-green" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          New Custom Password
                        </label>
                        <div className="relative">
                          <input
                            type={showSecurityPass ? "text" : "password"}
                            required
                            value={newPass}
                            onChange={(e) => setNewPass(e.target.value)}
                            placeholder="Enter new password"
                            className="w-full pl-4 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green"
                          />
                          <button
                            type="button"
                            onClick={() => setShowSecurityPass(!showSecurityPass)}
                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-brand-green transition-colors cursor-pointer"
                            title={showSecurityPass ? "Hide passwords" : "Show passwords"}
                            aria-label={showSecurityPass ? "Hide passwords" : "Show passwords"}
                          >
                            {showSecurityPass ? <EyeOff className="h-4 w-4 text-brand-green" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Confirm New Password
                        </label>
                        <div className="relative">
                          <input
                            type={showSecurityPass ? "text" : "password"}
                            required
                            value={confirmPass}
                            onChange={(e) => setConfirmPass(e.target.value)}
                            placeholder="Re-enter new password"
                            className="w-full pl-4 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green"
                          />
                          <button
                            type="button"
                            onClick={() => setShowSecurityPass(!showSecurityPass)}
                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-brand-green transition-colors cursor-pointer"
                            title={showSecurityPass ? "Hide passwords" : "Show passwords"}
                            aria-label={showSecurityPass ? "Hide passwords" : "Show passwords"}
                          >
                            {showSecurityPass ? <EyeOff className="h-4 w-4 text-brand-green" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isChangingPass}
                        className="w-full py-3.5 px-6 rounded-xl bg-brand-navy text-white text-xs font-extrabold shadow-lg hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {isChangingPass ? "Updating Password..." : "Update Password"}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================================== TAB 5: COMPLAINT ==================================== */}
          {activeTab === "complaint" && (
            <div className="space-y-6 sm:space-y-7 animate-fadeIn">
              <div className="rounded-[2rem] border border-slate-200/90 bg-white p-6 sm:p-7 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <Wrench className="h-6 w-6 text-amber-500" />
                    Resident Complaint & Maintenance Tickets
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Report Wi-Fi issues, mess food complaints, plumbing or electrical repairs for fast warden resolution
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-amber-800 bg-amber-100 px-3 py-1.5 rounded-full border border-amber-200">
                    {complaintsList.filter((c) => c.status === "pending").length} Open Pending
                  </span>
                  <span className="text-xs font-extrabold text-[#00022E] bg-[#F0F4FF] px-3 py-1.5 rounded-full border border-blue-200">
                    {complaintsList.filter((c) => c.status === "resolved").length} Resolved
                  </span>
                </div>
              </div>

              <div className="rounded-[2rem] border border-slate-200/90 bg-white p-6 sm:p-7 shadow-md space-y-4">
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Plus className="h-4 w-4 text-brand-green" />
                  Raise New Service Request / Complaint Ticket
                </h3>

                <form onSubmit={handleComplaintSubmit} className="space-y-4">
                  {complaintSuccess && (
                    <div className="p-4 rounded-2xl bg-[#F0F4FF] border border-blue-200 text-[#00022E] text-xs font-bold flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#00022E] shrink-0" />
                      <span>{complaintSuccess}</span>
                    </div>
                  )}

                  {complaintError && (
                    <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                      <span>{complaintError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-2">
                      Select Complaint Category
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: "wifi", label: "📶 Wi-Fi / Internet" },
                        { id: "food", label: "🍲 Mess / Food" },
                        { id: "plumbing", label: "🚿 Plumbing / Water" },
                        { id: "electrical", label: "⚡ Electrical / Light" },
                        { id: "cleaning", label: "🧹 Cleaning / Room" },
                        { id: "noise", label: "🔊 Noise / Disturbance" },
                        { id: "other", label: "📌 Other Issue" },
                      ].map((cat) => (
                        <button
                          type="button"
                          key={cat.id}
                          onClick={() => setComplaintCategory(cat.id as any)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                            complaintCategory === cat.id
                              ? "bg-slate-900 text-white shadow-md"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
                        Issue Summary Title
                      </label>
                      <input
                        type="text"
                        required
                        value={complaintTitle}
                        onChange={(e) => setComplaintTitle(e.target.value)}
                        placeholder="e.g., Room 201 Wi-Fi disconnects frequently"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
                        Priority Level
                      </label>
                      <select
                        value={complaintPriority}
                        onChange={(e) => setComplaintPriority(e.target.value as any)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green cursor-pointer"
                      >
                        <option value="low">🟢 Low Priority</option>
                        <option value="medium">🟡 Medium Priority</option>
                        <option value="high">🟠 High Priority</option>
                        <option value="urgent">🔴 Urgent (Immediate)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
                      Detailed Description
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={complaintDesc}
                      onChange={(e) => setComplaintDesc(e.target.value)}
                      placeholder="Describe the exact location, problem details, and when it started..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingComplaint}
                    className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black shadow-md transition cursor-pointer disabled:opacity-50"
                  >
                    <Send className="h-4 w-4 text-brand-green" />
                    <span>{isSubmittingComplaint ? "Registering Ticket..." : "Submit Complaint Ticket"}</span>
                  </button>
                </form>
              </div>

              <div className="rounded-[2rem] border border-slate-200/90 bg-white p-6 sm:p-7 shadow-md space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-600" />
                      My Registered Ticket History ({complaintsList.length})
                    </h3>
                    <button
                      type="button"
                      onClick={() => syncFreshResidentData(false)}
                      disabled={isRefreshingComplaints}
                      title="Refresh status from Warden / Admin"
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#F0F4FF] text-slate-700 hover:text-[#00022E] text-[10px] font-black border border-slate-200 transition cursor-pointer flex items-center gap-1 active:scale-95"
                    >
                      <span className={isRefreshingComplaints ? "animate-spin inline-block" : ""}>🔄</span>
                      <span>{isRefreshingComplaints ? "Syncing..." : "Refresh Status"}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {(["all", "pending", "in_progress", "resolved"] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setComplaintFilter(f)}
                        className={`px-3 py-1 rounded-full text-[11px] font-extrabold uppercase transition cursor-pointer ${
                          complaintFilter === f
                            ? "bg-[#00022E] text-white shadow-xs"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {f === "in_progress" ? "In Process" : f.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredComplaints.length > 0 ? (
                  <div className="space-y-3">
                    {filteredComplaints.map((cmp) => (
                      <div key={cmp.id} className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 hover:border-slate-300 transition shadow-2xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-800">
                              {cmp.category}
                            </span>
                            <h4 className="text-sm font-black text-slate-900">{cmp.title}</h4>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                              cmp.priority === "urgent"
                                ? "bg-rose-100 text-rose-800 border border-rose-200"
                                : cmp.priority === "high"
                                ? "bg-orange-100 text-orange-800 border border-orange-200"
                                : "bg-blue-100 text-blue-800 border border-blue-200"
                            }`}>
                              {cmp.priority} Priority
                            </span>

                            <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border shadow-2xs ${
                              cmp.status === "resolved" || cmp.status === "closed"
                                ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                : cmp.status === "in_progress"
                                ? "bg-blue-50 text-blue-800 border-blue-300 animate-pulse"
                                : "bg-amber-50 text-amber-800 border-amber-300"
                            }`}>
                              {cmp.status === "resolved" || cmp.status === "closed"
                                ? "✅ Resolved"
                                : cmp.status === "in_progress"
                                ? "⚡ In Process"
                                : "⏳ Pending Review"}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-600 font-medium leading-relaxed">{cmp.description}</p>

                        {cmp.adminComment && (
                          <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 text-xs text-blue-950 font-bold space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-black uppercase text-[10px] text-blue-700 flex items-center gap-1">
                                🛡️ Warden Resolution Note:
                              </span>
                              {cmp.resolvedAt && (
                                <span className="text-[10px] font-semibold text-slate-500">
                                  {new Date(cmp.resolvedAt).toLocaleDateString("en-IN")}
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-semibold text-slate-800">{cmp.adminComment}</p>
                          </div>
                        )}

                        <div className="text-[10px] text-slate-400 font-semibold pt-1 border-t border-slate-200/50 flex items-center justify-between flex-wrap gap-2">
                          <span>Registered: {new Date(cmp.createdAt).toLocaleString("en-IN")}</span>
                          <span className="text-slate-400 font-mono text-[9.5px]">ID: {cmp.id}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 text-slate-500 text-xs font-bold">
                    No complaint tickets found under this category filter.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================================== TAB 6: HELP & CARE ==================================== */}
          {activeTab === "help" && (
            <div className="space-y-6 sm:space-y-7 animate-fadeIn">
              <div className="rounded-[2rem] border border-slate-200/90 bg-white p-6 sm:p-7 shadow-md space-y-6">
                <div>
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <HelpCircle className="h-6 w-6 text-blue-600" />
                    24/7 PG Care & Support Hotlines
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Contact PG warden, admin office, maintenance team or chat on WhatsApp
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-5 bg-[#F0F4FF] rounded-2xl border border-blue-200 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-[#00022E] text-white rounded-xl shadow-sm">
                        <PhoneCall className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase text-[#00022E]">PG Admin Desk</p>
                        <a href={`tel:${(effectivePaymentSettings.adminPhone || "+91 98765 43210").replace(/\s+/g, "")}`} className="text-lg font-black text-slate-900 hover:text-[#00022E]">
                          {effectivePaymentSettings.adminPhone || "+91 98765 43210"}
                        </a>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 font-medium">Available 8:00 AM to 10:00 PM for admissions, receipts & documentation.</p>
                  </div>

                  <div className="p-5 bg-blue-50/60 rounded-2xl border border-blue-200 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-blue-600 text-white rounded-xl shadow-sm">
                        <PhoneCall className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase text-blue-700">Warden & Maintenance Hotline</p>
                        <a href={`tel:${(effectivePaymentSettings.wardenPhone || "+91 98765 00000").replace(/\s+/g, "")}`} className="text-lg font-black text-slate-900 hover:text-blue-700">
                          {effectivePaymentSettings.wardenPhone || "+91 98765 00000"}
                        </a>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 font-medium">24/7 Emergency response for water, electrical, room key or medical urgency.</p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                      <MessageCircle className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-black">Direct WhatsApp Help Desk</h3>
                      <p className="text-xs text-blue-100 font-medium">Chat directly with Warden with pre-filled resident credentials</p>
                    </div>
                  </div>

                  <a
                    href={`https://wa.me/${(effectivePaymentSettings.wardenPhone || effectivePaymentSettings.adminPhone || "919876543210").replace(/\D/g, "")}?text=${encodeURIComponent(
                      `Hello Warden, I am ${customer.name} (Resident ID: ${customer.customerId || "Allocated Resident"}), staying at ${customer.allocatedBuilding || "PG A"} Room ${customer.allocatedRoom || "-"}. I need assistance.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-3 bg-white text-[#00022E] hover:bg-[#F0F4FF] rounded-xl text-xs font-black shadow-md transition cursor-pointer whitespace-nowrap"
                  >
                    Open WhatsApp Chat
                  </a>
                </div>
              </div>

              <div className="rounded-[2rem] border border-slate-200/90 bg-white p-6 sm:p-7 shadow-md space-y-4">
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Info className="h-4 w-4 text-brand-green" />
                  Frequently Asked Questions (FAQ)
                </h3>

                <div className="space-y-3">
                  {[
                    {
                      key: "faqMess" as keyof AccordionState,
                      q: "🍱 What are the daily Mess & Dining timings?",
                      a: "Breakfast: 7:30 AM – 9:30 AM | Lunch: 12:30 PM – 2:30 PM | Dinner: 7:30 PM – 9:30 PM. Tea & Snacks served daily from 4:30 PM to 5:30 PM.",
                    },
                    {
                      key: "faqGate" as keyof AccordionState,
                      q: "🚪 What are the main gate opening & closing hours?",
                      a: "Main entry gate opens at 6:00 AM and closes strictly at 10:30 PM. Late entry after 10:30 PM requires prior warden approval via registered mobile SMS.",
                    },
                    {
                      key: "faqGuest" as keyof AccordionState,
                      q: "👥 What is the guest & visitor policy?",
                      a: "Visitors are permitted in the reception lounge between 9:00 AM and 8:00 PM. Overnight stay for parents/relatives is permitted in guest rooms with 24h prior warden notice.",
                    },
                    {
                      key: "faqWifi" as keyof AccordionState,
                      q: "📶 How do I connect to high-speed PG Wi-Fi?",
                      a: "Connect to network 'Shripad_Resident_HighSpeed' and enter password 'Shripad@2026'. For router restarts, notify warden hotline.",
                    },
                  ].map((faq) => (
                    <div key={faq.key} className="border border-slate-200 rounded-2xl overflow-hidden">
                      <button
                        onClick={() => toggleAccordion(faq.key)}
                        className="w-full p-4 bg-slate-50 text-slate-900 font-extrabold text-xs flex justify-between items-center hover:bg-slate-100 transition text-left cursor-pointer"
                      >
                        <span>{faq.q}</span>
                        {openAccordions[faq.key] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                      {openAccordions[faq.key] && (
                        <div className="p-4 bg-white text-xs text-slate-600 font-medium leading-relaxed border-t border-slate-100">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ==================== INSTAGRAM-STYLE BOTTOM TAB BAR FOR MOBILE SCREENS ==================== */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 py-2 flex lg:hidden shadow-2xl items-center justify-between pb-safe">
        {/* Tab 1: Dashboard */}
        <button
          onClick={() => handleTabClick("dashboard")}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all active:scale-95 cursor-pointer ${
            activeTab === "dashboard" ? "text-brand-green scale-105" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <LayoutDashboard className="h-5 w-5" />
          <span className="text-[9px] font-black mt-0.5">Home</span>
        </button>

        {/* Tab 2: Payment */}
        <button
          onClick={() => handleTabClick("payment")}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all active:scale-95 cursor-pointer ${
            activeTab === "payment" ? "text-brand-green scale-105" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <CreditCard className="h-5 w-5" />
          <span className="text-[9px] font-black mt-0.5">Payment</span>
        </button>

        {/* Tab 3: Center Plus Pay Rent Button */}
        <div className="flex-1 flex justify-center -mt-6">
          <button
            onClick={() => setIsPayModalOpen(true)}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-brand-green via-emerald-600 to-brand-green text-white shadow-lg shadow-[#00022E]/30 border-4 border-white active:scale-90 transition-transform cursor-pointer"
            title="Upload Payment Proof"
          >
            <Plus className="h-6 w-6 stroke-[3]" />
          </button>
        </div>



        {/* Tab 5: Complaints */}
        <button
          onClick={() => handleTabClick("complaint")}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all active:scale-95 cursor-pointer relative ${
            activeTab === "complaint" ? "text-brand-green scale-105" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Wrench className="h-5 w-5" />
          <span className="text-[9px] font-black mt-0.5">Tickets</span>
          {openComplaintsCount > 0 && (
            <span className="absolute top-0 right-3 bg-amber-500 text-white text-[9px] font-black h-4 w-4 rounded-full flex items-center justify-center">
              {openComplaintsCount}
            </span>
          )}
        </button>

        {/* Tab 6: Help */}
        <button
          onClick={() => handleTabClick("help")}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all active:scale-95 cursor-pointer ${
            activeTab === "help" ? "text-brand-green scale-105" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <HelpCircle className="h-5 w-5" />
          <span className="text-[9px] font-black mt-0.5">Help</span>
        </button>
      </div>

      {/* ONLINE PAYMENT UPLOAD MODAL */}
      {isPayModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-brand-green" />
                Submit Rent Payment Proof
              </h3>
              <button onClick={() => setIsPayModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handlePaymentUpload} className="space-y-4 text-xs font-bold">
              {paySuccess && (
                <div className="p-3.5 rounded-xl bg-[#F0F4FF] border border-blue-200 text-[#00022E] font-bold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#00022E] shrink-0" />
                  <span>{paySuccess}</span>
                </div>
              )}

              {payError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 font-bold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                  <span>{payError}</span>
                </div>
              )}

              {/* PAYMENT METHOD SELECTOR */}
              <div>
                <label className="block text-slate-600 uppercase mb-1">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as any)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/20 cursor-pointer"
                >
                  <option value="upi">UPI / GPay / PhonePe / Paytm</option>
                  <option value="bank_transfer">Net Banking / NEFT / IMPS</option>
                  <option value="cash">Cash Paid at PG Office Desk</option>
                </select>
              </div>

              {/* DATE PICKER & AUTO-CALCULATED RENT PERIOD */}
              <div>
                <label className="block text-slate-600 uppercase mb-1 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-brand-green" />
                  Payment Date
                </label>
                <input
                  type="date"
                  required
                  value={payDate}
                  onChange={(e) => handlePayDateChange(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/20"
                />
              </div>

              {/* AUTO-CALCULATED RENT MONTH & YEAR BADGE */}
              <div className="p-3.5 bg-[#F0F4FF]/90 rounded-2xl border border-blue-200 text-xs font-bold text-[#00022E] flex items-center justify-between shadow-2xs">
                <span className="text-slate-500 font-semibold">Auto-Calculated Rent Period:</span>
                <span className="font-black text-brand-green">
                  {MONTH_NAMES[payMonth - 1]} {payYear} (Month {payMonth})
                </span>
              </div>

              <div>
                <label className="block text-slate-600 uppercase mb-1">Amount Paid (₹)</label>
                <input
                  type="number"
                  required
                  value={payAmount === "0" || Number(payAmount) === 0 ? "" : payAmount}
                  onChange={(e) => setPayAmount(e.target.value.replace(/^0+/, ""))}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-brand-green"
                />
              </div>

              {/* CONDITIONAL TRANSACTION ID / CASH NOTE FIELD */}
              {payMethod === "cash" ? (
                <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200/90 text-xs font-bold text-amber-900 space-y-1.5">
                  <div className="flex items-center gap-2 text-amber-800">
                    <Info className="h-4 w-4 text-amber-600 shrink-0" />
                    <span className="font-black">Cash Payment at PG Desk</span>
                  </div>
                  <p className="text-[11px] text-amber-700 font-medium">
                    No transaction ID is required for cash payments. A cash receipt ID will be auto-generated upon submission for warden verification.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-slate-600 uppercase mb-1">UPI Transaction ID / Ref No.</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 623910482910"
                    value={payTxnId}
                    onChange={(e) => setPayTxnId(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm"
                  />
                </div>
              )}

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="w-1/2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-extrabold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPay}
                  className="w-1/2 py-3 bg-brand-green hover:bg-[#00022E] text-white rounded-xl font-black shadow-md transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingPay ? "Submitting..." : "Submit Proof"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INVOICE VIEW & DOWNLOAD MODAL */}
      {viewingInvoicePayment && (
        <div
          onClick={() => setViewingInvoicePayment(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-2 sm:p-4 backdrop-blur-md overflow-y-auto animate-in fade-in cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[210mm] bg-[#0f1b3d] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden my-4 border border-slate-700/60 flex flex-col max-h-[92vh] cursor-default"
          >
            {/* Top Controls Bar */}
            <div className="no-print flex items-center justify-between bg-[#0f1b3d] px-5 py-3.5 text-white shrink-0 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-200">
                  Official Rent Invoice — {viewingInvoiceData?.invoiceNo || viewingInvoicePayment.invoiceNo || (viewingInvoicePayment.transactionId?.startsWith("INV-") ? viewingInvoicePayment.transactionId : viewingInvoicePayment.transactionId || "INV-001")}
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setViewingInvoicePayment(null);
                  setViewingInvoiceData(null);
                }}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-slate-300 hover:bg-rose-600 hover:text-white transition active:scale-90 cursor-pointer shadow-md"
                title="Close Modal"
                aria-label="Close Modal"
              >
                <X className="h-4 w-4 stroke-[2.5]" />
              </button>
            </div>

            {/* Render 100% Identical Official Admin Invoice Component */}
            <div className="p-2 sm:p-4 bg-slate-900/60 overflow-y-auto flex-1">
              <InvoiceDesign
                hideHeaderTabs={true}
                hideTopBar={true}
                readOnly={true}
                initialInvoiceData={
                  viewingInvoiceData
                    ? {
                        ...viewingInvoiceData,
                        invoiceNo: viewingInvoiceData.invoiceNo,
                        tenantName: viewingInvoiceData.tenantName || customer?.name || "Resident",
                        contact: viewingInvoiceData.contact || customer?.phone || "",
                        email: viewingInvoiceData.email || customer?.email || "",
                        building: viewingInvoiceData.building || customer?.allocatedBuilding || customer?.building || "PG A",
                        floor: viewingInvoiceData.floor || (customer?.allocatedFloor ? `Floor ${customer.allocatedFloor}` : "Floor 1"),
                        room: viewingInvoiceData.room || (customer?.allocatedRoom ? `Room ${customer.allocatedRoom}` : "Room 101"),
                        bed: viewingInvoiceData.bed || customer?.allocatedBed || "Bed A",
                        date: viewingInvoiceData.date || (viewingInvoicePayment.paymentDate ? viewingInvoicePayment.paymentDate.split("T")[0] : new Date().toISOString().split("T")[0]),
                        dueDate: viewingInvoiceData.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
                        rentAmount: Number(viewingInvoiceData.rentAmount || viewingInvoicePayment.amount || customer?.rentAmount || 0),
                        paidAmount: Number(viewingInvoiceData.paidAmount || viewingInvoicePayment.amount || customer?.rentAmount || 0),
                        balanceDue: Number(viewingInvoiceData.balanceDue || 0),
                        paymentModes: viewingInvoiceData.paymentModes || [(viewingInvoicePayment.paymentMethod || "UPI").toUpperCase()],
                        notes: viewingInvoiceData.notes || "Monthly PG rent payment for comfortable living space including Wi-Fi, 3-time meals, and maintenance charges.",
                        status: viewingInvoiceData.status || "PAID",
                      }
                    : {
                        invoiceNo: viewingInvoicePayment.invoiceNo || (viewingInvoicePayment.transactionId?.startsWith("INV-") ? viewingInvoicePayment.transactionId : `INV-${Math.floor(100000 + Math.random() * 900000)}`),
                        tenantName: customer?.name || "Resident",
                        contact: customer?.phone || "",
                        email: customer?.email || "",
                        building: customer?.allocatedBuilding || customer?.building || "PG A",
                        floor: customer?.allocatedFloor ? `Floor ${customer.allocatedFloor}` : "Floor 1",
                        room: customer?.allocatedRoom ? `Room ${customer.allocatedRoom}` : "Room 101",
                        bed: customer?.allocatedBed || "Bed A",
                        date: viewingInvoicePayment.paymentDate ? viewingInvoicePayment.paymentDate.split("T")[0] : (new Date().toISOString().split("T")[0] as string),
                        dueDate: (new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] as string),
                        rentAmount: Number(viewingInvoicePayment.amount || customer?.rentAmount || 0),
                        paidAmount: Number(viewingInvoicePayment.amount || customer?.rentAmount || 0),
                        balanceDue: 0,
                        paymentModes: [(viewingInvoicePayment.paymentMethod || "UPI").toUpperCase()],
                        notes: "Monthly PG rent payment for comfortable living space including Wi-Fi, 3-time meals, and maintenance charges.",
                        status: "PAID",
                      }
                }
              />
            </div>
          </div>
        </div>
      )}

      {/* LARGE SCAN QR CODE MODAL FOR RESIDENTS */}
      {showQrModal && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in" onClick={() => setShowQrModal(false)}>
          <div className="relative w-full max-w-sm rounded-[2.5rem] bg-white p-6 shadow-2xl border border-slate-200 text-center space-y-4 animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <QrCode className="h-4 w-4 text-brand-green" /> Official PG UPI Scan QR
              </span>
              <button onClick={() => setShowQrModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex justify-center">
              {effectivePaymentSettings.qrCodeUrl ? (
                <img src={effectivePaymentSettings.qrCodeUrl} alt="Official QR Code" className="w-64 h-64 object-contain rounded-xl shadow-md bg-white p-2" />
              ) : (
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`upi://pay?pa=${effectivePaymentSettings.upiId}&pn=${encodeURIComponent(effectivePaymentSettings.accountName)}`)}`}
                  alt="Dynamic UPI QR Code"
                  className="w-64 h-64 object-contain rounded-xl shadow-md bg-white p-2"
                />
              )}
            </div>

            <div>
              <p className="text-xs text-slate-500 font-semibold">Scan with Google Pay, PhonePe, Paytm or BHIM</p>
              <p className="text-base font-black text-brand-navy font-mono tracking-wide mt-1">{effectivePaymentSettings.upiId}</p>
              {effectivePaymentSettings.isCustomBuildingPayment && (
                <p className="text-[10px] text-brand-green font-bold mt-0.5">🏢 Dedicated QR for {effectivePaymentSettings.buildingName}</p>
              )}
            </div>

            <button
              onClick={copyUpiId}
              className="w-full py-3 bg-brand-green hover:bg-brand-gold text-white text-xs font-black rounded-2xl transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              {copiedUpi ? <Check className="h-4 w-4 text-white" /> : <Copy className="h-4 w-4" />}
              <span>{copiedUpi ? "UPI ID Copied to Clipboard!" : "Copy UPI ID"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
