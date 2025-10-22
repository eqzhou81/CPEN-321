import api from './api';

export interface AuthResponse {
  message: string;
  data: {
    user: {
      _id: string;
      name: string;
      email: string;
      profilePicture?: string;
    };
    token: string;
  };
}

export interface SignUpRequest {
  idToken: string;
}

export interface SignInRequest {
  idToken: string;
}

export const authService = {
  async signUp(idToken: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/signup', { idToken });
    return response.data;
  },

  async signIn(idToken: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/signin', { idToken });
    return response.data;
  },

  async getProfile() {
    const response = await api.get('/user/profile');
    return response.data;
  },

  async updateProfile(data: any) {
    const response = await api.post('/user/profile', data);
    return response.data;
  },

  async deleteProfile() {
    const response = await api.delete('/user/profile');
    return response.data;
  }
};
