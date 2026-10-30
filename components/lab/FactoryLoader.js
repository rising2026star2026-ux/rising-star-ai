"use client";
import dynamic from "next/dynamic";

const VideoFactory = dynamic(() => import("./VideoFactory"), { ssr: false, loading: () => <p>بنحمّل المحرر...</p> });
export default function FactoryLoader() { return <VideoFactory />; }
