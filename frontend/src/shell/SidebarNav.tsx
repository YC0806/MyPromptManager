import { Link } from "react-router-dom";
import classNames from "classnames";

type NavItem = {
  to: string;
  label: string;
  icon: string;
};

const NAV_ITEMS: NavItem[] = [
  { to: "/prompts", label: "Prompts", icon: "💬" },
  { to: "/templates", label: "Templates", icon: "📋" },
  { to: "/tags", label: "Tags", icon: "🏷️" },
  { to: "/activity", label: "Activity", icon: "📊" }
];

interface SidebarNavProps {
  currentPath: string;
}

export const SidebarNav = ({ currentPath }: SidebarNavProps) => {
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="sidebar__logo">✨</span>
        <span>Prompt Manager</span>
      </div>
      <nav>
        <ul className="sidebar__list">
          {NAV_ITEMS.map((item) => {
            const isActive = currentPath.startsWith(item.to);
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={classNames("sidebar__link", {
                    "sidebar__link--active": isActive
                  })}
                >
                  <span style={{ marginRight: "0.75rem", fontSize: "1.2rem" }}>
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div style={{
        marginTop: "auto",
        padding: "1rem",
        borderTop: "1px solid rgba(255, 255, 255, 0.1)",
        fontSize: "0.8rem",
        opacity: 0.7
      }}>
        <div>v1.0.0</div>
        <div style={{ marginTop: "0.25rem" }}>Made with ❤️</div>
      </div>
    </aside>
  );
};
