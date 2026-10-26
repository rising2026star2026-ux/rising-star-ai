"use client";
// بيختار أداة الاستوديو المناسبة. كل أداة بتتحمل لوحدها عشان الصفحة تفضل خفيفة.
import dynamic from "next/dynamic";
import { Busy } from "./ui";

const loading = () => <Busy text="بيجهز الأداة..." />;

const PhotoEditor = dynamic(() => import("./PhotoEditor"), { ssr: false, loading });
const Poster = dynamic(() => import("./Poster"), { ssr: false, loading });
const RemoveBg = dynamic(() => import("./RemoveBg"), { ssr: false, loading });
const Resize = dynamic(() => import("./Resize"), { ssr: false, loading });
const Batch = dynamic(() => import("./Batch"), { ssr: false, loading });
const Watermark = dynamic(() => import("./Watermark"), { ssr: false, loading });
const Colors = dynamic(() => import("./Colors"), { ssr: false, loading });
const Pdf = dynamic(() => import("./Pdf"), { ssr: false, loading });
const VideoFrame = dynamic(() => import("./VideoFrame"), { ssr: false, loading });
const Apps = dynamic(() => import("./Apps"), { ssr: false, loading });
const VideoMaker = dynamic(() => import("./VideoMaker"), { ssr: false, loading });

// نوع الأداة (من lib/tools.js) ← المكوّن وإعداداته
const KINDS = {
  photo: [PhotoEditor],
  poster: [Poster],
  removebg: [RemoveBg],
  resize: [Resize],
  compress: [Batch, { mode: "compress" }],
  convert: [Batch, { mode: "convert" }],
  watermark: [Watermark],
  colors: [Colors],
  img2pdf: [Pdf, { mode: "img2pdf" }],
  pdfmerge: [Pdf, { mode: "merge" }],
  pdfsplit: [Pdf, { mode: "split" }],
  frame: [VideoFrame],
  apps: [Apps],
  "video-ai": [VideoMaker, { mode: "ai" }],
  "video-text": [VideoMaker, { mode: "text" }],
  "video-photos": [VideoMaker, { mode: "photos" }],
};

export default function LocalTool({ kind }) {
  const entry = KINDS[kind];
  if (!entry) return null;
  const [Tool, props = {}] = entry;
  return (
    <div className="local-tool">
      <Tool {...props} />
    </div>
  );
}
