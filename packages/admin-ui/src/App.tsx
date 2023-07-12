import React, { useCallback, useEffect, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { startApi, apiAuth, LoginStatus } from "api";
// Components
import NotificationsMain from "./components/NotificationsMain";
import ErrorBoundary from "./components/ErrorBoundary";
import Loading from "components/Loading";
import Welcome from "components/welcome/Welcome";
import SideBar from "components/sidebar/SideBar";
import { TopBar } from "components/topbar/TopBar";
import { ToastContainer } from "react-toastify";
// Pages
import { pages } from "./pages";
import { Login } from "./start-pages/Login";
import { Register } from "./start-pages/Register";
import { NoConnection } from "start-pages/NoConnection";
// Types
import { UsageMode } from "types";
import { createTheme, useTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

const ColorModeContext = React.createContext({ toggleColorMode: () => {} });

export const UsageContext = React.createContext({
  usage: "advanced",
  toggleUsage: () => {}
});

function MainApp({ username }: { username: string }) {
  // App is the parent container of any other component.
  // If this re-renders, the whole app will. So DON'T RERENDER APP!
  // Check ONCE what is the status of the VPN and redirect to the login page.

  const [screenWidth, setScreenWidth] = useState(window.screen.width);

  const theme = useTheme();
  const colorContext = React.useContext(ColorModeContext);
  const [mode, setMode] = React.useState<"light" | "dark">("light");
  const colorMode = React.useMemo(
    () => ({
      toggleColorMode: () => {
        setMode(prevMode => (prevMode === "light" ? "dark" : "light"));
      }
    }),
    []
  );
  const themeMemo = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode
        }
      }),
    [mode]
  );

  //const initialUsage = storedUsage === "advanced" ? "advanced" : "basic";
  const initialUsage = "advanced";

  const [usage, setUsage] = useState<UsageMode>(initialUsage);

  const toggleUsage = () => {
    setUsage(curr => (curr === "basic" ? "advanced" : "basic"));
  };

  useEffect(() => {
    localStorage.setItem("usage", usage);
  }, [usage]);

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

  /*const RedirectToDefault = () => {
    const navigate = useNavigate();
    useEffect(() => {
      navigate(defaultPage.rootPath);
    }, [navigate]);

    return null;
  };*/

  return (
    <ColorModeContext.Provider value={colorMode}>
      <UsageContext.Provider value={{ usage, toggleUsage }}>
        <div className="body">
          <SideBar screenWidth={screenWidth} />
          <TopBar username={username} toggleUsage={toggleUsage} />
          <div id="main">
            <ErrorBoundary>
              <NotificationsMain />
            </ErrorBoundary>
            <Routes>
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
              {/* 404 routes redirect to dashboard or default page */}
              {/*TODO: REGEX OF SUBPATHS */}
              {/*<Route path="*" element={<RedirectToDefault />} />*/}
            </Routes>
          </div>

          {/* Place here non-page components */}
          <Welcome />
          <ToastContainer />
        </div>
      </UsageContext.Provider>
    </ColorModeContext.Provider>
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
