export interface UserProfileData {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  organization?: string;
  role?: 'manager' | 'farmer' | 'agronomist' | 'technician' | 'viewer';
  bio?: string;
  phoneNumber?: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AuthMode = 'login' | 'register' | 'forgot_password' | 'verify_notice';

export interface AuthActivity {
  id: string;
  timestamp: string;
  action: string;
  details?: string;
  type: 'auth' | 'security' | 'profile' | 'verification';
}
