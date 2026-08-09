import React, { useState } from "react";
import Papa from "papaparse";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Search,
  Upload,
  LogIn,
  LayoutDashboard,
  Database,
  Users,
  CheckCircle,
} from "lucide-react";
import "./App.css";

// Palet warna profesional untuk Donut Chart
const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#14b8a6",
  "#f97316",
  "#06b6d4",
  "#6366f1",
  "#ec4899",
];

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [activeTab, setActiveTab] = useState("dashboard");

  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const [searchNikQuery, setSearchNikQuery] = useState("");
  const [employeeResult, setEmployeeResult] = useState(null);
  const [hasSearchedNik, setHasSearchedNik] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === "admin" && password === "dimas123") {
      setIsLoggedIn(true);
    } else {
      alert("Username atau password salah!");
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    files.forEach((file) => {
      Papa.parse(file, {
        header: true,
        delimiter: ";",
        skipEmptyLines: true,
        complete: (results) => {
          if (!results.data || results.data.length === 0) return;
          const sampleRow = results.data[0];

          if ("Kode Aset" in sampleRow) {
            setAssets(results.data);
            alert(
              `[Sukses] Berhasil memuat ${results.data.length} data Aset dari file: ${file.name}`,
            );
          } else if (
            "NIK" in sampleRow ||
            "Name" in sampleRow ||
            "Number_Id" in sampleRow
          ) {
            setEmployees(results.data);
            alert(
              `[Sukses] Berhasil memuat ${results.data.length} data Karyawan dari file: ${file.name}`,
            );
          } else {
            alert(
              `Format file "${file.name}" tidak dikenali sebagai db_aset maupun db_employee.`,
            );
          }
        },
        error: (error) => {
          alert(`Gagal membaca file ${file.name}: ` + error.message);
        },
      });
    });
    e.target.value = "";
  };

  const handleSearchAsset = (e) => {
    e.preventDefault();
    setHasSearched(true);
    const result = assets.find(
      (asset) =>
        asset["Kode Aset"]?.trim().toLowerCase() ===
        searchQuery.trim().toLowerCase(),
    );
    setSearchResult(result || null);
  };

  const handleSearchEmployee = (e) => {
    e.preventDefault();
    setHasSearchedNik(true);
    const result = employees.find(
      (emp) =>
        emp["NIK"]?.trim().toLowerCase() ===
        searchNikQuery.trim().toLowerCase(),
    );
    setEmployeeResult(result || null);
  };

  const getChartData = () => {
    const categoryCount = {};
    assets.forEach((asset) => {
      const category = asset["Kategori Aset"] || "Lainnya";
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });

    return Object.keys(categoryCount)
      .map((key) => ({
        name: key,
        value: categoryCount[key],
      }))
      .sort((a, b) => b.value - a.value);
  };

  const formatVal = (val) => (val && String(val).trim() !== "" ? val : "-");

  if (!isLoggedIn) {
    return (
      <div className="login-container">
        <div className="login-box">
          <div className="login-header">
            <Database size={40} color="#2563eb" />
            <h2>Sistem Manajemen Aset & Employee</h2>
            <p>Silakan login ke akun Anda</p>
          </div>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-primary">
              <LogIn size={18} /> Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Database size={24} />
          <h2>Diams Project</h2>
        </div>
        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveTab("dashboard")}>
            <LayoutDashboard size={18} /> Dashboard
          </button>
          <button
            className={`nav-item ${activeTab === "employee" ? "active" : ""}`}
            onClick={() => setActiveTab("employee")}>
            <Users size={18} /> Employee
          </button>
        </nav>

        <div className="db-status-box">
          <p className="db-status-title">Status Database:</p>
          <div className="db-status-item">
            <CheckCircle
              size={14}
              color={assets.length > 0 ? "#10b981" : "#9ca3af"}
            />
            <span>db_aset ({assets.length} data)</span>
          </div>
          <div className="db-status-item">
            <CheckCircle
              size={14}
              color={employees.length > 0 ? "#10b981" : "#9ca3af"}
            />
            <span>db_employee ({employees.length} data)</span>
          </div>
        </div>
        <div className="sidebar-footer">
          <button className="btn-logout" onClick={() => setIsLoggedIn(false)}>
            Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <h1>
            {activeTab === "dashboard"
              ? "Dashboard Aset"
              : "Manajemen Employee"}
          </h1>
          <div className="upload-section">
            <label htmlFor="csv-upload" className="btn-upload">
              <Upload size={18} /> Import File CSV (Aset / Employee)
            </label>
            <input
              id="csv-upload"
              type="file"
              accept=".csv"
              multiple
              onChange={handleFileUpload}
            />
          </div>
        </header>

        {activeTab === "dashboard" ? (
          <>
            <div className="content-grid">
              <div className="card search-card">
                <h3>Cari Data Aset</h3>
                <form onSubmit={handleSearchAsset} className="search-form">
                  <input
                    type="text"
                    placeholder="Masukkan Kode Aset (ex: C1.01.000141)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button type="submit" className="btn-search">
                    <Search size={18} /> Cari
                  </button>
                </form>

                {hasSearched && (
                  <div className="search-result">
                    {searchResult ? (
                      <table className="result-table">
                        <tbody>
                          <tr>
                            <th>Kode Aset</th>
                            <td>{formatVal(searchResult["Kode Aset"])}</td>
                          </tr>
                          <tr>
                            <th>Spesifikasi</th>
                            <td>{formatVal(searchResult["Spesifikasi"])}</td>
                          </tr>
                          <tr>
                            <th>Serial Number</th>
                            <td>{formatVal(searchResult["Serial Number"])}</td>
                          </tr>
                          <tr>
                            <th>Harga Pembelian</th>
                            <td>
                              {formatVal(searchResult["Harga Pembelian"])}
                            </td>
                          </tr>
                          <tr>
                            <th>Tanggal Pembelian</th>
                            <td>
                              {formatVal(searchResult["Tanggal Pembelian"])}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    ) : (
                      <div className="not-found">
                        Data aset dengan kode <b>{searchQuery}</b> tidak
                        ditemukan.
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="card chart-card">
                <h3>Distribusi Kategori Aset</h3>
                {assets.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                      <Pie
                        data={getChartData()}
                        cx="40%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={2}
                        dataKey="value"
                        labelLine={false}
                        label={false}>
                        {getChartData().map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name) => [`${value} Item`, name]}
                        contentStyle={{
                          borderRadius: "8px",
                          border: "none",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        }}
                      />
                      <Legend
                        layout="vertical"
                        verticalAlign="middle"
                        align="right"
                        wrapperStyle={{
                          fontSize: "13px",
                          lineHeight: "24px",
                          maxHeight: "250px",
                          overflowY: "auto",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="empty-state">
                    Silakan import file <b>db_aset.csv</b> terlebih dahulu.
                  </p>
                )}
              </div>
            </div>

            <div className="card table-card">
              <h3>10 Data Aset Teratas</h3>
              {assets.length > 0 ? (
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Kode Aset</th>
                        <th>Spesifikasi</th>
                        <th>Kategori</th>
                        <th>Harga Pembelian</th>
                        <th>Tanggal Pembelian</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assets.slice(0, 10).map((asset, index) => (
                        <tr key={index}>
                          <td>{formatVal(asset["Kode Aset"])}</td>
                          <td>{formatVal(asset["Spesifikasi"])}</td>
                          <td>{formatVal(asset["Kategori Aset"])}</td>
                          <td>{formatVal(asset["Harga Pembelian"])}</td>
                          <td>{formatVal(asset["Tanggal Pembelian"])}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="empty-state">Data aset belum dimuat.</p>
              )}
            </div>
          </>
        ) : (
          <div className="card search-card">
            <h3>Cari Data Employee berdasarkan NIK</h3>
            <form onSubmit={handleSearchEmployee} className="search-form">
              <input
                type="text"
                placeholder="Masukkan NIK Karyawan (ex: D7256356)..."
                value={searchNikQuery}
                onChange={(e) => setSearchNikQuery(e.target.value)}
              />
              <button type="submit" className="btn-search">
                <Search size={18} /> Cari
              </button>
            </form>

            {hasSearchedNik && (
              <div className="search-result">
                {employeeResult ? (
                  <table className="result-table">
                    <tbody>
                      <tr>
                        <th>NIK</th>
                        <td>{formatVal(employeeResult["NIK"])}</td>
                      </tr>
                      <tr>
                        <th>NAMA KARYAWAN</th>
                        <td>{formatVal(employeeResult["Name"])}</td>
                      </tr>
                      <tr>
                        <th>UNIT</th>
                        <td>{formatVal(employeeResult["Departement"])}</td>
                      </tr>
                      <tr>
                        <th>BRANCH</th>
                        <td>{formatVal(employeeResult["Branch"])}</td>
                      </tr>
                      <tr>
                        <th>UPLINER</th>
                        <td>{formatVal(employeeResult["Upliner_Code"])}</td>
                      </tr>
                      <tr>
                        <th>TANGGAL MASUK</th>
                        <td>{formatVal(employeeResult["Join_Date"])}</td>
                      </tr>
                      <tr>
                        <th>TANGGAL KELUAR</th>
                        <td>
                          {formatVal(
                            employeeResult["Resign_Date"] ||
                              employeeResult["Termination_Date"],
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                ) : (
                  <div className="not-found">
                    {employees.length === 0
                      ? "Silakan import file db_employee.csv terlebih dahulu."
                      : `Data employee dengan NIK "${searchNikQuery}" tidak ditemukan.`}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
