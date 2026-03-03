import React, { useCallback, useEffect, useState } from "react";
import { Routes, Route, useLocation, useNavigate, Navigate } from "react-router-dom";
import { startApi, apiAuth, LoginStatus } from "api";
// Components
import ErrorBoundary from "./components/ErrorBoundary";
import Loading from "components/Loading";
// Legacy pages
import { pages } from "./pages";
import { Login } from "./start-pages/Login";
import { Register } from "./start-pages/Register";
import { NoConnection } from "start-pages/NoConnection";
// New pages
import { NewHomePage } from "./pages-new/home/HomePage";
import { AiLayout } from "./pages-new/ai/AiLayout";
// Layouts
import { LegacyStakingLayout } from "./layouts/LegacyStakingLayout";
// Types
import { AppContextIface, Theme } from "types";

export const AppContext = React.createContext<AppContextIface>({
  theme: "light",
  toggleTheme: () => {}
});

const useLocalStorage = <T extends string>(
  key: string,
  initialValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      // Assert that either the item or initialValue is of type T
      return (item as T) || initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  useEffect(() => {
    window.localStorage.setItem(key, storedValue);
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
};

function MainApp({ username }: { username: string }) {
  // App is the parent container of any other component.
  // If this re-renders, the whole app will. So DON'T RERENDER APP!
  // Check ONCE what is the status of the VPN and redirect to the login page.

  const [screenWidth, setScreenWidth] = useState(window.innerWidth);
  const [theme, setTheme] = useLocalStorage<Theme>("theme", "light");

  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Scroll to top on pathname change
  const screenLocation = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [screenLocation.pathname]);

  const appContext: AppContextIface = {
    theme,
    toggleTheme: () => setTheme((curr: Theme) => (curr === "light" ? "dark" : "light"))
  };

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    html.classList.remove("light", "dark");
    body.classList.remove("light", "dark");

    html.classList.add(theme);
    body.classList.add(theme);
  }, [theme]);

  return (
    <AppContext.Provider value={appContext}>
      <div className="body" id={theme}>
        <Routes>
          {/* New UI routes — Tailwind + shadcn, no legacy chrome */}
          <Route
            path="/"
            element={
              <ErrorBoundary>
                <NewHomePage />
              </ErrorBoundary>
            }
          />
          <Route
            path="/ai/*"
            element={
              <ErrorBoundary>
                <AiLayout />
              </ErrorBoundary>
            }
          />

          {/* Legacy routes — Bootstrap + SCSS, with sidebar/topbar/legacy chrome */}
          <Route
            path="/staking"
            element={<LegacyStakingLayout screenWidth={screenWidth} username={username} appContext={appContext} />}
          >
            {Object.values(pages).map(({ RootComponent, rootPath }) => (
              <Route
                key={rootPath}
                path={rootPath}
                element={
                  <ErrorBoundary>
                    <RootComponent />
                  </ErrorBoundary>
                }
              />
            ))}
            {/* Default: redirect /staking to /staking/dashboard */}
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>

          {/* 404 routes redirect to home */}
          <Route path="*" element={<DefaultRedirect />} />
        </Routes>
      </div>
    </AppContext.Provider>
  );
}

function DefaultRedirect() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Catch-all: redirect unknown routes to the new home page
    if (location.pathname !== "/") {
      navigate("/", { replace: true });
    }
  }, [location, navigate]);

  return null;
}

export default function App() {
  const [loginStatus, setLoginStatus] = useState<LoginStatus>();
  // Handles the login, register and connecting logic. Nothing else will render
  // Until the app has been logged in
  const isLoggedIn = loginStatus?.status === "logged-in";
  const isError = loginStatus?.status === "error";

  const onFetchLoginStatus = useCallback(async () => {
    try {
      setLoginStatus(await apiAuth.fetchLoginStatus());
    } catch (e) {
      console.error("Error on fetchLoginStatus", e);
    }
  }, []);

  useEffect(() => {
    onFetchLoginStatus();
  }, [onFetchLoginStatus]);

  // Start API and Socket.io once user has logged in
  useEffect(() => {
    if (isLoggedIn) startApi(onFetchLoginStatus).catch((e) => console.error("Error on startApi", e));
  }, [isLoggedIn, onFetchLoginStatus]);

  // Keep retrying if there is a loggin error, probably due a network error
  useEffect(() => {
    if (!isError) return;

    let timeToNext = 500;
    let timeout: unknown;
    const recursiveTimeout = () => {
      onFetchLoginStatus();
      timeout = setTimeout(recursiveTimeout, (timeToNext *= 2));
    };
    recursiveTimeout();
    return () => clearTimeout(timeout as number);
  }, [isError, onFetchLoginStatus]);

  if (!loginStatus) {
    return <Loading steps={["Opening connection"]} />;
  }

  switch (loginStatus.status) {
    case "logged-in":
      return <MainApp username={loginStatus.username} />;
    case "not-logged-in":
      return <Login refetchStatus={onFetchLoginStatus} />;
    case "not-registered":
      return <Register refetchStatus={onFetchLoginStatus} />;
    case "error":
      return <NoConnection error={loginStatus.error} />;
    default:
      return <NoConnection />;
  }
}
