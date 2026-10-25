import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ page, pageSize, total, onChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <div className="pagination">
      <span>
        {from.toLocaleString("id-ID")}–{to.toLocaleString("id-ID")} dari{" "}
        {total.toLocaleString("id-ID")} data
      </span>
      <div className="pagination-buttons">
        <button disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Sebelumnya">
          <ChevronLeft size={16} />
        </button>
        <span>
          Halaman {page} / {totalPages.toLocaleString("id-ID")}
        </span>
        <button disabled={page >= totalPages} onClick={() => onChange(page + 1)} aria-label="Berikutnya">
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
