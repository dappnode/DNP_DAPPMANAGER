import React, { useCallback, useEffect, useState } from "react";
import { Switch, Route, Redirect, useLocation } from "react-router-dom";
// Components
import NotificationsMain from "./components/NotificationsMain";
import { NoConnection } from "start-pages/NoConnection";
import { Register } from "./start-pages/Register";
import { Login } from "./start-pages/Login";
import ErrorBoundary from "./components/ErrorBoundary";
import { TopBar } from "./components/navbar/TopBar";
import SideBar from "./components/navbar/SideBar";
import Loading from "components/Loading";
// Pages
import pages, { defaultPage } from "./pages";
// Redux
import { ToastContainer } from "react-toastify";
import Welcome from "components/welcome/Welcome";
import { authApi, LoginStatus } from "api/auth";
import { startApi } from "api";

function MainApp({ username }: { username: string }) {
  // App is the parent container of any other component.
  // If this re-renders, the whole app will. So DON'T RERENDER APP!
  // Check ONCE what is the status of the VPN, then display the page for nonAdmin
  // Even make the non-admin a route and fore a redirect

  // Scroll to top on pathname change
  const location = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="body">
      {/* SideNav expands on big screens, while content-wrapper moves left */}
      <SideBar />
      <TopBar username={username} />
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
  );
}

export default function App() {
  const [loginStatus, setLoginStatus] = useState<LoginStatus>();
  // Handles the login, register and connecting logic. Nothing else will render
  // Until the app has been logged in
  const isLoggedIn = loginStatus?.status === "logged-in";

  const onFetchLoginStatus = useCallback(
    () =>
      authApi
        .fetchLoginStatus()
        .then(setLoginStatus)
        .catch(console.error),
    []
  );

  useEffect(() => {
    onFetchLoginStatus();
  }, [onFetchLoginStatus]);

  useEffect(() => {
    // Start API and Socket.io once user has logged in
    if (isLoggedIn)
      startApi({ refetchStatus: onFetchLoginStatus }).catch(e =>
        console.error("Error on startApi", e)
      );
  }, [isLoggedIn, onFetchLoginStatus]);

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
