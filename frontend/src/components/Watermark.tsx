import React from 'react';

export function Watermark() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 pointer-events-none">
      <div className="bg-background/40 backdrop-blur-sm border-t border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-xs text-muted-foreground/70">
            <div className="text-center sm:text-left">
              <span className="font-medium">© {new Date().getFullYear()} BPL.com</span>
              <span className="mx-2">•</span>
              <span>All Rights Reserved</span>
            </div>
            <div className="text-center sm:text-right">
              <span>Designed & Developed by </span>
              <span className="font-semibold text-muted-foreground">Ajay Khatake</span>
              <span className="text-muted-foreground/60"> (ajay.k@bpl.in)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
