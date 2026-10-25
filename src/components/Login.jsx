import React from "react";
import { LogIn } from "lucide-react";
import { LOGO_PATH } from "../hooks/useLogo";

export default function Login({ onLogin }) {
  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <img src={LOGO_PATH} alt="Logo DIKA" style={{ height: 56, marginBottom: 8 }} />
          <h2>Project Dimas</h2>
          <p>Sistem Manajemen Aset &amp; Karyawan</p>
        </div>
        <button className="btn-primary" onClick={onLogin}>
          <LogIn size={18} /> Masuk Sistem
        </button>
      </div>
    </div>
  );
}
