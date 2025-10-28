import type { DashboardStyleType } from "../../styles/dashboardStyles";

interface Props {
  styles: DashboardStyleType;
}
export function UploadPage({ styles }: Props) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "7fr 5fr",
        gap: "1rem",
        height: "100%",
      }}
    >
      {/*left side, where to upload new files */}
      <div
        style={{
          background: "#f5f5f5", // just to visualize
          padding: "1rem",
        }}
      >
        <h2
          style={{
            color: "black",
            justifySelf: "center",
          }}
        >
          Upload a file
        </h2>
      </div>
      {/*right side, upload history */}
      <div
        style={{
          background: "#f5f5f5", // just to visualize
          padding: "1rem",
        }}
      >
        <h2
          style={{
            color: "black",
            justifySelf: "center",
          }}
        >
          Upload History
        </h2>
      </div>
    </div>
  );
}
