export type UserProfile = {
  id: number;
  name: string;
  email: string;
  photoUrl: string | null;
  role: string;
};

export type AdminUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
};
