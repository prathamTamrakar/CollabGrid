import React from 'react';

export const DetailsModal = ({ isOpen, onClose, title, data, columns }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 border border-slate-100">
        <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition p-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="overflow-x-auto max-h-[60vh]">
          <table className="min-w-full text-xs text-left">
            <thead>
              <tr className="text-slate-400 font-semibold border-b border-slate-100">
                {columns.map((col, index) => (
                  <th key={index} className="px-3 py-2">{col.header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data && data.length > 0 ? (
                data.map((item, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-slate-50/60 transition">
                    {columns.map((col, colIndex) => (
                      <td key={colIndex} className="px-3 py-2.5 text-slate-800">
                        {col.accessor(item)}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="text-center py-6 text-slate-400">
                    No data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DetailsModal;
