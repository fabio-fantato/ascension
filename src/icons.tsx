import React from "react";

export function UndoIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 15L3 9m0 0 6-6M3 9h12a6 6 0 010 12h-3"
      />
    </svg>
  );
}

export function NewRoundIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.023 9.348h4.177V5.17m-.478 4.359a8.25 8.25 0 11-3.006-5.793"
      />
    </svg>
  );
}

export function ClearIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 6h18M8 6v12a2 2 0 002 2h4a2 2 0 002-2V6m-5 0V4h-4v2m2 5v6m4-6v6"
      />
    </svg>
  );
}
