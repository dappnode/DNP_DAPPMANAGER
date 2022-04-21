import React, { useCallback, useEffect, useState } from "react";
import { Switch, Route, Redirect, useLocation } from "react-router-dom";
import { startApi, apiAuth, LoginStatus } from "api";
// Components
import { ToastContainer } from "react-toastify";
import NotificationsMain from "./components/NotificationsMain";
import ErrorBoundary from "./components/ErrorBoundary";
import { TopBar } from "./components/navbar/TopBar";
import SideBar from "./components/navbar/SideBar";
import Loading from "components/Loading";
import Welcome from "components/welcome/Welcome";
// Pages
import { pages, defaultPage } from "./pages";
import { Login } from "./start-pages/Login";
import { Register } from "./start-pages/Register";
import { NoConnection } from "start-pages/NoConnection";

export const ThemeContext = React.createContext({
  theme: "light",
  toggleTheme: () => {}
});

function MainApp({ username }: { username: string }) {
  // App is the parent container of any other component.
  // If this re-renders, the whole app will. So DON'T RERENDER APP!
  // Check ONCE what is the status of the VPN and redirect to the login page.

  const [screenWidth, setScreenWidth] = useState(window.screen.width);
  const [sideBarCollapsed, setSideBar] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const toggleTheme = () => {
    setTheme(curr => (curr === "light" ? "dark" : "light"));
  };

  const toggleSideBar = () => {
    setSideBar(!sideBarCollapsed);
    const root = document.documentElement;
    root.style.setProperty(
      "--sidenav-collapsed-width",
      sideBarCollapsed ? "0" : "4.75rem"
    );
  };

  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [screenWidth]);

  // Scroll to top on pathname change
  const location = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div className="body" id={theme}>
        <SideBar screenWidth={screenWidth} />
        <TopBar
          username={username}
          screenWidth={screenWidth}
          toggleTheme={toggleTheme}
          toggleSideBar={toggleSideBar}
        />
        <div id="main">
          <ErrorBoundary>
            <NotificationsMain />
          </ErrorBoundary>

          <Switch>
            {Object.values(pages).map(({ RootComponent, rootPath }) => (
              <Route
                key={rootPath}
                path={rootPath}
                render={props => (
                  <ErrorBoundary>
                    <RootComponent {...props} />
                  </ErrorBoundary>
                )}
              />
            ))}
            {/* 404 routes redirect to dashboard or default page */}
            <Route path="*">
              <Redirect to={defaultPage.rootPath} />
            </Route>
          </Switch>
        </div>

        {/* Place here non-page components */}
        <Welcome />
        <ToastContainer />
      </div>
    </ThemeContext.Provider>
  );
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
    if (isLoggedIn)
      startApi(onFetchLoginStatus).catch(e =>
        console.error("Error on startApi", e)
      );
  }, [isLoggedIn, onFetchLoginStatus]);

  // Keep retrying if there is a loggin error, probably due a network error
  useEffect(() => {
    if (isError) {
      let timeToNext = 500;
      let timeout: unknown;
      const recursiveTimeout = () => {
        onFetchLoginStatus();
        timeout = setTimeout(recursiveTimeout, (timeToNext *= 2));
      };
      recursiveTimeout();
      return () => clearTimeout(timeout as number);
    }
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
