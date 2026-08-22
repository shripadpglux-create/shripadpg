import type ExcelJS from "exceljs";
import { isBuildingMatch } from "../features/admin/AdminDashboard";

async function createWorkbook(): Promise<ExcelJS.Workbook> {
  const { default: ExcelJS } = await import("exceljs");
  return new ExcelJS.Workbook();
}

export interface BookingReportData {
  id: string;
  timestamp: string;
  name: string;
  email: string;
  phone: string;
  building: string;
  roomType: string;
  source: "manual" | "online";
  status: "pending" | "allocated";
  guardianPhone?: string;
  allocatedBuilding?: string;
  allocatedFloor?: number;
  allocatedRoom?: string;
  allocatedBed?: string;
  documents?: string;
  paymentHistory?: Array<{
    id: string;
    month: number;
    year: number;
    amount: number;
    transactionId: string;
    payerName: string;
    paymentDate: string;
    paymentMethod: string;
    status: string;
    autoVerified?: boolean;
    bankSmsText?: string;
  }>;
}

export interface BuildingReportData {
  name: string;
  floors: number;
  roomsPerFloor: number;
  floorRoomCounts?: Record<number, number>;
  blockedRooms?: string[];
}

/**
 * Helper to download an Excel workbook buffer in browser
 */
async function downloadWorkbook(workbook: ExcelJS.Workbook, fileName: string) {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
}

/**
 * Common formatting function to apply Centered Header Banner, KPI Cards, and Table Styles
 */
function applyWorkbookTheme(
  worksheet: ExcelJS.Worksheet,
  title: string,
  totalCols: number,
  kpiCards: Array<{ label: string; value: string | number; colorHex: string }>
) {
  const lastColLetter = String.fromCharCode(64 + totalCols);

  // 1. Centered Main Header Banner (Row 1)
  worksheet.mergeCells(`A1:${lastColLetter}1`);
  const titleCell = worksheet.getCell("A1");
  titleCell.value = "SHRIPAD PG";
  titleCell.font = { name: "Segoe UI", size: 20, bold: true, color: { argb: "FFFFFFFF" } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF064E3B" }, // Emerald Dark Green
  };
  worksheet.getRow(1).height = 42;

  // 2. Centered Subtitle Row (Row 2)
  worksheet.mergeCells(`A2:${lastColLetter}2`);
  const subTitleCell = worksheet.getCell("A2");
  subTitleCell.value = title.toUpperCase();
  subTitleCell.font = { name: "Segoe UI", size: 12, bold: true, color: { argb: "FFFFFFFF" } };
  subTitleCell.alignment = { horizontal: "center", vertical: "middle" };
  subTitleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF047857" }, // Medium Emerald
  };
  worksheet.getRow(2).height = 26;

  // 3. Metadata Info Row (Row 3)
  worksheet.mergeCells(`A3:${lastColLetter}3`);
  const metaCell = worksheet.getCell("A3");
  const nowStr = new Date().toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  metaCell.value = `Report Generated: ${nowStr}  |  Facility: Shripad PG Stays  |  System: Official Management Portal`;
  metaCell.font = { name: "Segoe UI", size: 9.5, italic: true, color: { argb: "FF334155" } };
  metaCell.alignment = { horizontal: "center", vertical: "middle" };
  metaCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFECFDF5" }, // Mint Light Tint
  };
  worksheet.getRow(3).height = 22;

  // Row 4: Empty space
  worksheet.getRow(4).height = 10;

  // 4. KPI Highlights Summary Block (Row 5 & Row 6)
  if (kpiCards.length > 0) {
    const colsPerCard = Math.max(1, Math.floor(totalCols / kpiCards.length));
    kpiCards.forEach((kpi, idx) => {
      const startColIndex = idx * colsPerCard + 1;
      const endColIndex = idx === kpiCards.length - 1 ? totalCols : (idx + 1) * colsPerCard;

      const startColLetter = String.fromCharCode(64 + startColIndex);
      const endColLetter = String.fromCharCode(64 + endColIndex);

      // Label Row (Row 5)
      worksheet.mergeCells(`${startColLetter}5:${endColLetter}5`);
      const kpiLabelCell = worksheet.getCell(`${startColLetter}5`);
      kpiLabelCell.value = kpi.label.toUpperCase();
      kpiLabelCell.font = { name: "Segoe UI", size: 9, bold: true, color: { argb: "FF475569" } };
      kpiLabelCell.alignment = { horizontal: "center", vertical: "middle" };
      kpiLabelCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: kpi.colorHex },
      };

      // Value Row (Row 6)
      worksheet.mergeCells(`${startColLetter}6:${endColLetter}6`);
      const kpiValueCell = worksheet.getCell(`${startColLetter}6`);
      kpiValueCell.value = kpi.value;
      kpiValueCell.font = { name: "Segoe UI", size: 14, bold: true, color: { argb: "FF0F172A" } };
      kpiValueCell.alignment = { horizontal: "center", vertical: "middle" };
      kpiValueCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: kpi.colorHex },
      };

      // Add box border around KPI card
      for (let r = 5; r <= 6; r++) {
        for (let c = startColIndex; c <= endColIndex; c++) {
          const cell = worksheet.getCell(r, c);
          cell.border = {
            top: { style: "thin", color: { argb: "FFCBD5E1" } },
            left: { style: "thin", color: { argb: "FFCBD5E1" } },
            bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
            right: { style: "thin", color: { argb: "FFCBD5E1" } },
          };
        }
      }
    });
    worksheet.getRow(5).height = 18;
    worksheet.getRow(6).height = 24;
  }

  // Row 7: Empty space
  worksheet.getRow(7).height = 12;
}

/**
 * Auto-fit column widths based on maximum content length
 */
function autoFitColumns(worksheet: ExcelJS.Worksheet, minWidth = 18) {
  worksheet.columns.forEach((column) => {
    let maxLen = minWidth;
    if (column.values) {
      column.values.forEach((val, rowIdx) => {
        if (rowIdx > 3 && val) {
          // Skip header banner rows (1, 2, 3) for column width calculation
          const str = String(val);
          if (str.length > maxLen) {
            maxLen = str.length;
          }
        }
      });
    }
    column.width = Math.min(Math.max(maxLen + 8, minWidth), 55);
  });
}

/**
 * Apply table header styles
 */
function styleTableHeader(worksheet: ExcelJS.Worksheet, headerRowIndex: number, totalCols: number) {
  const row = worksheet.getRow(headerRowIndex);
  row.height = 28;
  for (let c = 1; c <= totalCols; c++) {
    const cell = row.getCell(c);
    cell.font = { name: "Segoe UI", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF15803D" }, // Dark Emerald Green
    };
    cell.border = {
      top: { style: "medium", color: { argb: "FF064E3B" } },
      bottom: { style: "medium", color: { argb: "FF064E3B" } },
      left: { style: "thin", color: { argb: "FF86EFAC" } },
      right: { style: "thin", color: { argb: "FF86EFAC" } },
    };
  }
}

/**
 * Style data rows with zebra striping and custom status badge colors
 */
function styleDataRows(
  worksheet: ExcelJS.Worksheet,
  startRow: number,
  endRow: number,
  totalCols: number,
  statusColIdx?: number
) {
  for (let r = startRow; r <= endRow; r++) {
    const row = worksheet.getRow(r);
    row.height = 22;
    const isEven = r % 2 === 0;

    for (let c = 1; c <= totalCols; c++) {
      const cell = row.getCell(c);
      cell.font = { name: "Segoe UI", size: 10, color: { argb: "FF1E293B" } };
      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      };

      // Default background zebra striping
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: isEven ? "FFF8FAFC" : "FFFFFFFF" },
      };

      // Mandatory Center Alignment for ALL cells in all reports
      cell.alignment = { horizontal: "center", vertical: "middle" };
      const cellValStr = String(cell.value || "").trim();

      // Status Badge Custom Highlighting
      if (statusColIdx && c === statusColIdx) {
        const valLower = cellValStr.toLowerCase();
        if (
          valLower.includes("allocated") ||
          valLower.includes("verified") ||
          valLower.includes("success") ||
          valLower.includes("active")
        ) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFDCFCE7" }, // Soft Green
          };
          cell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FF15803D" } };
          cell.alignment = { horizontal: "center", vertical: "middle" };
        } else if (valLower.includes("pending") || valLower.includes("submitted")) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFEF3C7" }, // Soft Amber
          };
          cell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFB45309" } };
          cell.alignment = { horizontal: "center", vertical: "middle" };
        } else if (valLower.includes("manual") || valLower.includes("online")) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFDBEAFE" }, // Soft Blue
          };
          cell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FF1E40AF" } };
          cell.alignment = { horizontal: "center", vertical: "middle" };
        }
      }
    }
  }
}

// ============================================================================
// 1. CONTACT REPORT GENERATOR
// ============================================================================
export async function generateContactReport(bookings: BookingReportData[]) {
  const workbook = await createWorkbook();
  workbook.creator = "Shripad PG Portal";
  const worksheet = workbook.addWorksheet("Contact Directory");

  const totalCols = 10;
  const kpiCards = [
    { label: "Total Resident Contacts", value: bookings.length, colorHex: "FFDBEAFE" },
    {
      label: "Allocated Residents",
      value: bookings.filter((b) => b.status === "allocated").length,
      colorHex: "FFDCFCE7",
    },
    {
      label: "Pending Admissions",
      value: bookings.filter((b) => b.status === "pending").length,
      colorHex: "FFFEF3C7",
    },
    {
      label: "Emergency Phone Recorded",
      value: bookings.filter((b) => !!b.guardianPhone).length,
      colorHex: "FFFEE2E2",
    },
  ];

  applyWorkbookTheme(worksheet, "Resident & Applicant Contact Directory Report", totalCols, kpiCards);

  // Table Headers (Row 8)
  const headerRowIdx = 8;
  const headers = [
    "S.No.",
    "Resident Name",
    "Primary Phone",
    "Email Address",
    "Emergency / Guardian Phone",
    "PG Building",
    "Room & Bed Assigned",
    "Booking Source",
    "Admission Status",
    "Registration Date",
  ];

  const headerRow = worksheet.getRow(headerRowIdx);
  headers.forEach((h, idx) => {
    headerRow.getCell(idx + 1).value = h;
  });
  styleTableHeader(worksheet, headerRowIdx, totalCols);

  // Data Rows
  let startRow = 9;
  bookings.forEach((b, idx) => {
    const row = worksheet.getRow(startRow + idx);
    row.getCell(1).value = idx + 1;
    row.getCell(2).value = b.name;
    row.getCell(3).value = b.phone || "N/A";
    row.getCell(4).value = b.email || "N/A";
    row.getCell(5).value = b.guardianPhone || "Not Provided";
    row.getCell(6).value = b.allocatedBuilding || b.building || "Unassigned";
    row.getCell(7).value =
      b.status === "allocated"
        ? `Room ${b.allocatedRoom || "-"}, Bed ${b.allocatedBed || "-"}`
        : "Pending Allocation";
    row.getCell(8).value = b.source === "online" ? "Online Form" : "Manual Admission";
    row.getCell(9).value = b.status === "allocated" ? "Allocated Resident" : "Pending Admission";
    row.getCell(10).value = b.timestamp || "N/A";
  });

  const endRow = startRow + bookings.length - 1;
  if (bookings.length > 0) {
    styleDataRows(worksheet, startRow, endRow, totalCols, 9);
  }

  autoFitColumns(worksheet);
  await downloadWorkbook(workbook, `Shripad_PG_Contact_Report_${Date.now()}.xlsx`);
}

// ============================================================================
// 2. ALLOCATION REPORT GENERATOR
// ============================================================================
export async function generateAllocationReport(
  bookings: BookingReportData[],
  buildings: BuildingReportData[]
) {
  const workbook = await createWorkbook();
  workbook.creator = "Shripad PG Portal";
  const worksheet = workbook.addWorksheet("Room & Bed Allocations");

  const allocatedBookings = bookings.filter((b) => b.status === "allocated");
  const pendingBookings = bookings.filter((b) => b.status === "pending");

  const totalCols = 10;
  const kpiCards = [
    { label: "Total Booking Requests", value: bookings.length, colorHex: "FFDBEAFE" },
    { label: "Active Allocations", value: allocatedBookings.length, colorHex: "FFDCFCE7" },
    { label: "Pending Allocation Queue", value: pendingBookings.length, colorHex: "FFFEF3C7" },
    { label: "PG Buildings Active", value: buildings.length, colorHex: "FFF3E8FF" },
  ];

  applyWorkbookTheme(worksheet, "Room & Bed Seat Allocation Matrix Report", totalCols, kpiCards);

  const headerRowIdx = 8;
  const headers = [
    "S.No.",
    "Resident Name",
    "Phone Number",
    "PG Building",
    "Floor No.",
    "Room No.",
    "Sharing / Room Type",
    "Bed / Seat No.",
    "Allocation Status",
    "Admission Timestamp",
  ];

  const headerRow = worksheet.getRow(headerRowIdx);
  headers.forEach((h, idx) => {
    headerRow.getCell(idx + 1).value = h;
  });
  styleTableHeader(worksheet, headerRowIdx, totalCols);

  let startRow = 9;
  bookings.forEach((b, idx) => {
    const row = worksheet.getRow(startRow + idx);
    row.getCell(1).value = idx + 1;
    row.getCell(2).value = b.name;
    row.getCell(3).value = b.phone || "N/A";
    row.getCell(4).value = b.allocatedBuilding || b.building || "Unassigned";
    row.getCell(5).value = b.allocatedFloor !== undefined ? `Floor ${b.allocatedFloor}` : "-";
    row.getCell(6).value = b.allocatedRoom ? `Room ${b.allocatedRoom}` : "-";
    row.getCell(7).value = b.roomType || "Standard Sharing";
    row.getCell(8).value = b.allocatedBed ? `Bed ${b.allocatedBed}` : "Unallocated";
    row.getCell(9).value = b.status === "allocated" ? "Allocated" : "Pending";
    row.getCell(10).value = b.timestamp || "N/A";
  });

  const endRow = startRow + bookings.length - 1;
  if (bookings.length > 0) {
    styleDataRows(worksheet, startRow, endRow, totalCols, 9);
  }

  autoFitColumns(worksheet);
  await downloadWorkbook(workbook, `Shripad_PG_Allocation_Report_${Date.now()}.xlsx`);
}

function getBuildingCapacityAndRooms(bld: BuildingReportData): { totalRooms: number; totalCapacity: number } {
  const gfExcluded = Boolean(bld.floorRoomCounts && bld.floorRoomCounts[0] === 0);
  const maxFl = gfExcluded ? bld.floors : Math.max(0, bld.floors - 1);
  let totalRooms = 0;
  let totalCapacity = 0;

  let customSharing: Record<string, number> = {};
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem("shripad_custom_room_sharing");
      if (saved) customSharing = JSON.parse(saved);
    } catch {
      // ignore
    }
  }

  for (let f = 0; f <= maxFl; f++) {
    const rCount = bld.floorRoomCounts && bld.floorRoomCounts[f] !== undefined ? bld.floorRoomCounts[f]! : bld.roomsPerFloor;
    totalRooms += rCount;
    for (let r = 1; r <= rCount; r++) {
      const rNo = f === 0 ? `G${r.toString().padStart(2, "0")}` : `${f}${r.toString().padStart(2, "0")}`;
      const cleanNo = rNo.replace(/^Room\s+/i, "");
      const cap =
        (bld as any).roomBeds?.[rNo] ??
        (bld as any).roomBeds?.[cleanNo] ??
        customSharing[`${bld.name}_${rNo}`] ??
        customSharing[`${bld.name}_${cleanNo}`] ??
        2;
      totalCapacity += Number(cap);
    }
  }

  return { totalRooms, totalCapacity: totalCapacity || totalRooms * 2 };
}

// ============================================================================
// 3. BUILDING REPORT GENERATOR
// ============================================================================
export async function generateBuildingReport(
  buildings: BuildingReportData[],
  bookings: BookingReportData[]
) {
  const workbook = await createWorkbook();
  workbook.creator = "Shripad PG Portal";
  const worksheet = workbook.addWorksheet("Building Occupancy Summary");

  // Helper to compute room/bed stats per building
  const buildingStats = buildings.map((bld) => {
    const { totalRooms, totalCapacity } = getBuildingCapacityAndRooms(bld);

    // Occupied count
    const occupiedCount = bookings.filter(
      (b) =>
        b.status === "allocated" &&
        isBuildingMatch(b.allocatedBuilding || b.building, bld.name, buildings.length)
    ).length;

    const vacantBeds = Math.max(0, totalCapacity - occupiedCount);
    const occupancyRate = totalCapacity > 0 ? ((occupiedCount / totalCapacity) * 100).toFixed(1) : "0.0";
    const monthlyRevenueEst = occupiedCount * 8500; // Average ₹8,500 per seat

    return {
      name: bld.name,
      floors: bld.floors,
      totalRooms,
      totalCapacity,
      occupiedCount,
      vacantBeds,
      occupancyRate: `${occupancyRate}%`,
      monthlyRevenueEst,
    };
  });

  const totalBeds = buildingStats.reduce((sum, b) => sum + b.totalCapacity, 0);
  const totalOccupied = buildingStats.reduce((sum, b) => sum + b.occupiedCount, 0);
  const totalVacant = buildingStats.reduce((sum, b) => sum + b.vacantBeds, 0);
  const overallRate = totalBeds > 0 ? ((totalOccupied / totalBeds) * 100).toFixed(1) + "%" : "0.0%";

  const totalCols = 9;
  const kpiCards = [
    { label: "Total PG Buildings", value: buildings.length, colorHex: "FFDBEAFE" },
    { label: "Total Bed Capacity", value: `${totalBeds} Beds`, colorHex: "FFF3E8FF" },
    { label: "Occupied Beds", value: `${totalOccupied} Beds`, colorHex: "FFDCFCE7" },
    { label: "Overall Occupancy Rate", value: overallRate, colorHex: "FFFEF3C7" },
  ];

  applyWorkbookTheme(worksheet, "Building Infrastructure & Occupancy Statistics Report", totalCols, kpiCards);

  const headerRowIdx = 8;
  const headers = [
    "S.No.",
    "PG Building Name",
    "Total Floors",
    "Total Rooms",
    "Total Capacity (Beds)",
    "Occupied Beds",
    "Vacant / Available Beds",
    "Occupancy Rate",
    "Est. Monthly Revenue (₹)",
  ];

  const headerRow = worksheet.getRow(headerRowIdx);
  headers.forEach((h, idx) => {
    headerRow.getCell(idx + 1).value = h;
  });
  styleTableHeader(worksheet, headerRowIdx, totalCols);

  let startRow = 9;
  buildingStats.forEach((st, idx) => {
    const row = worksheet.getRow(startRow + idx);
    row.getCell(1).value = idx + 1;
    row.getCell(2).value = st.name;
    row.getCell(3).value = st.floors;
    row.getCell(4).value = st.totalRooms;
    row.getCell(5).value = st.totalCapacity;
    row.getCell(6).value = st.occupiedCount;
    row.getCell(7).value = st.vacantBeds;
    row.getCell(8).value = st.occupancyRate;
    const revCell = row.getCell(9);
    revCell.value = st.monthlyRevenueEst;
    revCell.numFmt = "₹#,##0.00";
  });

  const endRow = startRow + buildingStats.length - 1;
  styleDataRows(worksheet, startRow, endRow, totalCols);

  // Summary Totals Row at bottom
  const totalRowIdx = endRow + 1;
  const totalRow = worksheet.getRow(totalRowIdx);
  totalRow.height = 26;
  totalRow.getCell(1).value = "TOTALS";
  totalRow.getCell(2).value = "ALL BUILDINGS";
  totalRow.getCell(5).value = totalBeds;
  totalRow.getCell(6).value = totalOccupied;
  totalRow.getCell(7).value = totalVacant;
  totalRow.getCell(8).value = overallRate;
  const grandRevCell = totalRow.getCell(9);
  grandRevCell.value = buildingStats.reduce((sum, b) => sum + b.monthlyRevenueEst, 0);
  grandRevCell.numFmt = "₹#,##0.00";

  for (let c = 1; c <= totalCols; c++) {
    const cell = totalRow.getCell(c);
    cell.font = { name: "Segoe UI", size: 11, bold: true, color: { argb: "FF0F172A" } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFECFDF5" },
    };
    cell.border = {
      top: { style: "thin", color: { argb: "FF059669" } },
      bottom: { style: "double", color: { argb: "FF059669" } },
    };
  }

  autoFitColumns(worksheet);
  await downloadWorkbook(workbook, `Shripad_PG_Building_Report_${Date.now()}.xlsx`);
}

// ============================================================================
// 4. REVENUE REPORT GENERATOR
// ============================================================================
export async function generateRevenueReport(bookings: BookingReportData[]) {
  const workbook = await createWorkbook();
  workbook.creator = "Shripad PG Portal";
  const worksheet = workbook.addWorksheet("Revenue Transactions");

  // Extract flattened payment records across all residents
  const paymentList: Array<{
    sno: number;
    txnId: string;
    residentName: string;
    phone: string;
    building: string;
    roomBed: string;
    period: string;
    amount: number;
    method: string;
    status: string;
    autoVerifiedStr: string;
    dateStr: string;
  }> = [];

  let grandTotal = 0;
  let verifiedTotal = 0;
  let autoMatchedCount = 0;

  bookings.forEach((b) => {
    if (b.paymentHistory && b.paymentHistory.length > 0) {
      b.paymentHistory.forEach((p) => {
        grandTotal += p.amount || 0;
        if (p.status === "verified") {
          verifiedTotal += p.amount || 0;
        }
        if (p.autoVerified) {
          autoMatchedCount++;
        }

        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const periodStr = `${monthNames[(p.month || 1) - 1]} ${p.year || 2026}`;

        paymentList.push({
          sno: paymentList.length + 1,
          txnId: p.transactionId || p.id || "N/A",
          residentName: p.payerName || b.name,
          phone: b.phone || "N/A",
          building: b.allocatedBuilding || b.building || "N/A",
          roomBed: b.allocatedRoom ? `R-${b.allocatedRoom} / B-${b.allocatedBed || "-"}` : "Pending",
          period: periodStr,
          amount: p.amount || 0,
          method: (p.paymentMethod || "upi").toUpperCase(),
          status: p.status === "verified" ? "Verified" : p.status === "rejected" ? "Rejected" : "Submitted",
          autoVerifiedStr: p.autoVerified ? "Bank SMS Matched (100%)" : "Manual",
          dateStr: (p.paymentDate ? p.paymentDate.split("T")[0] : (b.timestamp ? b.timestamp.split(" ")[0] : "")) || "",
        });
      });
    }
  });

  const totalCols = 11;
  const kpiCards = [
    { label: "Total Revenue Recorded", value: `₹${grandTotal.toLocaleString("en-IN")}`, colorHex: "FFDCFCE7" },
    { label: "Verified Revenue", value: `₹${verifiedTotal.toLocaleString("en-IN")}`, colorHex: "FFDBEAFE" },
    { label: "Total Payment Transactions", value: paymentList.length, colorHex: "FFF3E8FF" },
    { label: "Bank SMS Auto-Matches", value: autoMatchedCount, colorHex: "FFFEF3C7" },
  ];

  applyWorkbookTheme(worksheet, "Financial Audit & Revenue Payment Audit Report", totalCols, kpiCards);

  const headerRowIdx = 8;
  const headers = [
    "S.No.",
    "Transaction ID",
    "Payer / Resident Name",
    "Contact Phone",
    "PG Building",
    "Room / Bed",
    "Payment Period",
    "Amount (₹)",
    "Payment Mode",
    "Verification Status",
    "Bank SMS Verification",
  ];

  const headerRow = worksheet.getRow(headerRowIdx);
  headers.forEach((h, idx) => {
    headerRow.getCell(idx + 1).value = h;
  });
  styleTableHeader(worksheet, headerRowIdx, totalCols);

  let startRow = 9;
  paymentList.forEach((p, idx) => {
    const row = worksheet.getRow(startRow + idx);
    row.getCell(1).value = p.sno;
    row.getCell(2).value = p.txnId;
    row.getCell(3).value = p.residentName;
    row.getCell(4).value = p.phone;
    row.getCell(5).value = p.building;
    row.getCell(6).value = p.roomBed;
    row.getCell(7).value = p.period;
    const amtCell = row.getCell(8);
    amtCell.value = p.amount;
    amtCell.numFmt = "₹#,##0.00";
    row.getCell(9).value = p.method;
    row.getCell(10).value = p.status;
    row.getCell(11).value = p.autoVerifiedStr;
  });

  const endRow = startRow + paymentList.length - 1;
  if (paymentList.length > 0) {
    styleDataRows(worksheet, startRow, endRow, totalCols, 10);
  }

  // Summary Totals Row at bottom
  const totalRowIdx = endRow + 1;
  const totalRow = worksheet.getRow(totalRowIdx);
  totalRow.height = 26;
  totalRow.getCell(1).value = "TOTALS";
  totalRow.getCell(2).value = `${paymentList.length} Transactions`;
  const grandAmtCell = totalRow.getCell(8);
  grandAmtCell.value = grandTotal;
  grandAmtCell.numFmt = "₹#,##0.00";

  for (let c = 1; c <= totalCols; c++) {
    const cell = totalRow.getCell(c);
    cell.font = { name: "Segoe UI", size: 11, bold: true, color: { argb: "FF0F172A" } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFECFDF5" },
    };
    cell.border = {
      top: { style: "thin", color: { argb: "FF059669" } },
      bottom: { style: "double", color: { argb: "FF059669" } },
    };
  }

  autoFitColumns(worksheet);
  await downloadWorkbook(workbook, `Shripad_PG_Revenue_Report_${Date.now()}.xlsx`);
}

// ============================================================================
// 5. MASTER COMBINED REPORT GENERATOR (Multi-Sheet Workbook)
// ============================================================================
export async function generateMasterReport(
  bookings: BookingReportData[],
  buildings: BuildingReportData[]
) {
  const workbook = await createWorkbook();
  workbook.creator = "Shripad PG Portal";

  // --- SHEET 1: REVENUE ---
  const wsRev = workbook.addWorksheet("1. Revenue Audit");
  let grandTotal = 0;
  const paymentList: any[] = [];
  bookings.forEach((b) => {
    if (b.paymentHistory && b.paymentHistory.length > 0) {
      b.paymentHistory.forEach((p) => {
        grandTotal += p.amount || 0;
        paymentList.push({
          txnId: p.transactionId || p.id,
          name: p.payerName || b.name,
          phone: b.phone,
          building: b.allocatedBuilding || b.building,
          amount: p.amount || 0,
          method: (p.paymentMethod || "upi").toUpperCase(),
          status: p.status === "verified" ? "Verified" : "Submitted",
          date: p.paymentDate ? p.paymentDate.split("T")[0] : b.timestamp.split(" ")[0],
        });
      });
    }
  });

  applyWorkbookTheme(wsRev, "Executive Financial & Revenue Audit Master Sheet", 8, [
    { label: "Total Revenue Recorded", value: `₹${grandTotal.toLocaleString("en-IN")}`, colorHex: "FFDCFCE7" },
    { label: "Total Payment Records", value: paymentList.length, colorHex: "FFDBEAFE" },
  ]);

  const revHeaders = ["S.No.", "Txn ID", "Resident Name", "Phone", "Building", "Amount (₹)", "Payment Method", "Status"];
  const revHRow = wsRev.getRow(8);
  revHeaders.forEach((h, i) => (revHRow.getCell(i + 1).value = h));
  styleTableHeader(wsRev, 8, 8);

  paymentList.forEach((p, idx) => {
    const row = wsRev.getRow(9 + idx);
    row.getCell(1).value = idx + 1;
    row.getCell(2).value = p.txnId;
    row.getCell(3).value = p.name;
    row.getCell(4).value = p.phone;
    row.getCell(5).value = p.building;
    const aCell = row.getCell(6);
    aCell.value = p.amount;
    aCell.numFmt = "₹#,##0.00";
    row.getCell(7).value = p.method;
    row.getCell(8).value = p.status;
  });
  if (paymentList.length > 0) styleDataRows(wsRev, 9, 8 + paymentList.length, 8, 8);
  autoFitColumns(wsRev);

  // --- SHEET 2: ALLOCATIONS ---
  const wsAlloc = workbook.addWorksheet("2. Bed Allocations");
  applyWorkbookTheme(wsAlloc, "Room & Bed Allocation Master Directory", 8, [
    { label: "Total Residents", value: bookings.length, colorHex: "FFDBEAFE" },
    { label: "Allocated Seats", value: bookings.filter((b) => b.status === "allocated").length, colorHex: "FFDCFCE7" },
  ]);
  const allocHeaders = ["S.No.", "Resident Name", "Phone", "Building", "Floor", "Room", "Bed / Seat", "Status"];
  const allocHRow = wsAlloc.getRow(8);
  allocHeaders.forEach((h, i) => (allocHRow.getCell(i + 1).value = h));
  styleTableHeader(wsAlloc, 8, 8);

  bookings.forEach((b, idx) => {
    const row = wsAlloc.getRow(9 + idx);
    row.getCell(1).value = idx + 1;
    row.getCell(2).value = b.name;
    row.getCell(3).value = b.phone;
    row.getCell(4).value = b.allocatedBuilding || b.building;
    row.getCell(5).value = b.allocatedFloor !== undefined ? `Floor ${b.allocatedFloor}` : "-";
    row.getCell(6).value = b.allocatedRoom ? `Room ${b.allocatedRoom}` : "-";
    row.getCell(7).value = b.allocatedBed ? `Bed ${b.allocatedBed}` : "Pending";
    row.getCell(8).value = b.status === "allocated" ? "Allocated" : "Pending";
  });
  if (bookings.length > 0) styleDataRows(wsAlloc, 9, 8 + bookings.length, 8, 8);
  autoFitColumns(wsAlloc);

  // --- SHEET 3: BUILDINGS ---
  const wsBld = workbook.addWorksheet("3. Buildings Summary");
  applyWorkbookTheme(wsBld, "Building Infrastructure & Capacity Report", 7, [
    { label: "Active PG Buildings", value: buildings.length, colorHex: "FFF3E8FF" },
  ]);
  const bldHeaders = ["S.No.", "Building Name", "Floors", "Total Rooms", "Total Capacity", "Occupied Beds", "Available Beds"];
  const bldHRow = wsBld.getRow(8);
  bldHeaders.forEach((h, i) => (bldHRow.getCell(i + 1).value = h));
  styleTableHeader(wsBld, 8, 7);

  buildings.forEach((b, idx) => {
    const { totalRooms, totalCapacity: cap } = getBuildingCapacityAndRooms(b);
    const occ = bookings.filter(
      (bk) =>
        bk.status === "allocated" &&
        isBuildingMatch(bk.allocatedBuilding || bk.building, b.name, buildings.length)
    ).length;

    const row = wsBld.getRow(9 + idx);
    row.getCell(1).value = idx + 1;
    row.getCell(2).value = b.name;
    row.getCell(3).value = b.floors;
    row.getCell(4).value = totalRooms;
    row.getCell(5).value = cap;
    row.getCell(6).value = occ;
    row.getCell(7).value = Math.max(0, cap - occ);
  });
  if (buildings.length > 0) styleDataRows(wsBld, 9, 8 + buildings.length, 7);
  autoFitColumns(wsBld);

  // --- SHEET 4: CONTACTS ---
  const wsCont = workbook.addWorksheet("4. Contacts List");
  applyWorkbookTheme(wsCont, "Tenant & Emergency Contacts Directory", 7, [
    { label: "Total Contacts", value: bookings.length, colorHex: "FFDBEAFE" },
  ]);
  const contHeaders = ["S.No.", "Name", "Phone", "Email", "Emergency / Guardian Phone", "Building", "Status"];
  const contHRow = wsCont.getRow(8);
  contHeaders.forEach((h, i) => (contHRow.getCell(i + 1).value = h));
  styleTableHeader(wsCont, 8, 7);

  bookings.forEach((b, idx) => {
    const row = wsCont.getRow(9 + idx);
    row.getCell(1).value = idx + 1;
    row.getCell(2).value = b.name;
    row.getCell(3).value = b.phone || "N/A";
    row.getCell(4).value = b.email || "N/A";
    row.getCell(5).value = b.guardianPhone || "Not Provided";
    row.getCell(6).value = b.allocatedBuilding || b.building;
    row.getCell(7).value = b.status === "allocated" ? "Allocated Resident" : "Pending Admission";
  });
  if (bookings.length > 0) styleDataRows(wsCont, 9, 8 + bookings.length, 7, 7);
  autoFitColumns(wsCont);

  await downloadWorkbook(workbook, `Shripad_PG_Master_All_In_One_Report_${Date.now()}.xlsx`);
}

// ============================================================================
// 6. DEDICATED DUES & OUTSTANDING BALANCE REPORT GENERATOR (.xlsx)
// ============================================================================
export interface DueReportItem {
  name: string;
  phone: string;
  email?: string;
  building: string;
  floor: string | number;
  room: string;
  bed: string;
  rentAmount: number;
  paidRentAmount: number;
  rentDue: number;
  depositAmount: number;
  paidDepositAmount: number;
  depositDue: number;
  totalDue: number;
  depositStatus?: string;
  dueCategory?: string;
  daysOverdue: number;
  isOverdue: boolean;
  lastPaymentDate?: string;
}

export async function generateDuesReport(
  duesList: DueReportItem[],
  summary?: {
    totalDuesAmount: number;
    totalRentDues: number;
    totalDepositDues: number;
    residentsWithDues: number;
    overdueCount: number;
  }
) {
  const workbook = await createWorkbook();
  const ws = workbook.addWorksheet("Outstanding Dues");

  const totalDues = summary?.totalDuesAmount ?? duesList.reduce((s, d) => s + (d.totalDue || 0), 0);
  const totalRentDues = summary?.totalRentDues ?? duesList.reduce((s, d) => s + (d.rentDue || 0), 0);
  const totalDepositDues = summary?.totalDepositDues ?? duesList.reduce((s, d) => s + (d.depositDue || 0), 0);
  const overdueCount = summary?.overdueCount ?? duesList.filter((d) => d.isOverdue).length;

  applyWorkbookTheme(ws, "Resident Dues & Outstanding Balance Audit Report", 16, [
    { label: "Total Outstanding Dues", value: `₹${totalDues.toLocaleString("en-IN")}`, colorHex: "FFFEE2E2" },
    { label: "Total Rent Dues", value: `₹${totalRentDues.toLocaleString("en-IN")}`, colorHex: "FFFEF3C7" },
    { label: "Total Deposit Dues", value: `₹${totalDepositDues.toLocaleString("en-IN")}`, colorHex: "FFEDE9FE" },
    { label: "Overdue Residents", value: `${overdueCount} Tenants`, colorHex: "FFFFEDD5" },
  ]);

  const headers = [
    "S.No.",
    "Resident Name",
    "Phone Number",
    "Building",
    "Floor",
    "Room",
    "Bed",
    "Monthly Rent (₹)",
    "Paid Rent (₹)",
    "Rent Due (₹)",
    "Deposit Total (₹)",
    "Deposit Paid (₹)",
    "Deposit Due (₹)",
    "Total Due Balance (₹)",
    "Overdue Status",
    "Days Overdue",
    "Last Payment Date",
  ];

  const headerRow = ws.getRow(8);
  headers.forEach((h, i) => (headerRow.getCell(i + 1).value = h));
  styleTableHeader(ws, 8, 17);

  duesList.forEach((d, idx) => {
    const row = ws.getRow(9 + idx);
    row.getCell(1).value = idx + 1;
    row.getCell(2).value = d.name;
    row.getCell(3).value = d.phone || "N/A";
    row.getCell(4).value = d.building;
    row.getCell(5).value = d.floor !== undefined ? `Floor ${d.floor}` : "-";
    row.getCell(6).value = d.room || "-";
    row.getCell(7).value = d.bed || "-";

    const cRent = row.getCell(8);
    cRent.value = d.rentAmount || 0;
    cRent.numFmt = "₹#,##0";

    const cPaidRent = row.getCell(9);
    cPaidRent.value = d.paidRentAmount || 0;
    cPaidRent.numFmt = "₹#,##0";

    const cRentDue = row.getCell(10);
    cRentDue.value = d.rentDue || 0;
    cRentDue.numFmt = "₹#,##0";

    const cDep = row.getCell(11);
    cDep.value = d.depositAmount || 0;
    cDep.numFmt = "₹#,##0";

    const cPaidDep = row.getCell(12);
    cPaidDep.value = d.paidDepositAmount || 0;
    cPaidDep.numFmt = "₹#,##0";

    const cDepDue = row.getCell(13);
    cDepDue.value = d.depositDue || 0;
    cDepDue.numFmt = "₹#,##0";

    const cTotDue = row.getCell(14);
    cTotDue.value = d.totalDue || 0;
    cTotDue.numFmt = "₹#,##0";

    row.getCell(15).value = d.totalDue === 0 ? "Fully Paid" : d.isOverdue ? "Overdue" : "Pending";
    row.getCell(16).value = d.daysOverdue > 0 ? `${d.daysOverdue} Days` : "On Time";
    row.getCell(17).value = d.lastPaymentDate ? d.lastPaymentDate.split("T")[0] : "No Payments Yet";
  });

  if (duesList.length > 0) {
    styleDataRows(ws, 9, 8 + duesList.length, 17, 17);
  }

  autoFitColumns(ws);
  await downloadWorkbook(workbook, `Shripad_PG_Outstanding_Dues_Report_${Date.now()}.xlsx`);
}

