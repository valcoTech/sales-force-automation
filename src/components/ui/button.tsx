import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", type = "button", ...props }, ref) => {
    return (
      <button
        type={type}
        className={cn(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer",
          {
            "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-sm": variant === "default",
            "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm": variant === "destructive",
            "border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700": variant === "outline",
            "bg-slate-100 text-slate-900 hover:bg-slate-200 active:bg-slate-300": variant === "secondary",
            "hover:bg-slate-105 active:bg-slate-200 text-slate-700": variant === "ghost",
            "text-slate-900 underline-offset-4 hover:underline": variant === "link",
          },
          {
            "h-10 px-4 py-2": size === "default",
            "h-8 rounded-lg px-3 text-xs": size === "sm",
            "h-12 rounded-2xl px-8 text-base": size === "lg",
            "h-10 w-10 rounded-full": size === "icon",
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
