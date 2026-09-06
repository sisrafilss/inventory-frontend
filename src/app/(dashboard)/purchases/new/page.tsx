'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PurchaseModal } from '@/components/purchases/purchase-modal';
import { Button } from '@/components/ui/button';
import { ShoppingCart, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewPurchasePage() {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      {!open && (
        <div className="text-center space-y-4">
          <p className="text-muted-foreground text-sm">Purchase window is closed.</p>
          <div className="flex items-center gap-3 justify-center">
            <Button onClick={() => setOpen(true)} className="gap-2">
              <ShoppingCart className="w-4 h-4" /> Reopen Purchase
            </Button>
            <Link href="/purchases">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Back to Purchases
              </Button>
            </Link>
          </div>
        </div>
      )}

      <PurchaseModal
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) {
            router.push("/purchases");
          }
        }}
      />
    </div>
  );
}
