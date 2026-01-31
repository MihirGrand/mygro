import React from "react";
import { Ticket, FlaskConical } from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  active: boolean;
  position: "top" | "bottom";
  adminOnly?: boolean;
}

export const NavItems = (pathname: string, isAdmin?: boolean): NavItem[] => {
  function isNavItemActive(nav: string) {
    return pathname === nav || pathname.startsWith(nav);
  }

  const navItems: NavItem[] = [
    {
      name: isAdmin ? "Assigned Tickets" : "My Tickets",
      href: isAdmin ? "/admin" : "/",
      icon: <Ticket size={20} />,
      active: isAdmin ? isNavItemActive("/admin") : pathname === "/",
      position: "top",
    },
    {
      name: "Testing Studio",
      href: "/testing-studio",
      icon: <FlaskConical size={20} />,
      active: isNavItemActive("/testing-studio"),
      position: "top",
    },
  ];

  return navItems;
};
