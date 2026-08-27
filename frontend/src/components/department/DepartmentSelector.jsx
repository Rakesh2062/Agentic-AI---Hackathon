import React, { useEffect, useState } from "react";
import { getDepartments } from "../../api/endpoints";
import { Building2, ChevronDown, Check } from "lucide-react";

export function DepartmentSelector({ onSelect, currentDepartment }) {
  const [departments, setDepartments] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    async function loadDepts() {
      try {
        const list = await getDepartments();
        setDepartments(list);
      } catch (e) {
        // Fallback
      }
    }
    loadDepts();
  }, []);

  return (
    <div className="relative inline-block text-left">
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider hidden sm:inline-block">
          Active Department:
        </span>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-sky-500 text-slate-100 font-bold text-sm shadow-md transition"
        >
          <Building2 className="w-4 h-4 text-sky-400" />
          <span>{currentDepartment}</span>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 mt-2 w-64 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl z-30 py-1.5 animate-slide-up">
            <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              City Municipal Departments
            </div>
            {departments.map((dept) => {
              const isSelected = dept.name === currentDepartment || dept.id === currentDepartment;
              return (
                <button
                  key={dept.id || dept.name}
                  onClick={() => {
                    onSelect(dept.name || dept.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 text-xs sm:text-sm font-medium flex items-center justify-between transition ${
                    isSelected
                      ? "bg-sky-600/20 text-sky-300 font-bold"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <span className="truncate">{dept.name}</span>
                  {isSelected && <Check className="w-4 h-4 text-sky-400" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
