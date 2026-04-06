"use client";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { SWRProvider } from "./swr-provider";
import { ThemeProvider } from "./theme-provider";
import { DeviceProvider } from "./device-provider";
import { AuthProvider } from "./auth-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SWRProvider>
      <ThemeProvider>
        <DeviceProvider>
          <AuthProvider>
            {children}
            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar
              closeOnClick
              pauseOnHover
              theme="light"
              toastClassName="!rounded-xl !text-sm !font-sans !shadow-md"
            />
          </AuthProvider>
        </DeviceProvider>
      </ThemeProvider>
    </SWRProvider>
  );
}
