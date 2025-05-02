import { updateStudioSettings } from "@/lib/utils";
import { updateStudioSettingsSchema } from "@/schemas/studio-settings.schema";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { useZodForm } from "./useZodForm";

export const useStudioSettings = (
  id: string,
  screen?: string | null,
  audio?: string | null,
  preset?: "HD" | "SD",
  plan?: "PRO" | "FREE"
) => {
  const { register, watch, setValue } = useZodForm(updateStudioSettingsSchema, {
    screen: screen!,
    audio: audio!,
    preset: preset!,
  });

  const [onPreset, setPreset] = useState<"HD" | "SD" | undefined>();

  // Update form values when props change
  useEffect(() => {
    if (screen) setValue("screen", screen);
    if (audio) setValue("audio", audio);
    if (preset) setValue("preset", preset);
  }, [screen, audio, preset, setValue]);

  const { mutate, isPending } = useMutation({
    mutationKey: ["update-studio"],
    mutationFn: (data: {
      screen: string;
      id: string;
      audio: string;
      preset: "HD" | "SD";
    }) => updateStudioSettings(data.id, data.screen, data.audio, data.preset),
    onSuccess: (data) => {
      return toast(data.status === 200 ? "Success" : "Error", {
        description: data.message,
      });
    },
  });

  const sendMediaSources = useCallback((
    screen: string,
    audio: string,
    preset: "HD" | "SD"
  ) => {
    console.log("[useStudioSettings] Sending media sources:", {
      screen,
      id,
      audio,
      preset,
      plan,
    });
    window.ipcRenderer.send("media-sources", {
      screen,
      id,
      audio,
      preset,
      plan,
    });
  }, [id, plan]);

  useEffect(() => {
    //set sources on mount
    if (screen && audio && preset) {
      console.log("[useStudioSettings] Initial media sources available");
      sendMediaSources(screen, audio, preset);
    } else {
      console.log("[useStudioSettings] Waiting for media sources:", {
        screen,
        audio,
        preset,
      });
    }
  }, [screen, audio, preset, sendMediaSources]);

  useEffect(() => {
    //set sources on change
    const subscribe = watch((values) => {
      console.log("[useStudioSettings] Media sources changed:", values);
      setPreset(values.preset);
      
      if (!values.screen || !values.audio || !values.preset) {
        console.log("[useStudioSettings] Incomplete media sources:", values);
        return;
      }

      mutate({
        screen: values.screen!,
        id: id,
        audio: values.audio!,
        preset: values.preset!,
      });

      //we send the user id to the second screen to sync the studio tray
      sendMediaSources(values.screen, values.audio, values.preset);
    });
    return () => subscribe.unsubscribe();
  }, [watch, sendMediaSources, mutate, id]);

  return { register, isPending, onPreset, sendMediaSources };
};
