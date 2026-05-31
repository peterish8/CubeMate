import { useEffect, useRef } from "react";

interface VideoPanelProps {
  stream: MediaStream | null;
  muted?: boolean;
  label: string;
  connected?: boolean;
  cameraOn?: boolean;
  mirror?: boolean;
}

export function VideoPanel({ stream, muted = false, label, connected = false, cameraOn = true, mirror = false }: VideoPanelProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const isLive = !!stream && cameraOn;
  const isConnected = connected || muted;

  return (
    <div className={`card overflow-hidden relative aspect-video bg-black/60 transition-all duration-300 ${
      isConnected ? "ring-1 ring-white/[0.09]" : ""
    }`}>
      {isLive ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={muted}
          className="w-full h-full object-cover"
          style={mirror ? { transform: "scaleX(-1)" } : undefined}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-[#0a0d14]">
          <div className="flex flex-col items-center gap-2.5 text-white/20">
            <CameraOffIcon className="w-9 h-9" />
            <span className="text-xs tracking-wide">{stream ? "Camera off" : "No video"}</span>
          </div>
        </div>
      )}

      {/* Bottom overlay */}
      <div className="absolute bottom-0 left-0 right-0 px-3 py-2.5 bg-gradient-to-t from-black/80 via-black/30 to-transparent">
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
            isConnected ? "bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.8)]" : "bg-white/20"
          }`} />
          <span className="text-white/70 text-xs font-medium tracking-wide">{label}</span>
        </div>
      </div>
    </div>
  );
}

function CameraOffIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M12 18.75H4.5a2.25 2.25 0 01-2.25-2.25V9m12.841 9.091L16.5 19.5m-1.409-1.409c.407-.407.659-.97.659-1.591v-9a2.25 2.25 0 00-2.25-2.25h-9c-.621 0-1.184.252-1.591.659m12.182 12.182L2.909 5.909M1.5 4.5l1.409 1.409" />
    </svg>
  );
}
