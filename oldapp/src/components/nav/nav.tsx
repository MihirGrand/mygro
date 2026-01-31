"use client";
import { AdminTabs } from "./routeTabs";
import { useState } from "react";
import { FramerLayout } from "./framer-layout";
import { useTabs } from "./useTabs";
import { AppHeader } from "./header";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { Separator } from "../ui/separator";

export default function Nav() {
  // TODO : CHANGE TABS BASED ON USER ROLE
  const [currentTabs] = useState(AdminTabs);

  const [hookProps] = useState({
    tabs: currentTabs,
    initialTabId: "Triangle",
  });
  const framer = useTabs(hookProps);

  return (
    <main className="grid h-25 grid-rows-[1.5fr_1fr] border-b px-3">
      {/*header section*/}
      <header className="flex items-center justify-between px-5 font-mono">
        {/*TODO: ROLE BASED TITLEs*/}
        <div className="text-md flex items-center gap-3">
          <span>WeighPro</span>

          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbSeparator>/</BreadcrumbSeparator>
              <BreadcrumbItem className="text-md">
                <span>ADMIN</span>
              </BreadcrumbItem>
              <BreadcrumbSeparator>/</BreadcrumbSeparator>
              <BreadcrumbItem className="text-md">
                <span>USER101</span>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <AppHeader />
      </header>
      {/*navigation section*/}
      <nav>
        <FramerLayout.Tabs {...framer.tabProps} />
        {/*<FramerLayout.Content
          {...framer.contentProps}
          className="text-center rounded-3xl py-9 flex flex-col items-center"
        >
          {framer.selectedTab.label}
        </FramerLayout.Content>*/}
      </nav>
    </main>
  );
}
