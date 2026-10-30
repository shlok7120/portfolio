import { ImageResponse } from "next/og";
import { profile } from "@/content/profile";

export const alt = `${profile.name}, car number ${profile.number}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: 80,
        background: "#0a0b0d",
        color: "#f2f4f7",
        borderTop: "16px solid #c8ff00",
      }}
    >
      <div style={{ fontSize: 34, color: "#c8ff00" }}>{`${profile.team} · Car #${profile.number}`}</div>
      <div style={{ fontSize: 130, fontWeight: 800, lineHeight: 1.05, marginTop: 24 }}>{profile.name}</div>
      <div style={{ fontSize: 38, color: "#a2abb8", marginTop: 28 }}>
        Full-stack systems and applied machine learning
      </div>
    </div>,
    size,
  );
}
