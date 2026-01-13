"use client";

import { useState, useRef, useEffect } from "react";

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  label?: string;
  options: Option[];
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  isLoading?: boolean;
  disabled?: boolean;
}

export default function SearchableSelect({
  label,
  options,
  value,
  onChange,
  placeholder = "Select...",
  isLoading = false,
  disabled = false,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Get selected label for display
  const selectedOption = options.find((opt) => opt.value === value);

  // Filter options based on search term
  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Update search term when value changes externally or when opened
  useEffect(() => {
    if (isOpen) {
      // Focus usually resets search, but maybe we want to convert current value to search?
      // Let's keep search empty on open to allow fresh search, or pre-fill?
      // Standard UX: Empty search to type new, or select current.
      setSearchTerm("");
    }
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div
        className={`relative w-full cursor-pointer bg-white border border-gray-300 rounded-md shadow-sm px-3 py-2 text-left focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 sm:text-sm ${
          disabled ? "bg-gray-100 cursor-not-allowed" : ""
        }`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <span
            className={`block truncate ${
              !selectedOption ? "text-gray-400" : "text-gray-900"
            }`}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <div className="pointer-events-none flex items-center pr-2">
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg
                className="h-5 w-5 text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
        </div>
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
          <div className="sticky top-0 z-10 bg-white px-2 py-1.5 border-b border-gray-100">
            <input
              type="text"
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm px-2 py-1 border"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {filteredOptions.length === 0 ? (
            <div className="cursor-default select-none relative py-2 px-4 text-gray-700">
              No results found.
            </div>
          ) : (
            filteredOptions.map((option) => (
              <div
                key={option.value}
                className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-green-50 ${
                  value === option.value
                    ? "bg-green-50 text-green-900"
                    : "text-gray-900"
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect(option.value);
                }}
              >
                <span
                  className={`block truncate ${
                    value === option.value ? "font-semibold" : "font-normal"
                  }`}
                >
                  {option.label}
                </span>

                {value === option.value && (
                  <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-green-600">
                    <svg
                      className="h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
