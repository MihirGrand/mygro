import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { JSX, useState } from "react";
import { Tab } from "./useTabs";
import classNames from "classnames";
import Link from "next/link";


type Props = {
  selectedTabIndex: number;
  tabs: Tab[];
  setSelectedTab: (input: [number, number]) => void;
};


export const Tabs = ({
  tabs,
  selectedTabIndex,
  setSelectedTab,
}: Props): JSX.Element => {
  const [hoveredTab, setHoveredTab] = useState<number | null>(null);

  return (
    <motion.nav
      className="flex shrink-0  items-center relative z-0 py-2"
      onHoverEnd={() => setHoveredTab(null)}
    >
      <LayoutGroup id="tabs">
        {tabs.map((item, i) => {
          return (
            <Link href={item.path} key={i} className="relative">
              <motion.button
                type="button"
                className={classNames(
                  "text-md relative  flex items-center h-8 px-4 text-sm text-slate-500 cursor-pointer select-none transition-colors",
                  {
                    "text-primary": hoveredTab === i || selectedTabIndex === i,
                  }
                )}
                onHoverStart={() => setHoveredTab(i)}
                onFocus={() => setHoveredTab(i)}
                onClick={() => {
                  setSelectedTab([i, i > selectedTabIndex ? 1 : -1]);
                }}
              >
                <span className="z-20">{item.label}</span>

                {i === selectedTabIndex && (
                  <motion.div
                    transition={{
                      type: "tween",
                      ease: "easeOut",
                      duration: 0.25,
                    }}
                    layoutId="underline"
                    className="absolute z-10 h-0.5 left-0 right-0 -bottom-2 bg-primary"
                  />
                )}

                <AnimatePresence>
                  {i === hoveredTab && (
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 top-0 z-10 rounded-xs bg-secondary/80"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{
                        type: "tween",
                        ease: "easeOut",
                        duration: 0.25,
                      }}
                      layoutId="hover"
                    />
                  )}
                </AnimatePresence>
              </motion.button>
            </Link>
          );
        })}
      </LayoutGroup>
    </motion.nav>
  );
};

// const Content = ({
//   children,
//   className,
//   selectedTabIndex,
//   direction,
// }: {
//   direction: number;
//   selectedTabIndex: number;
//   children: ReactNode;
//   className?: string;
// }): JSX.Element => {
//   return (
//     <AnimatePresence exitBeforeEnter={false} custom={direction}>
//       <motion.div
//         key={selectedTabIndex}
//         variants={{
//           enter: (direction) => ({
//             opacity: 0,
//             x: direction > 0 ? 100 : -100,
//             scale: 0.8,
//           }),
//           center: { opacity: 1, x: 0, scale: 1, rotate: 0 },
//           exit: (direction) => ({
//             opacity: 0,
//             x: direction > 0 ? -100 : 100,
//             scale: 0.8,
//             position: "absolute",
//           }),
//         }}
//         transition={{ duration: 0.25 }}
//         initial={"enter"}
//         animate={"center"}
//         exit={"exit"}
//         custom={direction}
//         className={className}
//       >
//         {children}
//       </motion.div>
//     </AnimatePresence>
//   );
// };

export const FramerLayout = { Tabs };
