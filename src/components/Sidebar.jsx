import React from "react";
import {
  Database, LayoutDashboard, FileText, PhoneCall, Package,
  ClipboardCheck, Search, CheckCircle, X,
} from "lucide-react";

export const MENU = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "search", label: "Cari Data", icon: Search },
  { section: "Dokumen Form" },
  { id: "form-op", label: "Form OP", icon: FileText },
  { id: "form-tele", label: "Form TELE", icon: PhoneCall },
  { id: "form-bulky", label: "Form Bulky", icon: Package },
  { id: "form-tanda-terima", label: "Tanda Terima", icon: ClipboardCheck },
];

export default function Sidebar({ active, onSelect, open, onClose, assetCount, employeeCount }) {
  return (
    <>
      <div className={`sidebar-overlay ${open ? "show" : ""}`} onClick={onClose} />
      <aside className={`sidebar no-print ${open ? "open" : ""}`}>
        <div className="sidebar-brand">
          <Database size={24} /> Project Dimas
          <button className="mobile-close" onClick={onClose} aria-label="Tutup menu">
            <X size={20} />
          </button>
        </div>
        <nav className="sidebar-nav">
          {MENU.map((item, i) =>
            item.section ? (
              <div className="nav-divider" key={i}>{item.section}</div>
            ) : (
              <button
                key={item.id}
                className={`nav-item ${active === item.id ? "active" : ""}`}
                onClick={() => onSelect(item.id)}>
                <item.icon size={18} /> {item.label}
              </button>
            ),
          )}
        </nav>
        <div className="db-status-box">
          <p className="db-status-title">Status Data:</p>
          <div className="db-status-item">
            <CheckCircle size={14} color={assetCount ? "#10b981" : "#9ca3af"} />
            Aset ({assetCount.toLocaleString("id-ID")})
          </div>
          <div className="db-status-item">
            <CheckCircle size={14} color={employeeCount ? "#10b981" : "#9ca3af"} />
            Karyawan ({employeeCount.toLocaleString("id-ID")})
          </div>
        </div>
      </aside>
    </>
  );
}
