"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function HamburgerMenu() {
  const [open, setOpen] = useState(false);
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setOpen(false);
    window.location.href = "/";
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">☰</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Menu</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Link className="underline" href="/perfil" onClick={() => setOpen(false)}>
            Perfil
          </Link>
          <Link className="underline" href="/termos" onClick={() => setOpen(false)}>
            Termos de uso
          </Link>
          <Link className="underline" href="/privacidade" onClick={() => setOpen(false)}>
            Privacidade
          </Link>
          <Button variant="destructive" onClick={handleSignOut}>
            Exclusão de conta
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
