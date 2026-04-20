import { type ReactNode } from "react";
import { type User } from "firebase/auth";
export interface AuthState {
    user: User | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signOutUser: () => Promise<void>;
}
export declare const AuthContext: import("react").Context<AuthState | null>;
export declare function AuthProvider({ children }: {
    children: ReactNode;
}): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=AuthProvider.d.ts.map