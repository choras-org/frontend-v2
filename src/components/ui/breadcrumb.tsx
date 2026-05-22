import { ChevronRightIcon } from "lucide-react";
import { Link } from "react-router";
import { Fragment } from "react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  isActive?: boolean;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className = "" }: BreadcrumbProps) {
  const truncateText = (text: string, maxLength: number = 24) => {
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  return (
    <div className={`flex items-center justify-center text-choras-primary text-2xl ${className}`}>
      {items.map((item, index) => (
        <Fragment key={index}>
          {item.href ? (
            <Link className="hover:underline" to={item.href} title={item.label}>
              {truncateText(item.label)}
            </Link>
          ) : (
            <span className={item.isActive ? "underline" : ""} title={item.label}>
              {truncateText(item.label)}
            </span>
          )}
          {index < items.length - 1 && <ChevronRightIcon />}
        </Fragment>
      ))}
    </div>
  );
}
