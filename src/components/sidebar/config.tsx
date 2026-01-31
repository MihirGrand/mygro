import React from "react";
import { Ticket, FlaskConical } from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  active: boolean;
  position: "top" | "bottom";
}

export const NavItems = (pathname: string): NavItem[] => {
  function isNavItemActive(nav: string) {
    return pathname === nav || pathname.startsWith(nav);
  }

  const navItems: NavItem[] = [
    {
      name: "My Tickets",
      href: "/",
      icon: <Ticket size={20} />,
      active: pathname === "/",
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
