import { FileQuestion } from "lucide-react";

import PublicButton from "../buttons/PublicButton";

export default function EmptyState({
  icon: Icon = FileQuestion,

  title,

  description,

  action,

  actionLabel,

  onAction,

  actionVariant = "primary",

  compact = false,

  className = "",
}) {
  return (
    <div
      className={[
        "flex flex-col items-center justify-center",

        "border border-line",

        "bg-surface",

        "text-center",

        "shadow-app",

        "rounded-app-lg",

        compact ? "p-6" : "px-4 py-10 sm:px-6",

        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div
        className={[
          "flex items-center justify-center",

          "rounded-full",

          "bg-surface-muted",

          "text-content-muted",

          compact ? "mb-3 h-12 w-12" : "mb-5 h-16 w-16",
        ].join(" ")}
      >
        <Icon size={compact ? 24 : 30} strokeWidth={1.8} aria-hidden="true" />
      </div>

      {title && (
        <h2
          className={[
            "m-0 font-bold text-content",

            compact ? "text-base" : "text-lg sm:text-xl",
          ].join(" ")}
        >
          {title}
        </h2>
      )}

      {description && (
        <p className="mb-0 mt-2 max-w-xl text-sm leading-6 text-content-muted">
          {description}
        </p>
      )}

      {(action || (actionLabel && onAction)) && (
        <div className="mt-5">
          {action || (
            <PublicButton variant={actionVariant} onClick={onAction}>
              {actionLabel}
            </PublicButton>
          )}
        </div>
      )}
    </div>
  );
}
