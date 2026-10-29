"use client";
import dynamic from "next/dynamic";

const RemotionReel = dynamic(() => import("./RemotionReel"), { ssr: false, loading: () => <p>بنحمّل المحرر...</p> });
export default function RemotionLoader() { return <RemotionReel />; }
