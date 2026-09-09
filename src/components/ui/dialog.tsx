'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
  draggable?: boolean;
  closeOnBackdropClick?: boolean;
  zIndex?: string;
}

export function Dialog({
  open,
  onOpenChange,
  children,
  className,
  draggable = false,
  closeOnBackdropClick = true,
  zIndex = 'z-50',
}: DialogProps) {
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);
  const dragRef = React.useRef({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
  });
  const cardRef = React.useRef<HTMLDivElement>(null);

  // Reset position to center when dialog is opened
  React.useEffect(() => {
    if (open) {
      setPosition({ x: 0, y: 0 });
      setIsDragging(false);
    }
  }, [open]);

  if (!open) return null;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggable || e.button !== 0) return;

    const target = e.target as HTMLElement;
    // Do not drag when interacting with clickable/form elements
    if (
      target.closest('button') ||
      target.closest('input') ||
      target.closest('textarea') ||
      target.closest('select') ||
      target.closest('a') ||
      target.closest('[data-no-drag]')
    ) {
      return;
    }

    // If a designated drag handle exists, require dragging from it
    const hasHandle = cardRef.current?.querySelector('[data-drag-handle]');
    if (hasHandle && !target.closest('[data-drag-handle]')) {
      return;
    }

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y,
    };
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragRef.current.startX;
    const deltaY = e.clientY - dragRef.current.startY;

    const newX = dragRef.current.initialX + deltaX;
    const newY = dragRef.current.initialY + deltaY;

    if (typeof window !== 'undefined') {
      const screenW = window.innerWidth;
      const screenH = window.innerHeight;
      const minX = -(screenW / 2 - 80);
      const maxX = screenW / 2 - 80;
      const minY = -(screenH / 2 - 40);
      const maxY = screenH / 2 - 60;

      setPosition({
        x: Math.max(minX, Math.min(maxX, newX)),
        y: Math.max(minY, Math.min(maxY, newY)),
      });
    } else {
      setPosition({ x: newX, y: newY });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  return (
    <div className={cn('fixed inset-0 flex items-center justify-center p-2 sm:p-4 overflow-hidden pointer-events-none', zIndex)}>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity animate-in fade-in pointer-events-auto"
        onClick={() => {
          if (closeOnBackdropClick) {
            onOpenChange(false);
          }
        }}
      />
      {/* Modal Card */}
      <div
        ref={cardRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          transform: draggable ? `translate3d(${position.x}px, ${position.y}px, 0)` : undefined,
          transition: isDragging ? 'none' : undefined,
        }}
        className={cn(
          'relative z-50 w-full max-w-lg rounded-xl bg-card p-4 sm:p-6 shadow-lg animate-in fade-in zoom-in-95 max-h-[95vh] overflow-y-auto pointer-events-auto',
          isDragging && 'select-none',
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function DialogHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left mb-4', className)} {...props}>{children}</div>;
}

export function DialogTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn('text-lg font-semibold leading-none tracking-tight', className)} {...props}>{children}</h2>;
}

export function DialogDescription({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-muted-foreground mt-1', className)} {...props}>{children}</p>;
}

export function DialogFooter({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2 mt-6', className)} {...props}>{children}</div>;
}

