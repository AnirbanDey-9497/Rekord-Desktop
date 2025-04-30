import { cn, onCloseApp } from "@/lib/utils";
import { UserButton } from "@clerk/clerk-react";
import { X } from "lucide-react";
import { useState } from "react";

type ControlLayoutProps = {
  children: React.ReactNode;
  className?: string;
};

export const ControlLayout = ({ children, className }: ControlLayoutProps) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  window.ipcRenderer.on("hide-plugin", (event, payload) => {
    console.log(event);
    setIsVisible(payload.state);
  });
  return (
    <div
      className={cn(
        className,
        isVisible && "invisible",
        "bg-[#171717] w-[400px] flex flex-col rounded-3xl overflow-hidden shadow-none border-0 draggable"
      )}>
      <div className="flex justify-between items-center p-5">
        <div className="flex items-center gap-x-2 non-draggable">
          <img src="/rekord.png" className="h-5" />
          <p className="text-white text-xl">Rekord</p>
        </div>
        <X
          size={20}
          className="text-gray-400 hover:text-white cursor-pointer non-draggable"
          onClick={onCloseApp}
        />
      </div>
      <div className="flex-1 overflow-auto non-draggable">{children}</div>
      <div className="p-5 flex w-full">
        <span className="non-draggable">
          <UserButton />
        </span>
      </div>
    </div>
  );
};
