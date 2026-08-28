import { useQuery } from "@tanstack/react-query";

export interface UserProfileData {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  avatarUrl?: string | null;
  _count?: {
    orders?: number;
    returns?: number;
    exchanges?: number;
  };
}

export function useUserProfile(enabled = true) {
  return useQuery({
    queryKey: ["userProfile"],
    queryFn: async (): Promise<UserProfileData | null> => {
      const res = await fetch("/api/profile");
      if (!res.ok) return null;
      const data = await res.json();
      return data?.user || null;
    },
    enabled,
    staleTime: 60 * 1000,
  });
}
