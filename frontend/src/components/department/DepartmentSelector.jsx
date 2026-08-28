import React, { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { getDepartments } from "../../api/endpoints";
import { DepartmentsList } from "../../utils/constants";
import { Building2, ChevronDown, Check } from "lucide-react";

const DEPT_ICONS = {
  "Roads & Infrastructure":   "🛣️",
  "Water & Sewage Board":      "💧",
  "Solid Waste Management":    "♻️",
  "Street Lighting & Electrical": "💡",
  "Stormwater & Drainage":     "🌧️",
  "Traffic Management & Signals": "🚦",
  "Parks & Urban Forestry":    "🌳",
};

export function DepartmentSelector({ onSelect, currentDepartment }) {
  const [departments, setDepartments] = useState(DepartmentsList);
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef(null);
  const [dropdownStyle, setDropdownStyle] = useState({});

  useEffect(() => {
    async function loadDepts() {
      try {
        const res = await getDepartments();
        const list = Array.isArray(res) ? res : (res?.departments ?? []);
        if (list.length > 0) {
          setDepartments(list);
        } else {
          setDepartments(DepartmentsList);
        }
      } catch (e) {
        setDepartments(DepartmentsList);
      }
    }
    loadDepts();
  }, []);

  // Calculate dropdown position relative to the button on open
  const handleOpen = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownStyle({
        top: rect.bottom + window.scrollY + 6,
        left: rect.left + window.scrollX,
        minWidth: Math.max(rect.width, 280),
      });
    }
    setIsOpen((prev) => !prev);
  }, []);

  // Reposition on scroll/resize while open
  useEffect(() => {
    if (!isOpen) return;
    const reposition = () => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setDropdownStyle({
          top: rect.bottom + window.scrollY + 6,
          left: rect.left + window.scrollX,
          minWidth: Math.max(rect.width, 280),
        });
      }
    };
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [isOpen]);

  const dropdown = isOpen
    ? createPortal(
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[9998]"
            onClick={() => setIsOpen(false)}
          />
          {/* Dropdown panel — rendered at body level, never clipped */}
          <div
            style={{
              position: "absolute",
              top: dropdownStyle.top,
              left: dropdownStyle.left,
              minWidth: dropdownStyle.minWidth,
              zIndex: 9999,
            }}
            className="bg-white border border-slate-200 rounded-2xl shadow-2xl py-2 overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-2 border-b border-slate-100 mb-1">
              <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">
                Municipal Bureau Divisions
              </p>
            </div>

            {/* Department items */}
            <div className="max-h-72 overflow-y-auto">
              {departments.map((dept) => {
                const name = dept.name || dept.id || dept;
                const isSelected =
                  name === currentDepartment || dept.id === currentDepartment;
                const icon = DEPT_ICONS[name] || "🏛️";
                return (
                  <button
                    key={dept.id || name}
                    onClick={() => {
                      onSelect(name);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-all duration-150 group ${
                      isSelected
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <span className="text-base flex-shrink-0">{icon}</span>
                    <span className="flex-1 text-xs font-semibold truncate">
                      {name}
                    </span>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>,
        document.body
      )
    : null;

  return (
    <>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 hidden sm:inline-block">
          Active Department:
        </span>
        <button
          ref={buttonRef}
          type="button"
          onClick={handleOpen}
          className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-mono text-xs uppercase tracking-wider transition duration-200 shadow-md cursor-pointer"
        >
          <Building2 className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
          <span className="truncate max-w-[180px]">{currentDepartment}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 flex-shrink-0 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {dropdown}
    </>
  );
}
