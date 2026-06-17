import React from "react";
import { cn } from "@/lib/utils";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  wrapperClassName?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, wrapperClassName, children, ...props }, ref) => {
    return (
      <div className={cn("relative", wrapperClassName ?? "w-full")}>
        <select
          className={cn(
            "flex h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-3.5 pr-10 py-2 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all cursor-pointer min-w-[100px]",
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        {/* Custom dropdown chevron arrow */}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          <svg
            className="h-4 w-4 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>
    );
  }
);
Select.displayName = "Select";
