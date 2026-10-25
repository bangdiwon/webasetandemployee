import React, { useState } from "react";
import { Upload, Menu } from "lucide-react";
import "./App.css";

import useDatabase from "./hooks/useDatabase";
import useLogo from "./hooks/useLogo";

import Login from "./components/Login";
import Sidebar, { MENU } from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import CariData from "./components/CariData";
import FormOP from "./components/forms/FormOP";
import FormTele from "./components/forms/FormTele";
import FormBulky from "./components/forms/FormBulky";
import FormTandaTerima from "./components/forms/FormTandaTerima";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);

  const db = useDatabase();
  const logo = useLogo();

  if (!isLoggedIn) return <Login onLogin={() => setIsLoggedIn(true)} />;

  const formProps = {
    getAset: db.getAset,
    getKaryawan: db.getKaryawan,
    employeeIndex: db.employeeIndex,
    logo,
  };

  // Daftar halaman: tambah menu baru cukup di MENU (Sidebar) + satu baris di sini.
  const pages = {
    dashboard: <Dashboard assets={db.assets} employees={db.employees} />,
    search: (
      <CariData assets={db.assets} employees={db.employees} employeeIndex={db.employeeIndex} />
    ),
    "form-op": <FormOP {...formProps} />,
    "form-tele": <FormTele {...formProps} />,
    "form-bulky": <FormBulky {...formProps} />,
    "form-tanda-terima": <FormTandaTerima {...formProps} />,
  };

  const judul = MENU.find((m) => m.id === activeTab)?.label || "Portal Aset";

  return (
    <div className="dashboard-layout">
      <Sidebar
        active={activeTab}
        onSelect={(id) => {
          setActiveTab(id);
          setMenuOpen(false);
        }}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        assetCount={db.assets.length}
        employeeCount={db.employees.length}
      />

      <main className="main-content">
        <header className="topbar no-print">
          <div className="topbar-title">
            <button className="mobile-menu-btn" onClick={() => setMenuOpen(true)} aria-label="Buka menu">
              <Menu size={22} />
            </button>
            <h1>{judul}</h1>
          </div>
          <label className="btn-upload">
            <Upload size={18} /> Import CSV
            <input
              type="file"
              accept=".csv"
              multiple
              onChange={(e) => {
                db.importFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
        </header>

        <div className="content-area">{pages[activeTab]}</div>
      </main>
    </div>
  );
}
