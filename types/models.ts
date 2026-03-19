export interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  currency: string;
  language: string;
  role: string;
  email_verified_at: string | null;
  phone_verified_at: string | null;
  notification_email: boolean;
  notification_push: boolean;
}

export interface AuthData {
  token: string;
  user: User;
}

export interface LoginPayload {
  email: string;
  password: string;
  device_name: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  device_name: string;
}
