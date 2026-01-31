'use client';

import { Shield } from 'lucide-react';
import React from 'react';
import { cn } from '~/lib/utils';

const SideNavLoader = () => {
  return (
    <div>
      <div
        className={cn(
          'w-[270px]',
          'bg-card hidden h-screen transform border-r transition-all duration-300 ease-in-out sm:flex'
        )}>
        <aside className="flex h-full w-full columns-1 flex-col overflow-x-hidden px-4">
          <div className="relative mt-4 pb-2">
            <div className="my-4 mb-6 flex items-center justify-center">
              <div className="flex items-center space-x-2">
                <h1 className="text-primary text-2xl font-black">
                  <Shield size={32} />
                </h1>
                <h1 className="text-primary text-2xl font-black">ANDROSPLOIT</h1>
              </div>
            </div>
            <div className="mt-16 flex flex-col gap-y-4">
              <div className="bg-muted h-10 w-full animate-pulse rounded-lg"></div>
              <div className="bg-muted h-8 w-full animate-pulse rounded-lg"></div>
              <div className="bg-muted h-12 w-full animate-pulse rounded-lg"></div>
              <div className="bg-muted h-9 w-full animate-pulse rounded-lg"></div>
              <div className="bg-muted h-10 w-full animate-pulse rounded-lg"></div>
              <div className="bg-muted h-7 w-full animate-pulse rounded-lg"></div>
              <div className="bg-muted h-11 w-full animate-pulse rounded-lg"></div>
              <div className="bg-muted h-8 w-full animate-pulse rounded-lg"></div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default SideNavLoader;
