import { ToggleSetting } from "../../shared/ui/ToggleSetting";

export interface RoomSettingsSheetProps {
  inspectionEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  syncEnabled: boolean;
  onInspectionChange: (v: boolean) => void;
  onSoundChange: (v: boolean) => void;
  onVibrationChange: (v: boolean) => void;
  onSyncChange: (v: boolean) => void;
}

export function RoomSettingsSheet({
  inspectionEnabled,
  soundEnabled,
  vibrationEnabled,
  syncEnabled,
  onInspectionChange,
  onSoundChange,
  onVibrationChange,
  onSyncChange,
}: RoomSettingsSheetProps) {
  return (
    <div className="motion-sheet flex-shrink-0 border-b border-white/[0.07] px-4 sm:px-5 py-2 sm:py-2.5 bg-[#0d1018] flex flex-wrap gap-4 sm:gap-5 text-sm">
      <ToggleSetting label="Inspection (15s)" value={inspectionEnabled} onChange={onInspectionChange} />
      <ToggleSetting label="Sound cues" value={soundEnabled} onChange={onSoundChange} />
      <ToggleSetting label="Vibration" value={vibrationEnabled} onChange={onVibrationChange} />
      <ToggleSetting label="Sync scramble" value={syncEnabled} onChange={onSyncChange} />
    </div>
  );
}
