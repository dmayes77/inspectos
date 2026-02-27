 "use client";
 
 import { Bell, CheckCircle2, MessageSquare, CreditCard } from "lucide-react";
 import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
 import { Button } from "@/components/ui/button";
 
 const notifications = [
   {
     id: "notif-1",
     title: "Inspection completed",
     description: "123 Oak Street • Report ready for review",
     icon: CheckCircle2,
     time: "10m ago",
   },
   {
     id: "notif-2",
     title: "New client message",
     description: "Sarah Chen sent a booking question",
     icon: MessageSquare,
     time: "1h ago",
   },
   {
     id: "notif-3",
     title: "Payment received",
     description: "$425.00 from Martinez Inspection Group",
     icon: CreditCard,
     time: "3h ago",
   },
 ];
 
 interface AdminNotificationsProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
 }
 
 export function AdminNotifications({ open, onOpenChange }: AdminNotificationsProps) {
   return (
     <Sheet open={open} onOpenChange={onOpenChange}>
       <SheetContent side="right" className="w-full sm:max-w-sm">
         <SheetHeader>
           <SheetTitle>Notifications</SheetTitle>
         </SheetHeader>
         <div className="px-4 pb-4 space-y-4">
           {notifications.map((item) => {
             const Icon = item.icon;
             return (
               <div key={item.id} className="flex items-start gap-3 rounded-md border p-3">
                 <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                   <Icon className="h-4 w-4" />
                 </div>
                 <div className="flex-1">
                   <div className="text-sm font-medium">{item.title}</div>
                   <div className="text-xs text-muted-foreground">{item.description}</div>
                   <div className="mt-2 text-xs text-muted-foreground">{item.time}</div>
                 </div>
               </div>
             );
           })}
         </div>
         <div className="mt-auto border-t p-4">
           <Button variant="outline" className="w-full">
             View all notifications
           </Button>
         </div>
       </SheetContent>
     </Sheet>
   );
 }
