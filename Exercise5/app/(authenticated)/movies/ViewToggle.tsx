"use client";

export type ViewMode = "list" | "grid";

export default function ViewToggle({
  value,
  onChange,
}: {
  value: ViewMode;
  onChange: (next: ViewMode) => void;
}) {
  return (
    <div role="group" aria-label="View mode" style={{ display: "flex", gap: 0 }}>
      <button
        type="button"
        aria-pressed={value === "list"}
        onClick={() => onChange("list")}
        className={value === "list" ? "primary" : ""}
        style={{
          borderTopRightRadius: 0,
          borderBottomRightRadius: 0,
        }}
      >
        📋 List
      </button>
      <button
        type="button"
        aria-pressed={value === "grid"}
        onClick={() => onChange("grid")}
        className={value === "grid" ? "primary" : ""}
        style={{
          borderTopLeftRadius: 0,
          borderBottomLeftRadius: 0,
          marginLeft: -1,
        }}
      >
        ▦ Grid
      </button>
    </div>
  );
}
