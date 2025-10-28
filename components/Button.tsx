import React from "react";

export default function Button({
  onClick,
  className,
  children,
}: {
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full bg-blue text-h3 rounded-2xl flex justify-center items-center cursor-pointer ${className}`}
    >
      <div className="hover:bg-blue-950/15 flex justify-center items-center transition duration-200 w-full h-full py-2 px-4 border-2 border-border rounded-2xl">
        {children}
      </div>
    </button>
  );
}
