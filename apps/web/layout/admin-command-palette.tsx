 "use client";
 
import { useMemo, useState } from "react";
 import { useRouter } from "next/navigation";
 import { Search } from "lucide-react";
 import { Dialog, DialogContent } from "@/components/ui/dialog";
 import { Input } from "@/components/ui/input";
 import { cn } from "@/lib/utils";
 
 export type CommandItem = {
   label: string;
   description?: string;
   href: string;
   keywords?: string[];
 };
 
 interface AdminCommandPaletteProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   items: CommandItem[];
 }
 
 export function AdminCommandPalette({ open, onOpenChange, items }: AdminCommandPaletteProps) {
   const router = useRouter();
   const [query, setQuery] = useState("");
 
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setQuery("");
    }
    onOpenChange(nextOpen);
  };
 
   const filtered = useMemo(() => {
     const q = query.trim().toLowerCase();
     if (!q) return items;
     return items.filter((item) => {
       const haystack = [
         item.label,
         item.description,
         ...(item.keywords || []),
       ]
         .filter(Boolean)
         .join(" ")
         .toLowerCase();
       return haystack.includes(q);
     });
   }, [items, query]);
 
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
       <DialogContent className="p-0 overflow-hidden sm:max-w-xl" showCloseButton={false}>
         <div className="flex items-center gap-2 border-b px-4 py-3">
           <Search className="h-4 w-4 text-muted-foreground" />
           <Input
             autoFocus
             value={query}
             onChange={(event) => setQuery(event.target.value)}
             placeholder="Search inspections, clients, team..."
             className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
           />
         </div>
         <div className="max-h-[420px] overflow-y-auto p-2">
           {filtered.length === 0 ? (
             <div className="px-4 py-6 text-sm text-muted-foreground">
               No results found.
             </div>
           ) : (
             <div className="space-y-1">
               {filtered.map((item, index) => (
                 <button
                   key={`${item.href}-${index}`}
                   type="button"
                   onClick={() => {
                     onOpenChange(false);
                     router.push(item.href);
                   }}
                   className={cn(
                     "w-full rounded-sm px-3 py-2 text-left transition-colors hover:bg-muted",
                     "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                   )}
                 >
                   <div className="text-sm font-medium">{item.label}</div>
                   {item.description && (
                     <div className="text-xs text-muted-foreground">{item.description}</div>
                   )}
                 </button>
               ))}
             </div>
           )}
         </div>
       </DialogContent>
     </Dialog>
   );
 }
