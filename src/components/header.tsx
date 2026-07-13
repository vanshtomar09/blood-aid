"use client";

import { useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Bell, Search } from "lucide-react";
import { Input } from "./ui/input";
import { useSearch } from "@/context/search-context";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";

export default function Header() {
  const { setCommittedSearchQuery } = useSearch();
  const [localQuery, setLocalQuery] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  const handleSearch = () => {
    if (!localQuery.trim()) {
      toast({
        variant: "destructive",
        title: "Search is empty",
        description: "Please enter something to search for.",
      });
      return;
    }
    setCommittedSearchQuery(localQuery);
    router.push(`/search?q=${encodeURIComponent(localQuery)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
      <SidebarTrigger className="sm:hidden" />
      <div className="flex-1">
        <div className="relative ml-auto w-full max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search blood type, bank, city..."
            className="w-full rounded-lg bg-secondary pl-8"
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
      </div>
       <Button variant="ghost" size="icon">
        <Bell className="h-5 w-5" />
        <span className="sr-only">Notifications</span>
      </Button>
    </header>
  );
}
