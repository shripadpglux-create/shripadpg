import { API_BASE_URL } from "../lib/apiConfig";
import React, { useState, useEffect } from "react";
import { CustomConfirmModal } from "./CustomConfirmModal";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  User,
  CreditCard,
  FileText,
  Phone,
  Mail,
  MapPin,
  Printer,
  Sparkles,
  Save,
  Clock,
  Search,
  Filter,
  Trash2,
  Edit,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  FileSpreadsheet,
  Eye,
  Download,
  ShieldCheck,
  Plus,
  ArrowLeft,
  RotateCcw,
} from "lucide-react";
import brandLogo from "@/assets/shripad-logo.png";

export interface ResidentOption {
  id: string;
  name: string;
  phone: string;
  email?: string;
  building?: string;
  room?: string;
  bed?: string;
  rentAmount?: number;
}

export interface SavedInvoice {
  id: string;
  invoiceNo: string;
  residentId?: string;
  tenantName: string;
  contact: string;
  email: string;
  building: string;
  floor: string;
  room: string;
  bed: string;
  date: string;
  dueDate: string;
  rentAmount: number;
  paidAmount: number;
  balanceDue: number;
  paymentModes: string[];
  notes: string;
  status: "PAID" | "PARTIAL" | "UNPAID";
  createdAt: string;
  updatedAt: string;
}

export interface PendingPaymentItem {
  bookingId: string;
  paymentId: string;
  residentName: string;
  building: string;
  room: string;
  bed: string;
  amount: number;
  month: number;
  year: number;
  transactionId: string;
  payerName: string;
  paymentDate: string;
  paymentMethod: string;
  submittedAt: string;
  status: string;
}

interface InvoiceDesignProps {
  residentsList?: ResidentOption[];
  initialResident?: ResidentOption | null;
  initialInvoiceData?: Partial<SavedInvoice> | null;
  readOnly?: boolean;
  hideHeaderTabs?: boolean;
  hideTopBar?: boolean;
  onInvoiceSaved?: () => void;
  pendingRequests?: PendingPaymentItem[];
  onVerifyPayment?: (bookingId: string, paymentId: string) => Promise<void>;
  onRejectPayment?: (bookingId: string, paymentId: string) => Promise<void>;
}

export function InvoiceDesign({
  residentsList = [],
  initialResident = null,
  initialInvoiceData = null,
  readOnly = false,
  hideHeaderTabs = false,
  hideTopBar = false,
  onInvoiceSaved,
  pendingRequests = [],
  onVerifyPayment,
  onRejectPayment,
}: InvoiceDesignProps) {
  // Sub tab state: "editor" | "history" | "pending"
  const [activeSubTab, setActiveSubTab] = useState<"editor" | "history" | "pending">(
    pendingRequests.length > 0 ? "pending" : "editor"
  );

  // Track whether we are in active edit/create mode or view-only mode
  const [isEditing, setIsEditing] = useState<boolean>(!initialInvoiceData);

  // Authentication check: Detect if viewer is an admin or customer
  const isAdminOrStaff = React.useMemo(() => {
    if (typeof window === "undefined") return false;
    return !!(
      localStorage.getItem("shripad_admin_session") ||
      localStorage.getItem("shripad_staff_session") ||
      localStorage.getItem("shripad_auth_token") ||
      sessionStorage.getItem("shripad_admin_session") ||
      sessionStorage.getItem("shripad_staff_session") ||
      sessionStorage.getItem("shripad_auth_token") ||
      sessionStorage.getItem("adminAuth") ||
      localStorage.getItem("adminAuth") ||
      sessionStorage.getItem("staffAuth") ||
      localStorage.getItem("staffAuth")
    );
  }, []);

  const isEffectiveReadOnly = readOnly || !isAdminOrStaff || !isEditing;
  const isEffectiveHideTabs = hideHeaderTabs || !isAdminOrStaff;

  // Form State
  const [selectedResidentId, setSelectedResidentId] = useState<string>(initialResident?.id || initialInvoiceData?.residentId || "");
  const [invoiceNo, setInvoiceNo] = useState<string>(initialInvoiceData?.invoiceNo || `INV-${Math.floor(100000 + Math.random() * 900000)}`);
  const [date, setDate] = useState<string>(initialInvoiceData?.date || (new Date().toISOString().split("T")[0] as string));
  const [dueDate, setDueDate] = useState<string>(
    initialInvoiceData?.dueDate || (new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] as string)
  );

  const [tenantName, setTenantName] = useState<string>(initialInvoiceData?.tenantName || initialResident?.name || "");
  const [contact, setContact] = useState<string>(initialInvoiceData?.contact || initialResident?.phone || "");
  const [email, setEmail] = useState<string>(initialInvoiceData?.email || initialResident?.email || "");
  const [building, setBuilding] = useState<string>(initialInvoiceData?.building || initialResident?.building || "PG A - Main Branch");
  const [floor, setFloor] = useState<string>(initialInvoiceData?.floor || "1st Floor");
  const [room, setRoom] = useState<string>(initialInvoiceData?.room || initialResident?.room || "Room 101");
  const [bed, setBed] = useState<string>(initialInvoiceData?.bed || initialResident?.bed || "Bed A");

  const [rentAmount, setRentAmount] = useState<number>(initialInvoiceData?.rentAmount ?? initialResident?.rentAmount ?? 0);
  const [paidAmount, setPaidAmount] = useState<number>(initialInvoiceData?.paidAmount ?? initialResident?.rentAmount ?? 0);
  const [selectedModes, setSelectedModes] = useState<string[]>(initialInvoiceData?.paymentModes || ["UPI"]);
  const [notes, setNotes] = useState<string>(
    initialInvoiceData?.notes || "Monthly PG rent payment for comfortable living space including Wi-Fi, 3-time meals, and maintenance charges."
  );

  // Saving / Notification state
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialInvoiceData) {
      if (initialInvoiceData.invoiceNo) setInvoiceNo(initialInvoiceData.invoiceNo);
      if (initialInvoiceData.date) setDate(initialInvoiceData.date);
      if (initialInvoiceData.dueDate) setDueDate(initialInvoiceData.dueDate);
      if (initialInvoiceData.tenantName) setTenantName(initialInvoiceData.tenantName);
      if (initialInvoiceData.contact) setContact(initialInvoiceData.contact);
      if (initialInvoiceData.email) setEmail(initialInvoiceData.email);
      if (initialInvoiceData.building) setBuilding(initialInvoiceData.building);
      if (initialInvoiceData.floor) setFloor(initialInvoiceData.floor);
      if (initialInvoiceData.room) setRoom(initialInvoiceData.room);
      if (initialInvoiceData.bed) setBed(initialInvoiceData.bed);
      if (initialInvoiceData.rentAmount !== undefined) setRentAmount(initialInvoiceData.rentAmount);
      if (initialInvoiceData.paidAmount !== undefined) setPaidAmount(initialInvoiceData.paidAmount);
      if (initialInvoiceData.paymentModes) setSelectedModes(initialInvoiceData.paymentModes);
      if (initialInvoiceData.notes) setNotes(initialInvoiceData.notes);
    } else if (initialResident) {
      if (initialResident.name) setTenantName(initialResident.name);
      if (initialResident.phone) setContact(initialResident.phone);
      if (initialResident.email) setEmail(initialResident.email);
      if (initialResident.building) setBuilding(initialResident.building);
      if (initialResident.room) setRoom(initialResident.room);
      if (initialResident.bed) setBed(initialResident.bed);
      if (initialResident.rentAmount !== undefined) {
        setRentAmount(initialResident.rentAmount);
        setPaidAmount(initialResident.rentAmount);
      }
    }
  }, [initialInvoiceData, initialResident]);
  const [saveNotification, setSaveNotification] = useState<string | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    const element = document.querySelector(".invoice-sheet") as HTMLElement;
    if (!element) return;
    setIsDownloadingPdf(true);

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: "#ffffff",
        ignoreElements: (node) => node.classList?.contains("no-print"),
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.98);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = 210;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, Math.min(pdfHeight, 297));
      
      const blob = pdf.output("blob");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Shripad_Invoice_${invoiceNo || "INV-001"}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF generation failed:", err);
      setSaveNotification("❌ Failed to generate PDF file. Please try again.");
      setTimeout(() => setSaveNotification(null), 4000);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Saved Invoices History State
  const [invoicesList, setInvoicesList] = useState<SavedInvoice[]>([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PAID" | "PARTIAL" | "UNPAID">("ALL");

  const balanceDue = Math.max(0, rentAmount - paidAmount);

  // Fetch all saved invoices from backend
  const fetchInvoices = async () => {
    setIsLoadingInvoices(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/invoices`);
      const data = await res.json();
      if (data.success && Array.isArray(data.invoices)) {
        setInvoicesList(data.invoices);
      }
    } catch (err) {
      console.error("Failed to fetch invoices history:", err);
    } finally {
      setIsLoadingInvoices(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  // Parse URL query parameter (e.g. /invoice?invoiceNo=INV-123456 or ?txnId=...)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const targetNo = params.get("invoiceNo") || params.get("txnId") || params.get("id");
    if (!targetNo) return;

    setInvoiceNo(targetNo);

    // If invoices already loaded, find match
    const match = invoicesList.find(
      (inv) =>
        inv.invoiceNo?.toLowerCase() === targetNo.toLowerCase() ||
        inv.id === targetNo ||
        inv.residentId === targetNo
    );

    if (match) {
      setTenantName(match.tenantName || "");
      setContact(match.contact || "");
      if (match.email) setEmail(match.email);
      if (match.building) setBuilding(match.building);
      if (match.floor) setFloor(match.floor);
      if (match.room) setRoom(match.room);
      if (match.bed) setBed(match.bed);
      if (match.date) setDate(match.date);
      if (match.dueDate) setDueDate(match.dueDate);
      if (match.rentAmount !== undefined) setRentAmount(match.rentAmount);
      if (match.paidAmount !== undefined) setPaidAmount(match.paidAmount);
      if (match.paymentModes) setSelectedModes(match.paymentModes);
      if (match.notes) setNotes(match.notes);
    } else {
      // Fetch directly by ID or invoiceNo from API
      void fetch(`${API_BASE_URL}/api/invoices`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.invoices)) {
            const apiMatch = data.invoices.find(
              (inv: SavedInvoice) =>
                inv.invoiceNo?.toLowerCase() === targetNo.toLowerCase() ||
                inv.id === targetNo ||
                inv.residentId === targetNo
            );
            if (apiMatch) {
              setTenantName(apiMatch.tenantName || "");
              setContact(apiMatch.contact || "");
              if (apiMatch.email) setEmail(apiMatch.email);
              if (apiMatch.building) setBuilding(apiMatch.building);
              if (apiMatch.floor) setFloor(apiMatch.floor);
              if (apiMatch.room) setRoom(apiMatch.room);
              if (apiMatch.bed) setBed(apiMatch.bed);
              if (apiMatch.date) setDate(apiMatch.date);
              if (apiMatch.dueDate) setDueDate(apiMatch.dueDate);
              if (apiMatch.rentAmount !== undefined) setRentAmount(apiMatch.rentAmount);
              if (apiMatch.paidAmount !== undefined) setPaidAmount(apiMatch.paidAmount);
              if (apiMatch.paymentModes) setSelectedModes(apiMatch.paymentModes);
              if (apiMatch.notes) setNotes(apiMatch.notes);
              return;
            }
          }

          // Fallback: Check resident bookings if invoiceNo is a payment Txn ID
          return fetch(`${API_BASE_URL}/api/bookings`)
            .then((r) => r.json())
            .then((bData) => {
              if (bData.success && Array.isArray(bData.bookings)) {
                const bMatch = bData.bookings.find((b: any) => {
                  if (b.id === targetNo) return true;
                  return (b.paymentHistory || []).some(
                    (p: any) => p.transactionId?.toLowerCase() === targetNo.toLowerCase()
                  );
                });

                if (bMatch) {
                  const payMatch = (bMatch.paymentHistory || []).find(
                    (p: any) => p.transactionId?.toLowerCase() === targetNo.toLowerCase()
                  );
                  setTenantName(bMatch.name || "");
                  setContact(bMatch.phone || "");
                  if (bMatch.email) setEmail(bMatch.email);
                  setBuilding(bMatch.allocatedBuilding || bMatch.building || "PG A");
                  setFloor(bMatch.allocatedFloor !== undefined ? `Floor ${bMatch.allocatedFloor}` : "1st Floor");
                  setRoom(bMatch.allocatedRoom ? `Room ${bMatch.allocatedRoom}` : "Room 101");
                  setBed(bMatch.allocatedBed || "Bed A");
                  const amt = payMatch?.amount || bMatch.rentAmount || 5000;
                  setRentAmount(amt);
                  setPaidAmount(amt);
                  if (payMatch?.paymentDate) setDate(payMatch.paymentDate);
                  if (payMatch?.paymentMethod) setSelectedModes([payMatch.paymentMethod.toUpperCase()]);
                }
              }
            });
        })
        .catch((err) => console.warn("Failed fetching specific invoice or booking:", err));
    }
  }, [invoicesList]);

  // Synchronize resident selection when selected from dropdown
  const handleSelectResident = (resId: string) => {
    setSelectedResidentId(resId);
    if (!resId) return;
    const found = residentsList.find((r) => r.id === resId);
    if (found) {
      setTenantName(found.name || "");
      setContact(found.phone || "");
      if (found.email) setEmail(found.email);
      if (found.building) setBuilding(found.building);
      if (found.room) setRoom(found.room);
      if (found.bed) setBed(found.bed);
      if (found.rentAmount) {
        setRentAmount(found.rentAmount);
        setPaidAmount(found.rentAmount);
      }
    }
  };

  const togglePaymentMode = (mode: string) => {
    setSelectedModes((prev) =>
      prev.includes(mode) ? prev.filter((m) => m !== mode) : [...prev, mode]
    );
  };

  // Save Invoice & Sync Resident Payment Record
  const handleSaveInvoice = async () => {
    if (!tenantName.trim()) {
      setSaveNotification("❌ Please enter resident full name before saving invoice.");
      setTimeout(() => setSaveNotification(null), 4000);
      return;
    }

    setIsSaving(true);
    setSaveNotification(null);

    const payload = {
      invoiceNo,
      residentId: selectedResidentId,
      tenantName: tenantName.trim(),
      contact: contact.trim(),
      email: email.trim(),
      building: building.trim(),
      floor: floor.trim(),
      room: room.trim(),
      bed: bed.trim(),
      date,
      dueDate,
      rentAmount: Number(rentAmount) || 0,
      paidAmount: Number(paidAmount) || 0,
      balanceDue,
      paymentModes: selectedModes,
      notes: notes.trim(),
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/invoices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success && data.invoice) {
        setSaveNotification(`✅ Invoice ${data.invoice.invoiceNo} saved & resident payment history updated!`);
        fetchInvoices();
        onInvoiceSaved?.();
        setTimeout(() => setSaveNotification(null), 5000);
      } else {
        setSaveNotification(`❌ ${data.message || "Failed to save invoice."}`);
        setTimeout(() => setSaveNotification(null), 4000);
      }
    } catch (err) {
      console.error("Failed to save invoice:", err);
      setSaveNotification("❌ Network error: Could not save invoice to backend.");
      setTimeout(() => setSaveNotification(null), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  // Load a saved invoice into the sheet (view-only by default)
  const handleLoadInvoice = (inv: SavedInvoice, editMode = false) => {
    setSelectedResidentId(inv.residentId || "");
    setInvoiceNo(inv.invoiceNo);
    setTenantName(inv.tenantName);
    setContact(inv.contact);
    setEmail(inv.email);
    setBuilding(inv.building);
    setFloor(inv.floor);
    setRoom(inv.room);
    setBed(inv.bed);
    setDate(inv.date);
    setDueDate(inv.dueDate);
    setRentAmount(inv.rentAmount);
    setPaidAmount(inv.paidAmount);
    setSelectedModes(inv.paymentModes || ["UPI"]);
    setNotes(inv.notes);
    setIsEditing(editMode); // Locks into read-only view when viewing!
    setActiveSubTab("editor");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Reset and start creating a fresh new invoice
  const handleStartNewInvoice = () => {
    setSelectedResidentId("");
    setInvoiceNo(`INV-${Math.floor(100000 + Math.random() * 900000)}`);
    setTenantName("");
    setContact("");
    setEmail("");
    setBuilding("PG A - Main Branch");
    setFloor("1st Floor");
    setRoom("Room 101");
    setBed("Bed A");
    setDate(new Date().toISOString().split("T")[0] || "");
    setDueDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] || "");
    setRentAmount(0);
    setPaidAmount(0);
    setSelectedModes(["UPI"]);
    setNotes("Monthly PG rent payment for comfortable living space including Wi-Fi, 3-time meals, and maintenance charges.");
    setIsEditing(true); // Active creation mode
    setActiveSubTab("editor");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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

  // Delete invoice handler
  const handleDeleteInvoice = (invId: string, invNo: string) => {
    setConfirmModalState({
      isOpen: true,
      title: "Delete Invoice Record",
      message: `Are you sure you want to delete invoice record "${invNo}"?`,
      confirmText: "Delete Invoice",
      cancelText: "Cancel",
      type: "danger",
      onConfirm: async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/api/invoices/${invId}`, {
            method: "DELETE",
          });
          const data = await res.json();
          if (data.success) {
            setInvoicesList((prev) => prev.filter((i) => i.id !== invId));
          }
        } catch (err) {
          console.warn("Failed to delete invoice:", err);
          setInvoicesList((prev) => prev.filter((i) => i.id !== invId));
        }
      },
    });
  };

  const modes = ["CASH", "UPI", "BANK TRANSFER", "OTHER"];

  // Scoped Invoices List based on residentsList buildings / residents
  const scopedInvoicesList = React.useMemo(() => {
    if (!residentsList || residentsList.length === 0) {
      return invoicesList;
    }
    const allowedBuildings = new Set(residentsList.map((r) => r.building?.trim().toLowerCase()).filter(Boolean));
    const allowedResidentNames = new Set(residentsList.map((r) => r.name?.trim().toLowerCase()).filter(Boolean));
    const allowedResidentIds = new Set(residentsList.map((r) => r.id).filter(Boolean));

    return invoicesList.filter((inv) => {
      const invBld = (inv.building || "").trim().toLowerCase();
      const invTenant = (inv.tenantName || "").trim().toLowerCase();

      const bldMatch = allowedBuildings.size > 0 && Array.from(allowedBuildings).some((b) => b && (invBld.includes(b) || b.includes(invBld)));
      const tenantMatch = allowedResidentNames.has(invTenant) || (inv.residentId && allowedResidentIds.has(inv.residentId));

      return bldMatch || tenantMatch;
    });
  }, [invoicesList, residentsList]);

  // Filtered Invoices List
  const filteredInvoices = scopedInvoicesList.filter((inv) => {
    const q = (searchQuery || "").toLowerCase();
    const matchesSearch =
      (inv.invoiceNo || "").toLowerCase().includes(q) ||
      (inv.tenantName || "").toLowerCase().includes(q) ||
      (inv.building || "").toLowerCase().includes(q) ||
      (inv.room || "").toLowerCase().includes(q);
    const matchesStatus = statusFilter === "ALL" || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalCollected = scopedInvoicesList.reduce((sum, i) => sum + (Number(i.paidAmount) || 0), 0);
  const totalBalanceDue = scopedInvoicesList.reduce((sum, i) => sum + (Number(i.balanceDue) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Sub-Navigation Header Tabs (Admin / Staff Only) */}
      {!isEffectiveHideTabs && (
        <div className="no-print mx-auto flex w-full max-w-[210mm] items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSubTab("editor")}
              className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-black transition cursor-pointer ${
                activeSubTab === "editor"
                  ? "bg-[#0f1b3d] text-white shadow-md"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <span>Invoice Editor & Generator</span>
            </button>
            <button
              onClick={() => setActiveSubTab("history")}
              className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-black transition cursor-pointer ${
                activeSubTab === "history"
                  ? "bg-[#0f1b3d] text-white shadow-md"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Clock className="h-4 w-4 text-emerald-400" />
              <span>All Invoices & History</span>
              <span className="ml-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700">
                {scopedInvoicesList.length}
              </span>
            </button>
            <button
              onClick={() => setActiveSubTab("pending")}
              className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-black transition cursor-pointer ${
                activeSubTab === "pending"
                  ? "bg-[#0f1b3d] text-white shadow-md"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <AlertCircle className={`h-4 w-4 ${pendingRequests.length > 0 ? "text-amber-400 animate-pulse" : "text-slate-400"}`} />
              <span>Pending Requests</span>
              {pendingRequests.length > 0 && (
                <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-black text-white shadow-xs animate-bounce">
                  {pendingRequests.length}
                </span>
              )}
            </button>
          </div>

          {saveNotification && (
            <div className="hidden sm:flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-300 px-3 py-1.5 text-xs font-extrabold text-emerald-800 animate-fade-in">
              <span>{saveNotification}</span>
            </div>
          )}
        </div>
      )}

      {saveNotification && (
        <div className="no-print sm:hidden mx-auto w-full max-w-[210mm] rounded-xl bg-emerald-50 border border-emerald-300 p-3 text-xs font-extrabold text-emerald-800">
          {saveNotification}
        </div>
      )}

      {/* SUB-TAB 1: INVOICE EDITOR */}
      {activeSubTab === "editor" && (
        <>
          {/* Top Controls Toolbar (Hidden when printing or when hideTopBar is true) */}
          {!hideTopBar && (
            <div className="no-print mx-auto flex w-full max-w-[210mm] flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white/95 p-3.5 sm:p-4 shadow-sm backdrop-blur-xl">
              {isEffectiveReadOnly ? (
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xs sm:text-sm font-black text-slate-900">Official Rent Receipt & Tax Invoice</h2>
                      <span className="rounded-full bg-emerald-100 border border-emerald-300/80 px-2 py-0.5 text-[10px] font-black text-emerald-800 uppercase tracking-wide">
                        Verified
                      </span>
                    </div>
                    <p className="text-[10px] sm:text-xs font-medium text-slate-500">
                      {invoiceNo} • Shripad PG Pune
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-green/10 text-brand-green border border-brand-green/20">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-xs sm:text-sm font-black text-slate-900">Invoice Editor & Generator</h2>
                    <p className="text-[10px] sm:text-xs font-medium text-slate-500">Edit fields and click Save & Issue</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0 flex-wrap sm:flex-nowrap">
                {/* ADMIN IN EDIT MODE: RESIDENT SELECTOR */}
                {!readOnly && isAdminOrStaff && isEditing && residentsList.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-600 shrink-0">Resident:</span>
                    <select
                      value={selectedResidentId}
                      onChange={(e) => handleSelectResident(e.target.value)}
                      className="w-36 sm:w-44 rounded-xl border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-brand-green focus:bg-white focus:outline-none shadow-2xs"
                    >
                      <option value="">-- Manual Input --</option>

                      {residentsList.filter((r) => r.room && r.room !== "Unallocated").length > 0 && (
                        <optgroup label="🏠 Allocated Residents">
                          {residentsList
                            .filter((r) => r.room && r.room !== "Unallocated")
                            .map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.name} — {r.building || "PG A"} ({r.room}{r.bed ? `, ${r.bed}` : ""})
                              </option>
                            ))}
                        </optgroup>
                      )}

                      {residentsList.filter((r) => !r.room || r.room === "Unallocated").length > 0 && (
                        <optgroup label="📋 Pending / Inquiries">
                          {residentsList
                            .filter((r) => !r.room || r.room === "Unallocated")
                            .map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.name} (Pending Allocation)
                              </option>
                            ))}
                        </optgroup>
                      )}
                    </select>
                  </div>
                )}

                {/* ADMIN IN EDIT MODE: SAVE & ISSUE BUTTON */}
                {!readOnly && isAdminOrStaff && isEditing && (
                  <button
                    onClick={handleSaveInvoice}
                    disabled={isSaving}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition active:scale-95 cursor-pointer whitespace-nowrap disabled:opacity-50"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>{isSaving ? "Saving..." : "Save & Issue"}</span>
                  </button>
                )}

                {/* ADMIN IN EDIT MODE: CANCEL EDIT BUTTON */}
                {!readOnly && isAdminOrStaff && isEditing && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition active:scale-95 cursor-pointer whitespace-nowrap"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Cancel</span>
                  </button>
                )}

                {/* ADMIN IN VIEW-ONLY MODE: EDIT BUTTON */}
                {!readOnly && isAdminOrStaff && !isEditing && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition active:scale-95 cursor-pointer whitespace-nowrap"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    <span>Edit Invoice</span>
                  </button>
                )}

                {/* ADMIN IN VIEW-ONLY MODE: NEW INVOICE BUTTON */}
                {!readOnly && isAdminOrStaff && !isEditing && (
                  <button
                    type="button"
                    onClick={handleStartNewInvoice}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition active:scale-95 cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="h-3.5 w-3.5 text-emerald-600" />
                    <span>New</span>
                  </button>
                )}

                {/* PRINT RECEIPT BUTTON */}
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== "undefined") window.print();
                  }}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-[#0f1b3d] hover:bg-slate-800 px-4 py-1.5 text-xs font-bold text-white shadow-sm transition active:scale-95 cursor-pointer whitespace-nowrap"
                >
                  <Printer className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Print Receipt</span>
                </button>
              </div>
            </div>
          )}

          {/* A4 Printable Invoice Sheet */}
          <div className="invoice-sheet mx-auto flex max-w-full flex-col bg-white shadow-2xl rounded-sm border border-slate-200/80 overflow-hidden text-slate-900">
            {/* Decorative Top Banner */}
            <header className="relative h-[120px] shrink-0 overflow-hidden bg-white border-b border-slate-100">
              {/* Angular Polygons */}
              <div className="absolute inset-y-0 left-0 w-[60%] bg-[#0f1b3d] [clip-path:polygon(0_0,100%_0,86%_100%,0_100%)]" />
              <div className="absolute inset-y-0 left-[48%] w-[16%] bg-[#D49A3B] [clip-path:polygon(28%_0,100%_0,72%_100%,0_100%)]" />

              <div className="relative flex h-full items-center justify-between px-8 z-10">
                <div className="flex items-center gap-4">
                  <img
                    src={brandLogo}
                    alt="Shripad PG Logo"
                    className="h-18 sm:h-20 w-auto object-contain filter brightness-0 invert drop-shadow-md"
                  />
                </div>

                <div className="text-right">
                  <h1 className="text-3xl sm:text-[2.4rem] font-black tracking-tight text-[#0f1b3d] leading-none">
                    INVOICE
                  </h1>
                  <p className="text-[10px] sm:text-xs font-black tracking-[0.25em] text-[#D49A3B] uppercase mt-1">
                    RENT RECEIPT
                  </p>
                </div>
              </div>
            </header>

            {/* Invoice Meta Section */}
            <section className="px-8 pt-4">
              <div className="ml-auto w-full sm:w-[58%] space-y-2">
                <div className="flex overflow-hidden rounded-lg border border-slate-300">
                  <div className="flex w-[120px] shrink-0 items-center justify-center bg-[#0f1b3d] px-3 py-1.5 text-xs font-extrabold text-white">
                    INV. NO.
                  </div>
                  <input
                    type="text"
                    value={invoiceNo}
                    disabled={isEffectiveReadOnly}
                    onChange={(e) => setInvoiceNo(e.target.value)}
                    className="inv-input rounded-none font-bold text-slate-900 border-none py-1 disabled:bg-slate-50 disabled:cursor-not-allowed"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-[120px] shrink-0 text-right text-xs font-black text-emerald-800 uppercase tracking-wide">
                    DATE:
                  </span>
                  <input
                    type="date"
                    value={date}
                    disabled={isEffectiveReadOnly}
                    onChange={(e) => setDate(e.target.value)}
                    className="inv-input font-medium text-slate-800 py-1 disabled:bg-slate-50 disabled:cursor-not-allowed"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-[120px] shrink-0 text-right text-xs font-black text-emerald-800 uppercase tracking-wide">
                    DUE DATE:
                  </span>
                  <input
                    type="date"
                    value={dueDate}
                    disabled={isEffectiveReadOnly}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="inv-input font-medium text-slate-800 py-1 disabled:bg-slate-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </section>

            {/* Bill To Section */}
            <section className="px-8 pt-4">
              <div className="flex items-center">
                <div className="flex h-8 w-10 items-center justify-center rounded-t-lg bg-emerald-800 text-white">
                  <User className="h-3.5 w-3.5" />
                </div>
                <div className="flex h-8 items-center rounded-t-lg bg-emerald-800 px-4 text-xs font-extrabold tracking-wider text-white uppercase">
                  BILL TO (TENANT DETAILS)
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5 rounded-xl rounded-tl-none border-2 border-[#0f1b3d] p-4 bg-white">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-[80px] shrink-0 text-xs font-bold text-[#0f1b3d]">Name:</span>
                    <input
                      type="text"
                      value={tenantName}
                      disabled={isEffectiveReadOnly}
                      onChange={(e) => setTenantName(e.target.value)}
                      placeholder="Resident Full Name"
                      className="inv-input font-semibold py-1 disabled:bg-slate-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-[80px] shrink-0 text-xs font-bold text-[#0f1b3d]">Contact:</span>
                    <input
                      type="text"
                      value={contact}
                      disabled={isEffectiveReadOnly}
                      onChange={(e) => setContact(e.target.value)}
                      placeholder="+91 Phone Number"
                      className="inv-input py-1 disabled:bg-slate-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-[80px] shrink-0 text-xs font-bold text-[#0f1b3d]">Email:</span>
                    <input
                      type="email"
                      value={email}
                      disabled={isEffectiveReadOnly}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="resident@gmail.com"
                      className="inv-input py-1 disabled:bg-slate-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-[80px] shrink-0 text-xs font-bold text-[#0f1b3d]">Building:</span>
                    <input
                      type="text"
                      value={building}
                      disabled={isEffectiveReadOnly}
                      onChange={(e) => setBuilding(e.target.value)}
                      placeholder="Building Name"
                      className="inv-input py-1 disabled:bg-slate-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-[80px] shrink-0 text-xs font-bold text-[#0f1b3d]">Floor:</span>
                    <input
                      type="text"
                      value={floor}
                      disabled={isEffectiveReadOnly}
                      onChange={(e) => setFloor(e.target.value)}
                      placeholder="Floor"
                      className="inv-input py-1 disabled:bg-slate-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-[80px] shrink-0 text-xs font-bold text-[#0f1b3d]">Room / Bed:</span>
                    <div className="grid grid-cols-2 gap-2 w-full">
                      <input
                        type="text"
                        value={room}
                        disabled={isEffectiveReadOnly}
                        onChange={(e) => setRoom(e.target.value)}
                        placeholder="Room No"
                        className="inv-input py-1 disabled:bg-slate-50 disabled:cursor-not-allowed"
                      />
                      <input
                        type="text"
                        value={bed}
                        disabled={isEffectiveReadOnly}
                        onChange={(e) => setBed(e.target.value)}
                        placeholder="Bed Tag"
                        className="inv-input py-1 disabled:bg-slate-50 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Payment Details Section */}
            <section className="px-8 pt-4">
              <div className="flex items-center">
                <div className="flex h-8 w-10 items-center justify-center rounded-t-lg bg-emerald-800 text-white">
                  <CreditCard className="h-3.5 w-3.5" />
                </div>
                <div className="flex h-8 items-center rounded-t-lg bg-emerald-800 px-4 text-xs font-extrabold tracking-wider text-white uppercase">
                  PAYMENT DETAILS
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_2fr] gap-3 rounded-xl rounded-tl-none border-2 border-[#0f1b3d] p-3.5 bg-white">
                <div className="overflow-hidden rounded-lg border border-slate-200">
                  <div className="bg-[#0f1b3d] py-1.5 text-center text-xs font-bold text-white uppercase">
                    MONTHLY RENT AMOUNT
                  </div>
                  <div className="flex items-center gap-2 bg-emerald-50/60 p-3">
                    <span className="text-xl font-black text-emerald-800">₹</span>
                    <input
                      type="number"
                      value={rentAmount === 0 ? "" : rentAmount}
                      disabled={isEffectiveReadOnly}
                      onChange={(e) => {
                        const val = e.target.value;
                        setRentAmount(val === "" ? 0 : parseInt(val.replace(/^0+/, "") || "0", 10));
                      }}
                      placeholder="0"
                      className="inv-input text-base font-bold text-slate-900 py-1 disabled:bg-transparent disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
                <div className="overflow-hidden rounded-lg border border-slate-200">
                  <div className="bg-[#0f1b3d] py-1.5 text-center text-xs font-bold text-white uppercase">
                    PAYMENT MODE
                  </div>
                  <div className="flex flex-wrap items-center justify-around gap-3 bg-emerald-50/60 px-4 py-3 h-full">
                    {modes.map((m) => (
                      <label
                        key={m}
                        className={`flex items-center gap-1.5 text-xs font-extrabold text-[#0f1b3d] ${readOnly ? "cursor-not-allowed opacity-90" : "cursor-pointer"}`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedModes.includes(m)}
                          disabled={isEffectiveReadOnly}
                          onChange={() => togglePaymentMode(m)}
                          className="h-3.5 w-3.5 accent-emerald-700 rounded cursor-pointer disabled:cursor-not-allowed"
                        />
                        {m}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Description / Notes Section */}
            <section className="px-8 pt-4">
              <div className="flex items-center">
                <div className="flex h-8 w-10 items-center justify-center rounded-t-lg bg-emerald-800 text-white">
                  <FileText className="h-3.5 w-3.5" />
                </div>
                <div className="flex h-8 items-center rounded-t-lg bg-emerald-800 px-4 text-xs font-extrabold tracking-wider text-white uppercase">
                  DESCRIPTION / NOTES
                </div>
              </div>
              <div className="relative rounded-xl rounded-tl-none border-2 border-[#0f1b3d] p-2.5 bg-white">
                <textarea
                  value={notes}
                  disabled={isEffectiveReadOnly}
                  onChange={(e) => setNotes(e.target.value)}
                  className="inv-input relative h-[65px] resize-none bg-emerald-50/40 text-xs font-medium leading-relaxed py-1 disabled:cursor-not-allowed"
                />
              </div>
            </section>

            {/* Totals Section */}
            <section className="grid grid-cols-1 sm:grid-cols-2 items-end gap-6 px-8 pt-4">
              <div>
                <p className="font-script text-3xl font-bold text-emerald-800">Thank You!</p>
                <p className="mt-1 text-xs font-bold leading-tight text-[#0f1b3d]">
                  For choosing Shripad PG.
                  <br />
                  We truly value your trust and stay with us.
                </p>
              </div>

              <div className="overflow-hidden rounded-xl border-2 border-[#0f1b3d] bg-white">
                <div className="grid grid-cols-2 items-center bg-[#0f1b3d]">
                  <span className="px-3.5 py-1.5 text-xs font-extrabold text-white">TOTAL RENT</span>
                  <div className="flex items-center gap-1 bg-emerald-50 px-3 py-1 border-l border-[#0f1b3d]">
                    <span className="font-bold text-emerald-800">₹</span>
                    <input
                      type="number"
                      value={rentAmount === 0 ? "" : rentAmount}
                      disabled={isEffectiveReadOnly}
                      onChange={(e) => {
                        const val = e.target.value;
                        setRentAmount(val === "" ? 0 : parseInt(val.replace(/^0+/, "") || "0", 10));
                      }}
                      placeholder="0"
                      className="inv-input font-bold text-slate-900 py-0.5 disabled:bg-transparent disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 items-center border-t border-slate-200">
                  <span className="px-3.5 py-1.5 text-xs font-bold text-[#0f1b3d]">PAID AMOUNT</span>
                  <div className="flex items-center gap-1 px-3 py-1 border-l border-slate-200">
                    <span className="text-[#0f1b3d]">₹</span>
                    <input
                      type="number"
                      value={paidAmount === 0 ? "" : paidAmount}
                      disabled={isEffectiveReadOnly}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPaidAmount(val === "" ? 0 : parseInt(val.replace(/^0+/, "") || "0", 10));
                      }}
                      placeholder="0"
                      className="inv-input font-bold text-slate-900 py-0.5 disabled:bg-transparent disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 items-center border-t-2 border-[#0f1b3d] bg-emerald-50/50">
                  <span className="px-3.5 py-1.5 text-xs font-black text-emerald-800">BALANCE DUE</span>
                  <div className="flex items-center gap-1 px-3 py-1.5 border-l border-[#0f1b3d]">
                    <span className="font-black text-emerald-800">₹</span>
                    <span className="text-sm font-black text-emerald-800">{balanceDue.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Footer */}
            <footer className="relative mt-auto h-[95px] shrink-0 pt-4 overflow-hidden">
              <div className="absolute inset-x-0 bottom-0 h-[72px] bg-[#D49A3B] [clip-path:polygon(0_45%,6%_12%,100%_12%,100%_100%,0_100%)]" />
              <div className="absolute inset-x-0 bottom-0 h-[66px] bg-emerald-800 [clip-path:polygon(0_28%,6%_0,100%_0,100%_100%,0_100%)]" />
              <div className="absolute inset-x-0 bottom-0 h-[60px] bg-[#0f1b3d] [clip-path:polygon(0_30%,6%_0,100%_0,100%_100%,0_100%)]" />
              <div className="relative flex h-full items-end justify-center gap-6 pb-3 text-[0.7rem] font-bold text-white z-10">
                <span className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full border border-emerald-400 text-emerald-400">
                    <Phone className="h-2.5 w-2.5" />
                  </span>
                  +91 87675 31345
                </span>
                <span className="h-5 w-px bg-[#D49A3B]" />
                <span className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full border border-emerald-400 text-emerald-400">
                    <Mail className="h-2.5 w-2.5" />
                  </span>
                  shripadpglux@gmail.com
                </span>
                <span className="h-5 w-px bg-[#D49A3B]" />
                <span className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full border border-emerald-400 text-emerald-400">
                    <MapPin className="h-2.5 w-2.5" />
                  </span>
                  <span className="leading-tight">Shripad PG, Pune, MH, India</span>
                </span>
              </div>
            </footer>
          </div>
        </>
      )}

      {/* SUB-TAB 2: ALL INVOICES HISTORY & MANAGEMENT */}
      {activeSubTab === "history" && (
        <div className="no-print mx-auto w-full max-w-6xl space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                  Total Issued Invoices
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-black text-slate-900">{scopedInvoicesList.length}</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">Recorded in system</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                  Total Rent Collected
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-black text-emerald-700">
                ₹{totalCollected.toLocaleString("en-IN")}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-500">Verified received payments</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                  Outstanding Balance
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                  <AlertCircle className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-black text-amber-700">
                ₹{totalBalanceDue.toLocaleString("en-IN")}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-500">Pending tenant dues</p>
            </div>
          </div>

          {/* Search, Filter & Actions Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search invoice #, name, room..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-xs font-semibold text-slate-800 focus:border-brand-green focus:bg-white focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-500" />
                <span className="text-xs font-bold text-slate-600">Status:</span>
                <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
                  {(["ALL", "PAID", "PARTIAL", "UNPAID"] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`rounded-lg px-3 py-1 text-[11px] font-extrabold transition cursor-pointer ${
                        statusFilter === st
                          ? "bg-white text-slate-900 shadow-2xs"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* CREATE NEW INVOICE BUTTON */}
              <button
                type="button"
                onClick={handleStartNewInvoice}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 px-3.5 py-2 text-xs font-black text-white shadow-sm transition active:scale-95 cursor-pointer whitespace-nowrap"
              >
                <Plus className="h-4 w-4" />
                <span>Create Invoice</span>
              </button>
            </div>
          </div>

          {/* Invoices Datatable */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 font-extrabold text-slate-600 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3.5">Invoice #</th>
                    <th className="px-4 py-3.5">Resident</th>
                    <th className="px-4 py-3.5">Building & Room</th>
                    <th className="px-4 py-3.5">Issued Date</th>
                    <th className="px-4 py-3.5">Rent Amount</th>
                    <th className="px-4 py-3.5">Paid</th>
                    <th className="px-4 py-3.5">Balance</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                  {isLoadingInvoices ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-500 font-medium">
                        Loading invoice records...
                      </td>
                    </tr>
                  ) : filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-500 font-medium">
                        No invoice records found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-4 py-3.5 font-bold text-[#0f1b3d]">{inv.invoiceNo}</td>
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-slate-900">{inv.tenantName}</div>
                          <div className="text-[10px] text-slate-500 font-medium">{inv.contact}</div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div>{inv.building}</div>
                          <div className="text-[10px] text-slate-500 font-medium">
                            {inv.room} {inv.bed ? `(${inv.bed})` : ""}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">{inv.date}</td>
                        <td className="px-4 py-3.5 font-bold">₹{Number(inv.rentAmount || 0).toLocaleString("en-IN")}</td>
                        <td className="px-4 py-3.5 font-bold text-emerald-700">₹{Number(inv.paidAmount || 0).toLocaleString("en-IN")}</td>
                        <td className="px-4 py-3.5 font-bold text-amber-700">₹{Number(inv.balanceDue || 0).toLocaleString("en-IN")}</td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${
                              inv.status === "PAID"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                : inv.status === "PARTIAL"
                                ? "bg-amber-100 text-amber-800 border border-amber-300"
                                : "bg-rose-100 text-rose-800 border border-rose-300"
                            }`}
                          >
                            {inv.status === "PAID" && <CheckCircle className="h-3 w-3" />}
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* VIEW (READ-ONLY LOCKED) */}
                            <button
                              onClick={() => handleLoadInvoice(inv, false)}
                              title="View Official Invoice (Read Only)"
                              className="flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[11px] font-black text-emerald-800 hover:bg-emerald-100 transition cursor-pointer"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span>View</span>
                            </button>

                            {/* EDIT (EXPLICIT EDIT MODE) */}
                            <button
                              onClick={() => handleLoadInvoice(inv, true)}
                              title="Edit & Update Invoice"
                              className="flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-1 text-[11px] font-black text-amber-800 hover:bg-amber-100 transition cursor-pointer"
                            >
                              <Edit className="h-3.5 w-3.5" />
                              <span>Edit</span>
                            </button>

                            {/* PRINT / PDF */}
                            <button
                              onClick={() => {
                                handleLoadInvoice(inv, false);
                                setTimeout(() => window.print(), 250);
                              }}
                              title="Print Receipt / Save as PDF"
                              className="flex items-center gap-1.5 rounded-lg bg-[#0f1b3d] px-2.5 py-1 text-[11px] font-black text-white hover:bg-slate-800 transition cursor-pointer"
                            >
                              <Printer className="h-3.5 w-3.5 text-emerald-400" />
                              <span>Print</span>
                            </button>

                            {/* DELETE */}
                            <button
                              onClick={() => handleDeleteInvoice(inv.id, inv.invoiceNo)}
                              title="Delete Record"
                              className="rounded-lg p-1 text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: PENDING PAYMENT REQUESTS */}
      {activeSubTab === "pending" && (
        <div className="no-print mx-auto w-full max-w-4xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-500" />
                Pending Payment Verification Requests
              </h2>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                Review online rent payments submitted by residents awaiting admin approval
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-black self-start sm:self-auto">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
              {pendingRequests.length} Pending Approval
            </span>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-xs">
              <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-base font-black text-slate-900">No Pending Requests</h3>
              <p className="text-xs font-semibold text-slate-500 mt-1 max-w-md mx-auto">
                All submitted resident payment proofs have been verified or rejected. New payment requests from residents will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((req) => {
                const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                const monthName = monthNames[(req.month || 1) - 1] || "Aug";
                return (
                  <div
                    key={`${req.bookingId}-${req.paymentId}`}
                    className="rounded-[2rem] border border-amber-200 bg-gradient-to-br from-amber-50/40 via-white to-white p-6 shadow-sm border-l-4 border-l-amber-500 space-y-4 transition-all hover:shadow-md"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-100">
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl sm:text-3xl font-black text-slate-900">
                            ₹{Number(req.amount || 0).toLocaleString("en-IN")}
                          </span>
                          <span className="text-xs font-black text-slate-500">
                            Month: {monthName} {req.year}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-600 mt-1">
                          Paid by: <span className="font-black text-slate-900">{req.payerName || req.residentName}</span> via{" "}
                          <span className="uppercase font-black text-emerald-700">{req.paymentMethod}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-100/90 border border-amber-300 text-amber-900 text-xs font-extrabold shadow-2xs">
                          <Clock className="h-3.5 w-3.5 text-amber-600" />
                          Pending Verification
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold text-slate-700">
                      <div className="p-3 rounded-xl bg-white border border-slate-200">
                        <span className="text-[10px] text-slate-400 uppercase font-black block">Transaction Reference ID</span>
                        <span className="font-mono text-sm font-black text-slate-900">{req.transactionId}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-white border border-slate-200">
                        <span className="text-[10px] text-slate-400 uppercase font-black block">Resident Location & Room</span>
                        <span className="text-slate-900 font-black">
                          {req.building} • Room {req.room} ({req.bed})
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons matching screenshot design */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                      <button
                        type="button"
                        onClick={async () => {
                          if (onVerifyPayment) {
                            await onVerifyPayment(req.bookingId, req.paymentId);
                            if (onInvoiceSaved) onInvoiceSaved();
                          }
                        }}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black shadow-md shadow-emerald-700/20 transition-all active:scale-95 cursor-pointer"
                      >
                        <CheckCircle className="h-4 w-4 text-emerald-300" />
                        <span>Verify & Raise Invoice</span>
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          if (onRejectPayment) {
                            await onRejectPayment(req.bookingId, req.paymentId);
                            if (onInvoiceSaved) onInvoiceSaved();
                          }
                        }}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-rose-100 hover:bg-rose-200 text-rose-700 text-xs font-black transition-all active:scale-95 cursor-pointer"
                      >
                        <span>Reject Request</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
