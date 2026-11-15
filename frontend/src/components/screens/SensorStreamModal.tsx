import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  Radio,
  Wifi,
  WifiOff,
  X,
  Play,
  Square,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Heart,
  Wind,
  Thermometer,
  Zap,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Primitives';

interface SensorStreamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyStreamingVitals: (vitals: { heartRate: number; respiration: number; skinTemp: number }) => void;
}

export const SensorStreamModal: React.FC<SensorStreamModalProps> = ({
  isOpen,
  onClose,
  onApplyStreamingVitals,
}) => {
  const [streaming, setStreaming] = useState(true);
  const [deviceConnected, setDeviceConnected] = useState(true);
  const [batteryLevel, setBatteryLevel] = useState(94);
  const [motionArtifact, setMotionArtifact] = useState(false);

  // Live streaming sensor numbers
  const [hr, setHr] = useState(72);
  const [respiration, setRespiration] = useState(14);
  const [skinTemp, setSkinTemp] = useState(34.2);
  const [activityG, setActivityG] = useState(0.04);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const pointsRef = useRef<number[]>([]);

  // Telemetry stream generator
  useEffect(() => {
    if (!isOpen || !streaming || !deviceConnected) return;

    const interval = setInterval(() => {
      // Gentle physiological wander with subtle respiratory sinus arrhythmia
      const noise = (Math.random() - 0.5) * 2;
      const artifactBoost = motionArtifact ? (Math.random() - 0.5) * 16 : 0;
      const nextHr = Math.round(Math.max(50, Math.min(130, 72 + Math.sin(Date.now() / 4000) * 4 + noise + artifactBoost)));
      const nextResp = Math.round(Math.max(8, Math.min(26, 14 + Math.sin(Date.now() / 6000) * 2 + (motionArtifact ? 4 : 0))));
      const nextTemp = Number((34.2 + (Math.random() - 0.5) * 0.1).toFixed(1));
      const nextG = Number((motionArtifact ? 0.35 + Math.random() * 0.4 : 0.02 + Math.random() * 0.04).toFixed(2));

      setHr(nextHr);
      setRespiration(nextResp);
      setSkinTemp(nextTemp);
      setActivityG(nextG);

      onApplyStreamingVitals({
        heartRate: nextHr,
        respiration: nextResp,
        skinTemp: nextTemp,
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, streaming, deviceConnected, motionArtifact, onApplyStreamingVitals]);

  // Real-time Oscilloscope ECG / Pulse Waveform rendering
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;
    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // Draw faint background grid
      ctx.strokeStyle = 'rgba(127, 178, 255, 0.08)';
      ctx.lineWidth = 1;
      const gridSize = 16;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // ECG wave signal simulation
      if (streaming && deviceConnected) {
        phase += 0.045;
        const pts = pointsRef.current;
        const cy = height / 2;

        // P-Q-R-S-T wave calculation
        const cycle = (phase * (hr / 60)) % 1;
        let signal = 0;
        if (cycle > 0.12 && cycle < 0.18) {
          // P wave
          signal = Math.sin((cycle - 0.12) / 0.06 * Math.PI) * 12;
        } else if (cycle > 0.22 && cycle < 0.24) {
          // Q dip
          signal = -8;
        } else if (cycle >= 0.24 && cycle < 0.29) {
          // R peak
          signal = 46 * (1 - Math.abs(cycle - 0.265) / 0.025);
        } else if (cycle >= 0.29 && cycle < 0.32) {
          // S dip
          signal = -14;
        } else if (cycle > 0.40 && cycle < 0.54) {
          // T wave
          signal = Math.sin((cycle - 0.40) / 0.14 * Math.PI) * 18;
        }

        // Add motion artifact jitter if enabled
        if (motionArtifact) {
          signal += (Math.random() - 0.5) * 22;
        }

        pts.push(cy - signal);
        if (pts.length > width / 2) pts.shift();

        // Render live trace line
        ctx.strokeStyle = motionArtifact ? '#FFB547' : '#3DE0C5';
        ctx.lineWidth = 2.2;
        ctx.shadowColor = motionArtifact ? '#FFB547' : '#3DE0C5';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        for (let i = 0; i < pts.length; i++) {
          const x = i * 2;
          const y = pts[i];
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Leading glowing sweep head
        if (pts.length > 0) {
          const headX = (pts.length - 1) * 2;
          const headY = pts[pts.length - 1];
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(headX, headY, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // Flatline / disconnected state
        ctx.strokeStyle = 'rgba(138, 151, 173, 0.3)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    animFrameRef.current = requestAnimationFrame(draw);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isOpen, streaming, deviceConnected, hr, motionArtifact]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#070B14]/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-label="Wearable Sensor Telemetry Ingestion"
    >
      <div className="w-full max-w-xl rounded-3xl cockpit-panel-elevated p-6 space-y-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-3.5 border-b border-white/[0.08]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-[#3DE0C5]/15 text-[#3DE0C5]">
                <Radio className="w-4 h-4 animate-pulse" aria-hidden="true" />
              </span>
              <h2 className="text-lg font-semibold text-[#E8EEF7]">
                CSA Bio-Monitor Smart Shirt Ingestion
              </h2>
            </div>
            <p className="text-xs text-[#8A97AD]">
              Hardware simulator modeled on the Canadian Space Agency’s autonomous Bio-Monitor smart shirt (tested on ISS).
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#8A97AD] hover:text-[#E8EEF7] hover:bg-white/5 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Hardware Status Strip */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-[#070B14]/75 border border-white/10 text-xs flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className={cn('w-2 h-2 rounded-full', deviceConnected ? 'bg-[#3DE0C5]' : 'bg-[#FF6B5E]')} />
            <span className="text-[#E8EEF7] font-medium">
              {deviceConnected ? 'Bio-Monitor BLE Connected' : 'Device Paused / Disconnected'}
            </span>
            <span className="text-[#8A97AD]">·</span>
            <span className="text-[#8A97AD] font-mono-tabular">Battery: {batteryLevel}%</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDeviceConnected((v) => !v)}
              className="px-2.5 py-1 rounded-lg bg-[#151E2E] hover:bg-white/10 text-[11px] font-medium text-[#E8EEF7] border border-white/10 cursor-pointer"
            >
              {deviceConnected ? 'Disconnect' : 'Connect BLE'}
            </button>
            <button
              type="button"
              onClick={() => setMotionArtifact((v) => !v)}
              className={cn(
                'px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer',
                motionArtifact
                  ? 'bg-[#FFB547]/20 border-[#FFB547] text-[#FFB547]'
                  : 'bg-[#151E2E] border-white/10 text-[#8A97AD] hover:text-[#E8EEF7]'
              )}
            >
              {motionArtifact ? 'Motion Artifact ON' : 'Inject Motion Noise'}
            </button>
          </div>
        </div>

        {/* Live Oscilloscope Waveform Display */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-[#8A97AD] px-1">
            <span className="font-mono-tabular tracking-wider uppercase text-[10px]">
              Continuous Cardiac Lead II Oscilloscope
            </span>
            <span className="font-mono-tabular text-[#3DE0C5] text-[11px]">
              25 mm/s · 10 mm/mV
            </span>
          </div>
          <div className="w-full h-36 rounded-2xl bg-[#04070D] border border-white/12 overflow-hidden relative shadow-inner">
            <canvas ref={canvasRef} width={520} height={144} className="w-full h-full block" />
            {!deviceConnected && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#070B14]/75 text-xs text-[#8A97AD]">
                Telemetry stream paused
              </div>
            )}
          </div>
        </div>

        {/* Live Sensor Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 rounded-2xl bg-[#070B14]/80 border border-white/10 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs text-[#7FB2FF] mb-1">
              <Heart className="w-3.5 h-3.5" />
              <span>Heart Rate</span>
            </div>
            <div className="text-xl font-bold font-mono-tabular text-[#E8EEF7]">
              {deviceConnected ? hr : '—'} <span className="text-xs text-[#8A97AD] font-normal">bpm</span>
            </div>
            <span className="text-[10px] text-[#3DE0C5] font-medium">Optimal rhythm</span>
          </div>

          <div className="p-3 rounded-2xl bg-[#070B14]/80 border border-white/10 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs text-[#7FB2FF] mb-1">
              <Wind className="w-3.5 h-3.5" />
              <span>Respiration</span>
            </div>
            <div className="text-xl font-bold font-mono-tabular text-[#E8EEF7]">
              {deviceConnected ? respiration : '—'} <span className="text-xs text-[#8A97AD] font-normal">br/min</span>
            </div>
            <span className="text-[10px] text-[#3DE0C5] font-medium">Eupneic depth</span>
          </div>

          <div className="p-3 rounded-2xl bg-[#070B14]/80 border border-white/10 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs text-[#7FB2FF] mb-1">
              <Thermometer className="w-3.5 h-3.5" />
              <span>Skin Temp</span>
            </div>
            <div className="text-xl font-bold font-mono-tabular text-[#E8EEF7]">
              {deviceConnected ? skinTemp : '—'} <span className="text-xs text-[#8A97AD] font-normal">°C</span>
            </div>
            <span className="text-[10px] text-[#3DE0C5] font-medium">Peripheral steady</span>
          </div>

          <div className="p-3 rounded-2xl bg-[#070B14]/80 border border-white/10 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs text-[#7FB2FF] mb-1">
              <Activity className="w-3.5 h-3.5" />
              <span>G-Vector Accel</span>
            </div>
            <div className="text-xl font-bold font-mono-tabular text-[#E8EEF7]">
              {deviceConnected ? activityG : '—'} <span className="text-xs text-[#8A97AD] font-normal">g</span>
            </div>
            <span className="text-[10px] text-[#8A97AD] font-medium">Microgravity rest</span>
          </div>
        </div>

        {/* Footer controls */}
        <div className="pt-2 flex items-center justify-between gap-3 border-t border-white/[0.08] flex-wrap">
          <p className="text-[11px] text-[#8A97AD]">
            Ground link: Bio-Monitor telemetry automatically streams into 3D Ghost Twin.
          </p>
          <Button type="button" variant="primary" onClick={onClose}>
            Done / Close Monitor
          </Button>
        </div>
      </div>
    </div>
  );
};
