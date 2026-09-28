// Hand-written row types for the tables used so far. These mirror
// supabase/migrations; later we can replace them with `supabase gen types`.

export type UserRole = "student" | "admin";

export type Profile = {
  id: string;
  role: UserRole;
  email: string;
  full_name: string | null;
};
