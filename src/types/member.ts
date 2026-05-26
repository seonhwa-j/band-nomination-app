export type Member = {
  id: string;
  name: string;
  role: string;
  avatar: string;
};

export type BandPart = "vocal" | "drum" | "bass" | "devil" | "sunny" | "keyboard" | "chorus";

export type AuthUser = {
  id: string;
  name: string;
  part: BandPart;
  role: string;
  avatar: string;
  email?: string;
  aliases?: string[];
  supabaseUserId?: string | null;
};

export type AuthLoginPayload = {
  email: string;
  password: string;
};
