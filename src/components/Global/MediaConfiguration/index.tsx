import { SourceDeviceStateProps } from "@/hooks/useMediaSources";
import { useStudioSettings } from "@/hooks/useStudioSettings";
import { Headphones, Monitor, Settings } from "lucide-react";
import { Spinner } from "../loader/spinner";
import { useEffect, useState } from "react";

type UserType = {
  id: string;
  email: string;
  firstname: string | null;
  lastname: string | null;
  createdAt: Date;
  clerkid: string;
  subscription: {
    plan: "PRO" | "FREE";
  } | null;
  studio: {
    id: string;
    screen: string | null;
    mic: string | null;
    camera: string | null;
    preset: "HD" | "SD";
    userId: string | null;
  } | null;
};

type MediaConfigurationProps = {
  state: SourceDeviceStateProps;
  user: UserType | null;
};

export const MediaConfiguration = ({ user, state }: MediaConfigurationProps) => {
  // Early return if user is null
  if (!user) {
    return (
      <div className="w-full h-full flex justify-center items-center">
        <Spinner color="#fff" />
      </div>
    );
  }

  const [selectedScreen, setSelectedScreen] = useState(user.studio?.screen || state.displays?.[0]?.id || '');
  const [selectedAudio, setSelectedAudio] = useState(user.studio?.mic || state.audioInputs?.[0]?.deviceId || '');
  const [selectedPreset, setSelectedPreset] = useState(user.studio?.preset || "SD");

  const { register, isPending, onPreset, sendMediaSources } = useStudioSettings(
    user.id,
    selectedScreen,
    selectedAudio,
    selectedPreset,
    user.subscription?.plan
  );

  // Send initial sources when component mounts or when sources become available
  useEffect(() => {
    if (state.displays?.length && state.audioInputs?.length) {
      const initialScreen = user.studio?.screen || state.displays[0].id;
      const initialAudio = user.studio?.mic || state.audioInputs[0].deviceId;
      const initialPreset = user.studio?.preset || "SD";

      setSelectedScreen(initialScreen);
      setSelectedAudio(initialAudio);
      setSelectedPreset(initialPreset);

      // Send initial sources to studio tray
      sendMediaSources(initialScreen, initialAudio, initialPreset);
    }
  }, [state.displays, state.audioInputs, user.studio]);

  // Update local state when user or state props change
  useEffect(() => {
    const newScreen = user.studio?.screen || state.displays?.[0]?.id || '';
    const newAudio = user.studio?.mic || state.audioInputs?.[0]?.deviceId || '';
    const newPreset = user.studio?.preset || "SD";

    setSelectedScreen(newScreen);
    setSelectedAudio(newAudio);
    setSelectedPreset(newPreset);

    // Send updated sources to studio tray
    if (newScreen && newAudio && newPreset) {
      sendMediaSources(newScreen, newAudio, newPreset);
    }
  }, [user.studio, state.displays, state.audioInputs]);

  const handleScreenChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedScreen(e.target.value);
  };

  const handleAudioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedAudio(e.target.value);
  };

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPreset(e.target.value as "HD" | "SD");
  };

  return (
    <form className="flex h-full relative w-full flex-col gap-y-5">
      {isPending && (
        <div className="fixed z-50 w-full top-0 left-0 right-0 bottom-0 rounded-2xl h-full bg-black/80 flex justify-center items-center">
          <Spinner />
        </div>
      )}
      <div className="flex gap-x-5 justify-center items-center">
        <Monitor fill="#575655" color="#575655" size={36} />
        <select
          {...register("screen")}
          value={selectedScreen}
          onChange={handleScreenChange}
          className="outline-none cursor-pointer px-5 py-2 rounded-xl border-2 text-white border-[#575655] bg-transparent w-full">
          {state.displays?.map((display) => (
            <option
              value={display.id}
              className="bg-[#171717] cursor-pointer"
              key={display.id}>
              {display.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-x-5 justify-center items-center">
        <Headphones color="#575655" size={36} />
        <select
          {...register("audio")}
          value={selectedAudio}
          onChange={handleAudioChange}
          className="outline-none cursor-pointer px-5 py-2 rounded-xl border-2 text-white border-[#575655] bg-transparent w-full">
          {state.audioInputs?.map((device) => (
            <option
              value={device.deviceId}
              className="bg-[#171717] cursor-pointer"
              key={device.deviceId}>
              {device.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-x-5 justify-center items-center">
        <Settings color="#575655" size={36} />
        <select
          {...register("preset")}
          value={selectedPreset}
          onChange={handlePresetChange}
          className="outline-none cursor-pointer px-5 py-2 rounded-xl border-2 text-white border-[#575655] bg-transparent w-full">
          <option
            disabled={user.subscription?.plan === "FREE"}
            value="HD"
            className="bg-[#171717] cursor-pointer">
            1080p{" "}
            {user.subscription?.plan === "FREE" && "(Upgrade to PRO plan)"}
          </option>
          <option
            value="SD"
            className="bg-[#171717] cursor-pointer">
            720p
          </option>
        </select>
      </div>
    </form>
  );
};
    
