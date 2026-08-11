import React, { useState } from 'react';
import { Search, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import './Table.css';

export function Table({
  columns,
  data = [],
  searchable = true,
  searchPlaceholder = "Cari data...",
  searchKey = "nama",
  filterOptions = null,
  filterKey = "status",
  pageSize = 5
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterValue, setFilterValue] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  // Filtering
  const filteredData = data.filter((item) => {
    const searchValue = item[searchKey] ? String(item[searchKey]).toLowerCase() : '';
    const matchesSearch = searchValue.includes(searchTerm.toLowerCase());

    const itemFilterVal = item[filterKey] ? String(item[filterKey]) : '';
    const matchesFilter = filterValue === 'ALL' || itemFilterVal === filterValue;

    return matchesSearch && matchesFilter;
  });

  // Pagination
  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const currentData = filteredData.slice(startIndex, startIndex + pageSize);

  return (
    <div className="table-wrapper">
      {/* Table Toolbar */}
      {(searchable || filterOptions) && (
        <div className="table-toolbar">
          {searchable && (
            <div className="table-search">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          )}

          {filterOptions && (
            <div className="table-filter">
              <Filter size={16} className="filter-icon" />
              <select
                value={filterValue}
                onChange={(e) => {
                  setFilterValue(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="ALL">Semua Status</option>
                {filterOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Main Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} style={{ width: col.width }}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentData.length > 0 ? (
              currentData.map((row, rowIdx) => (
                <tr key={row.id || rowIdx}>
                  {columns.map((col, colIdx) => (
                    <td key={colIdx}>
                      {col.cell ? col.cell(row) : row[col.accessorKey]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="table-empty">
                  Tidak ada data yang ditemukan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="table-pagination">
          <span className="pagination-info">
            Menampilkan {startIndex + 1}-{Math.min(startIndex + pageSize, filteredData.length)} dari {filteredData.length} data
          </span>

          <div className="pagination-controls">
            <button
              className="pagination-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            >
              <ChevronLeft size={16} />
            </button>
            <span className="pagination-page">
              {currentPage} / {totalPages}
            </span>
            <button
              className="pagination-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
