import React from "react";
import { GoHome } from "react-icons/go";
import {
  Phone,
  MapPin,
  MessageSquare,
  Image,
  Video,
  FolderOpen,
  Settings,
  Users,
  Mail,
  Package,
  Activity,
} from "lucide-react";
import { FaWhatsapp, FaInstagram, FaTelegram } from "react-icons/fa";

interface NestedNavItem {
  name: string;
  href: string;
  icon?: React.ReactNode;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  active: boolean;
  position: "top" | "bottom";
  nested?: NestedNavItem[];
}

export const NavItems = (userRole: string, pathname: string): NavItem[] => {
  function isNavItemActive(nav: string) {
    return pathname === nav || pathname.startsWith(nav);
  }

  const navItems: NavItem[] = [
    {
      name: "Dashboard",
      href: "/",
      icon: <GoHome size={20} />,
      active: pathname === "/",
      position: "top",
    },
    {
      name: "Calls",
      href: "/calls",
      icon: <Phone size={20} />,
      active: isNavItemActive("/calls"),
      position: "top",
    },
    {
      name: "SMS",
      href: "/sms",
      icon: <Mail size={20} />,
      active: isNavItemActive("/sms"),
      position: "top",
    },
    {
      name: "Contacts",
      href: "/contacts",
      icon: <Users size={20} />,
      active: isNavItemActive("/contacts"),
      position: "top",
    },
    {
      name: "Apps",
      href: "/apps",
      icon: <Package size={20} />,
      active: isNavItemActive("/apps"),
      position: "top",
    },
    {
      name: "Location",
      href: "/location",
      icon: <MapPin size={20} />,
      active: isNavItemActive("/location"),
      position: "top",
    },
    {
      name: "Messaging",
      href: "/messaging",
      icon: <MessageSquare size={20} />,
      active: isNavItemActive("/messaging"),
      position: "top",
      nested: [
        {
          name: "WhatsApp",
          href: "/messaging/whatsapp",
          icon: <FaWhatsapp size={16} />,
        },
        {
          name: "Instagram",
          href: "/messaging/instagram",
          icon: <FaInstagram size={16} />,
        },
        {
          name: "Telegram",
          href: "/messaging/telegram",
          icon: <FaTelegram size={16} />,
        },
      ],
    },
    {
      name: "Pictures",
      href: "/pictures",
      icon: <Image size={20} />,
      active: isNavItemActive("/pictures"),
      position: "top",
    },
    {
      name: "Live Control",
      href: "/live",
      icon: <Video size={20} />,
      active: isNavItemActive("/live"),
      position: "top",
    },
    {
      name: "Results",
      href: "/results",
      icon: <Activity size={20} />,
      active: isNavItemActive("/results"),
      position: "top",
    },
    {
      name: "File Explorer",
      href: "/files",
      icon: <FolderOpen size={20} />,
      active: isNavItemActive("/files"),
      position: "top",
    },
    {
      name: "Settings",
      href: "/settings",
      icon: <Settings size={20} />,
      active: isNavItemActive("/settings"),
      position: "bottom",
    },
  ];

  return navItems;
};
