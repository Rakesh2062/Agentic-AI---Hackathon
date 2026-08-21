import React, { useState, useRef, useEffect, useMemo } from "react";
import { WORLD_COUNTRIES } from "../../utils/countries";
import { Globe2, Search, ChevronDown, Check, X } from "lucide-react";

export function CountrySelect({ value, onChange, placeholder = "Select your country", required = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close dropdown when clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto focus search input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchQuery("");
    }
  }, [isOpen]);

  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) return WORLD_COUNTRIES;
    const q = searchQuery.toLowerCase().trim();
    return WORLD_COUNTRIES.filter((c) => c.toLowerCase().includes(q));
  }, [searchQuery]);

  const handleSelect = (country) => {
    onChange(country);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-slate-950 border ${
          isOpen ? "border-purple-500 ring-1 ring-purple-500/30" : "border-slate-700"
        } rounded-lg px-3.5 py-2.5 text-sm text-left flex items-center justify-between text-slate-100 transition hover:border-slate-600 focus:outline-none`}
      >
        <div className="flex items-center gap-2.5 truncate">
          <Globe2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
          <span className={value ? "text-slate-100 font-medium truncate" : "text-slate-500 truncate"}>
            {value || placeholder}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 flex-shrink-0 ml-2 ${
            isOpen ? "rotate-180 text-purple-400" : ""
          }`}
        />
      </button>

      {/* Hidden input for HTML5 form validation if required */}
      {required && (
        <input
          type="text"
          value={value || ""}
          required
          onChange={() => {}}
          className="sr-only"
          tabIndex={-1}
        />
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden animate-slide-up">
          {/* Search Box */}
          <div className="p-2 border-b border-slate-800 bg-slate-950/80 sticky top-0 z-10">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-2.5 top-2.5" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search country..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-7 py-1.5 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-purple-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-2 text-slate-500 hover:text-slate-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Countries List */}
          <div className="max-h-56 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 p-1 space-y-0.5">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((c) => {
                const isSelected = value === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleSelect(c)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition ${
                      isSelected
                        ? "bg-purple-600/30 text-purple-200 font-bold border border-purple-500/40"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <span className="truncate">{c}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-purple-400 flex-shrink-0 ml-2" />}
                  </button>
                );
              })
            ) : (
              <div className="py-6 text-center text-xs text-slate-500">
                No countries matching "<span className="text-slate-300">{searchQuery}</span>"
              </div>
            )}
          </div>

          {/* Footer showing total count */}
          <div className="px-3 py-1.5 border-t border-slate-800 bg-slate-950/60 text-[10px] text-slate-500 flex items-center justify-between">
            <span>{WORLD_COUNTRIES.length} Countries Worldwide</span>
            {value && <span className="text-purple-400 font-mono font-medium">Selected: {value}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
