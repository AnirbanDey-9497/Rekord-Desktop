import { useEffect, useState } from "react";

import { SignedIn, useUser } from "@clerk/clerk-react";
import { ClerkLoading } from "@clerk/clerk-react";
import { Spinner } from "../loader/spinner";
import { fetchUserProfile } from "@/lib/utils";
import { useMediaSources } from "@/hooks/useMediaSources";
const Widget = () => {
    const { user } = useUser()
    const { state, fetchMediaResources } = useMediaSources()

    const [profile, setProfile] = useState<{
        status: number;
        user:
          | ({
              subscription: {
                plan: "PRO" | "FREE";
              } | null;
              studio: {
                id: string;
                screen: string | null;
                mic: string | null;
                preset: "HD" | "SD";
                camera: string | null;
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
      } | null>(null);


      useEffect(() => {
        console.log("fetching");
        if (user && user.id) {
          fetchUserProfile(user.id).then((p) => setProfile(p));
          fetchMediaResources();
        }
      }, [user]);

  return (
    <div className="p-5">
        <ClerkLoading>
            <div className="h-full flex justify-center items-center">
                <Spinner />
            </div>
        </ClerkLoading>
        <SignedIn>
        {/* {profile ? (
          <MediaConfiguration state={state} user={profile?.user} />
        ) : (
          <div className="w-full h-full flex justify-center items-center">
            <Spinner color="#fff" />
          </div>
        )} */}
        </SignedIn>
    </div>
  )
};

export default Widget;
