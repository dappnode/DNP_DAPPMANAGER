import React, { useCallback, useEffect, useState } from "react";
import { Switch, Route, Redirect, useLocation } from "react-router-dom";
// Components
import NotificationsMain from "./components/NotificationsMain";
import { NonAdmin } from "./start-pages/NonAdmin";
import { NoConnection } from "start-pages/NoConnection";
import { Register } from "./start-pages/Register";
import { Login } from "./start-pages/Login";
import ErrorBoundary from "./components/ErrorBoundary";
import TopBar from "./components/navbar/TopBar";
import SideBar from "./components/navbar/SideBar";
import Loading from "components/Loading";
// Pages
import pages, { defaultPage } from "./pages";
// Redux
import { ToastContainer } from "react-toastify";
import Welcome from "components/welcome/Welcome";
import { fetchLoginStatus, LoginStatus } from "api/auth";
import { start as apiStart } from "api";

function MainApp({ refetchStatus }: { refetchStatus: () => Promise<void> }) {
  // App is the parent container of any other component.
  // If this re-renders, the whole app will. So DON'T RERENDER APP!
  // Check ONCE what is the status of the VPN, then display the page for nonAdmin
  // Even make the non-admin a route and fore a redirect

  // Scroll to top on pathname change
  const location = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    // Start API and Socket.io once user has logged in
    apiStart({
      onConnectionError: () => refetchStatus()
    });
  }, [refetchStatus]);

  return (
    <div className="body">
      {/* SideNav expands on big screens, while content-wrapper moves left */}
      <SideBar />
      <TopBar />
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

  const onFetchLoginStatus = useCallback(
    () =>
      fetchLoginStatus()
        .then(setLoginStatus)
        .catch(console.error),
    []
  );

  useEffect(() => {
    onFetchLoginStatus();
  }, [onFetchLoginStatus]);

  if (!loginStatus) {
    return <Loading steps={["Opening connection"]} />;
  }

  switch (loginStatus.status) {
    case "logged-in":
      return <MainApp refetchStatus={onFetchLoginStatus} />;
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
