import { Home, Building, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

type PropertyType =
  | "single-family"
  | "condo-townhome"
  | "multi-family"
  | "manufactured"
  | "commercial"
  | "residential"
  | "other"
  | (string & {});

interface PropertyTypeIconProps {
  type: PropertyType;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-7 w-7",
};

export function PropertyTypeIcon({ type, size = "sm", className }: PropertyTypeIconProps) {
  const wrapperClasses = cn("inline-flex items-center justify-center shrink-0", sizeClasses[size], className);

  switch (type) {
    case "residential":
    case "single-family":
      return (
        <span className={wrapperClasses}>
          <Home className="h-full w-full text-blue-500" />
        </span>
      );
    case "condo-townhome":
      return (
        <span className={wrapperClasses}>
          <Home className="h-full w-full text-blue-500" />
        </span>
      );
    case "commercial":
      return (
        <span className={wrapperClasses}>
          <Building className="h-full w-full text-purple-500" />
        </span>
      );
    case "multi-family":
      return (
        <span className={wrapperClasses}>
          <Building className="h-full w-full text-amber-500" />
        </span>
      );
    case "manufactured":
      return (
        <span className={wrapperClasses}>
          <Home className="h-full w-full text-emerald-500" />
        </span>
      );
    default:
      return (
        <span className={wrapperClasses}>
          <MapPin className="h-full w-full text-gray-500" />
        </span>
      );
  }
}
