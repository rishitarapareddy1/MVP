// Friendly aliases over the generated Supabase types. Regenerate the source
// with `npm run db:types` after every migration.
import { Constants, type Database, type Tables } from "./database.types";

type Enums = Database["public"]["Enums"];

export type UserRole = Enums["user_role"];
export type ProjectStatus = Enums["project_status"];
export type ProjectCategory = Enums["project_category"];

export const PROJECT_STATUSES = Constants.public.Enums.project_status;
export const PROJECT_CATEGORIES = Constants.public.Enums.project_category;

export type Profile = Pick<Tables<"profiles">, "id" | "role" | "email" | "full_name">;
export type Project = Tables<"projects">;
export type Business = Tables<"businesses">;
export type ActivityLogEntry = Tables<"activity_log">;
