import { SourceDeviceStateProps } from "@/hooks/useMediaSources";
import { Headphones, Settings } from "lucide-react";
import { Monitor } from "lucide-react";
import { Spinner } from "../loader/spinner";
import { useStudioSettings } from "@/hooks/useStudioSettings";

type MediaConfigurationProps = {
    state: SourceDeviceStateProps;
    user:
      | ({
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
        } & {
          id: string;
          email: string;
          firstname: string | null;
          lastname: string | null;
          createdAt: Date;
          clerkid: string;
        })
      | null;
};

export const MediaConfiguration = ({ state, user }: MediaConfigurationProps) => {
    // Return early if user is null
    if (!user) {
        return (
            <div className="w-full h-full flex justify-center items-center">
                <Spinner color="#fff" />
            </div>
        );
    }

    const activeScreen = state.displays?.find(
        (screen) => screen.id === user?.studio?.screen
    );
    
    const activeAudio = state.audioInputs?.find(
        (device) => device.deviceId === user?.studio?.mic
    );
    
    const { register, isPending, onPreset } = useStudioSettings(
        user.id,
        user?.studio?.screen || state.displays?.[0]?.id,
        user?.studio?.mic || state.audioInputs?.[0]?.deviceId,
        user?.studio?.preset,
        user?.subscription?.plan
    );
    
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
                    value={user?.studio?.screen || state.displays?.[0]?.id || ''}
                    className="outline-none cursor-pointer px-5 py-2 rounded-xl border-2 text-white border-[#575655] bg-transparent w-full">
                    {state.displays?.map((display, key) => (
                        <option
                            value={display.id}
                            className="bg-[#171717] cursor-pointer"
                            key={key}>
                            {display.name}
                        </option>
                    ))}
                </select>
            </div>
            <div className="flex gap-x-5 justify-center items-center">
                <Headphones color="#575655" size={36} />
                <select
                    {...register("audio")}
                    value={user?.studio?.mic || state.audioInputs?.[0]?.deviceId || ''}
                    className="outline-none cursor-pointer px-5 py-2 rounded-xl border-2 text-white border-[#575655] bg-transparent w-full">
                    {state.audioInputs?.map((device, key) => (
                        <option
                            value={device.deviceId}
                            className="bg-[#171717] cursor-pointer"
                            key={key}>
                            {device.label}
                        </option>
                    ))}
                </select>
            </div>
            <div className="flex gap-x-5 justify-center items-center">
                <Settings color="#575655" size={36} />
                <select
                    {...register("preset")}
                    value={user?.studio?.preset || "SD"}
                    className="outline-none cursor-pointer px-5 py-2 rounded-xl border-2 text-white border-[#575655] bg-transparent w-full">
                    <option
                        disabled={user?.subscription?.plan === "FREE"}
                        value="HD"
                        className="bg-[#171717] cursor-pointer">
                        1080p{" "}
                        {user?.subscription?.plan === "FREE" && "(Upgrade to PRO plan)"}
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
    
