export function ToggleSetting({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 sm:gap-2.5 cursor-pointer">
      <span className="text-white/50 text-xs">{label}</span>
      <div
        role="switch"
        aria-checked={value}
        tabIndex={0}
        onClick={() => onChange(!value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onChange(!value);
          }
        }}
        className={`motion-press relative rounded-full transition-colors cursor-pointer ${value ? "bg-blue-600" : "bg-white/15"}`}
        style={{ width: "34px", height: "18px" }}
      >
        <div
          className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-transform duration-200 ease-[var(--cm-ease-spring)] ${value ? "translate-x-[17px]" : "translate-x-0.5"}`}
        />
      </div>
    </label>
  );
}
