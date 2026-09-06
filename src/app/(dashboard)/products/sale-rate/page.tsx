'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SaleRateModal } from '@/components/products/sale-rate-modal';
import { Button } from '@/components/ui/button';
import { Tag, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function SaleRateRoutePage() {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      {!open && (
        <div className="text-center space-y-4">
          <p className="text-muted-foreground text-sm">Sale Rate window is closed.</p>
          <div className="flex items-center gap-3 justify-center">
            <Button onClick={() => setOpen(true)} className="gap-2">
              <Tag className="w-4 h-4" /> Reopen Sale Rate
            </Button>
            <Link href="/products">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Back to Products
              </Button>
            </Link>
          </div>
        </div>
      )}

      <SaleRateModal
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) {
            router.push("/products");
          }
        }}
      />
    </div>
  );
}
