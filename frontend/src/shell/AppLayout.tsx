import { Outlet, useLocation } from "react-router-dom";

import { SidebarNav } from "./SidebarNav";
import { TopBar } from "./TopBar";

export const AppLayout = () => {
  const location = useLocation();

  return (
    <div className="app-shell">
      <SidebarNav currentPath={location.pathname} />
      <div className="app-content">
        <TopBar />
        <main className="app-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
