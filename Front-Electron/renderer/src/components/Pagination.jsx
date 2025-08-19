import React from 'react';
import nextIcon from '../assets/icons/next.png';
import './Pagination.css';

function Pagination({ currentPage, totalPages, onPageChange, from, to, total, label = 'usuarios' }) {
  return (
    <div className="pagination-container">
      <div className="pagination-info">
        Mostrando {from}-{to} de {total} {label}
      </div>
      <div className="pagination-controls">
        <button
          className="pagination-arrow"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Página anterior"
          style={{ transform: 'rotate(180deg)' }}
        >
          <img src={nextIcon} alt="Anterior" style={{ width: 16, height: 16 }} />
        </button>
        <span className="pagination-current">{currentPage}</span>
        <button
          className="pagination-arrow"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Página siguiente"
        >
          <img src={nextIcon} alt="Siguiente" style={{ width: 16, height: 16 }} />
        </button>
      </div>
    </div>
  );
}
export default Pagination;