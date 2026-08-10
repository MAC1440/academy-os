import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type AccountType = 'ADMIN' | 'STAFF' | 'LEARNER';
export type AuthenticatedUser = {
  id: string;
  accountType: AccountType;
  username: string | null;
  contactNumber: string | null;
  fullName: string;
  email: string | null;
  mustCompleteProfile: boolean;
};
type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthenticatedUser | null;
  hydrated: boolean;
};
const initialState: AuthState = {
  accessToken: null,
  refreshToken: null,
  user: null,
  hydrated: false,
};
const persist = (key: string, value: string | null) => {
  if (typeof window === 'undefined') return;
  value ? localStorage.setItem(key, value) : localStorage.removeItem(key);
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    hydrateSession: (state) => {
      if (typeof window !== 'undefined') {
        state.accessToken = localStorage.getItem('accessToken');
        state.refreshToken = localStorage.getItem('refreshToken');
      }
      state.hydrated = true;
    },
    setCredentials: (
      state,
      action: PayloadAction<{
        accessToken: string;
        refreshToken: string;
        user?: AuthenticatedUser;
      }>,
    ) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      if (action.payload.user) state.user = action.payload.user;
      persist('accessToken', state.accessToken);
      persist('refreshToken', state.refreshToken);
    },
    setUser: (state, action: PayloadAction<AuthenticatedUser>) => {
      state.user = action.payload;
    },
    signOut: (state) => {
      Object.assign(state, { ...initialState, hydrated: true });
      persist('accessToken', null);
      persist('refreshToken', null);
    },
  },
});
export const { hydrateSession, setCredentials, setUser, signOut } = authSlice.actions;
export default authSlice.reducer;
