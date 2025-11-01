import React from "react";
import { ChevronDown } from "lucide-react";
import type { PostalOffice } from "../../types";

interface Props {
  offices: PostalOffice[];
  selectedOfficeId: string | null;
  onSelect: (officeId: string) => void;
}

export const PostOfficeDropdown: React.FC<Props> = ({
  offices,
  selectedOfficeId,
  onSelect,
}) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const selectedOfficeName = offices?.find(
    (o) => o.id.toString() === selectedOfficeId,
  )?.name;

  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", width: 300 }}>
      <div
        onClick={() => offices.length && setOpen(!open)}
        style={{
          background: offices.length ? "white" : "#f1f5f9",
          color: offices.length ? "black" : "#9ca3af",
          border: "1px solid #ccc",
          borderRadius: 8,
          padding: "8px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: offices.length ? "pointer" : "not-allowed",
        }}
      >
        <span>{selectedOfficeName || "Select Office"}</span>
        {offices.length > 0 && <ChevronDown size={16} />}
      </div>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: "white",
            border: "1px solid #ccc",
            borderRadius: "0 0 8px 8px",
            maxHeight: 200,
            overflowY: "auto",
          }}
        >
          {offices.map((office) => (
            <div
              key={office.id}
              onClick={() => {
                onSelect(office.id.toString());
                setOpen(false);
              }}
              style={{
                padding: "8px 10px",
                cursor: "pointer",
                background:
                  selectedOfficeId === office.id.toString()
                    ? "#eef"
                    : "transparent",
                color: "black",
              }}
            >
              {office.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
