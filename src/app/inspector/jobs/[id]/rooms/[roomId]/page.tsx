"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { InspectorShell } from "@/components/layout/inspector-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle,
  Circle,
  AlertTriangle,
  Camera,
  ChevronRight,
  ChevronLeft,
  ThumbsUp,
  ThumbsDown,
  Minus,
  MinusCircle,
  MessageSquare,
  Save,
} from "lucide-react";
import {
  getInspectionById,
  getRoomById,
  getRoomsForInspection,
  getInspectionItemsForRoom,
  mockInspector,
  InspectionItem,
  ItemStatus,
} from "@/lib/mock-data";
import { impactLight, impactMedium } from "@/services/haptics";
import { cn } from "@/lib/utils";

// Status button configurations
const statusOptions: { status: ItemStatus; label: string; icon: React.ReactNode; color: string; bgColor: string }[] = [
  {
    status: "good",
    label: "Good",
    icon: <ThumbsUp className="h-4 w-4" />,
    color: "text-green-600",
    bgColor: "bg-green-100 hover:bg-green-200 border-green-300",
  },
  {
    status: "fair",
    label: "Fair",
    icon: <Minus className="h-4 w-4" />,
    color: "text-amber-600",
    bgColor: "bg-amber-100 hover:bg-amber-200 border-amber-300",
  },
  {
    status: "poor",
    label: "Poor",
    icon: <ThumbsDown className="h-4 w-4" />,
    color: "text-red-600",
    bgColor: "bg-red-100 hover:bg-red-200 border-red-300",
  },
  {
    status: "not_present",
    label: "N/P",
    icon: <MinusCircle className="h-4 w-4" />,
    color: "text-gray-600",
    bgColor: "bg-gray-100 hover:bg-gray-200 border-gray-300",
  },
];

function getStatusDisplay(status: ItemStatus) {
  const option = statusOptions.find(o => o.status === status);
  if (!option || status === "not_inspected") return null;
  return option;
}

export default function RoomInspectionPage() {
  const params = useParams();
  const router = useRouter();
  const inspectionId = params.id as string;
  const roomId = params.roomId as string;

  const inspection = getInspectionById(inspectionId);
  const room = getRoomById(inspectionId, roomId);
  const rooms = getRoomsForInspection(inspectionId);
  const baseItems = useMemo(() => room ? getInspectionItemsForRoom(room) : [], [room]);

  // Local state for item statuses and notes
  const [items, setItems] = useState<InspectionItem[]>(baseItems);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [itemNotes, setItemNotes] = useState<Record<string, string>>({});

  // Find adjacent rooms for navigation (must be before any returns)
  const currentIndex = rooms.findIndex(r => r.id === roomId);
  const prevRoom = currentIndex > 0 ? rooms[currentIndex - 1] : null;
  const nextRoom = currentIndex < rooms.length - 1 ? rooms[currentIndex + 1] : null;

  // Calculate progress
  const inspectedCount = items.filter(i => i.status !== "not_inspected").length;
  const progressPercent = items.length > 0 ? Math.round((inspectedCount / items.length) * 100) : 0;

  // Group items by category (useMemo must be before any returns)
  const groupedItems = useMemo(() => {
    const groups: Record<string, InspectionItem[]> = {};
    for (const item of items) {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    }
    return groups;
  }, [items]);

  if (!inspection || !room) {
    return (
      <InspectorShell title="Not Found" user={mockInspector} showBackButton onBack={() => router.back()}>
        <div className="flex flex-col items-center justify-center p-12">
          <p className="text-lg font-medium">Room not found</p>
          <Button variant="outline" className="mt-4" onClick={() => router.back()}>
            Go Back
          </Button>
        </div>
      </InspectorShell>
    );
  }

  const handleStatusChange = (itemId: string, newStatus: ItemStatus) => {
    impactLight();
    setItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, status: newStatus } : item
      )
    );
  };

  const handleItemTap = (itemId: string) => {
    impactLight();
    setExpandedItem(expandedItem === itemId ? null : itemId);
  };

  const handleNoteChange = (itemId: string, note: string) => {
    setItemNotes(prev => ({ ...prev, [itemId]: note }));
  };

  const handleNavigate = (direction: "prev" | "next") => {
    impactMedium();
    const targetRoom = direction === "prev" ? prevRoom : nextRoom;
    if (targetRoom) {
      router.push(`/jobs/${inspectionId}/rooms/${targetRoom.id}`);
    }
  };

  const handleAddDefect = (itemId: string) => {
    impactMedium();
    // TODO: Open defect creation modal
    console.log("Add defect for item:", itemId);
  };

  const handleTakePhoto = (itemId: string) => {
    impactMedium();
    // TODO: Open camera
    console.log("Take photo for item:", itemId);
  };

  return (
    <InspectorShell
      title={room.name}
      user={mockInspector}
      showBackButton
      onBack={() => router.push(`/jobs/${inspectionId}/rooms`)}
      headerActions={
        <Button variant="outline" size="sm" onClick={() => impactLight()}>
          <Save className="mr-2 h-4 w-4" />
          Save
        </Button>
      }
    >
      <div className="flex flex-col h-full">
        {/* Progress Bar - Fixed at top */}
        <div className="sticky top-0 z-10 bg-background border-b px-6 py-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                {inspectedCount} of {items.length} items inspected
              </span>
              <span className="text-sm text-muted-foreground">{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Quick Actions */}
            <div className="flex items-center gap-3">
              <Button variant="outline" className="flex-1" onClick={() => handleTakePhoto("")}>
                <Camera className="mr-2 h-4 w-4" />
                Add Room Photo
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => handleAddDefect("")}>
                <AlertTriangle className="mr-2 h-4 w-4" />
                Report Defect
              </Button>
            </div>

            {/* Inspection Items by Category */}
            {Object.entries(groupedItems).map(([category, categoryItems]) => (
              <Card key={category}>
                <CardHeader className="py-4">
                  <CardTitle className="text-base font-semibold flex items-center justify-between">
                    <span>{category}</span>
                    <Badge variant="outline" className="font-normal">
                      {categoryItems.filter(i => i.status !== "not_inspected").length}/{categoryItems.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {categoryItems.map((item) => {
                      const statusDisplay = getStatusDisplay(item.status);
                      const isExpanded = expandedItem === item.id;
                      const hasNote = itemNotes[item.id]?.trim();

                      return (
                        <div key={item.id} className="border-b last:border-b-0">
                          {/* Item Row */}
                          <div
                            className={cn(
                              "flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors",
                              isExpanded && "bg-muted/30"
                            )}
                            onClick={() => handleItemTap(item.id)}
                          >
                            {/* Status Indicator */}
                            <div className="shrink-0">
                              {statusDisplay ? (
                                <div className={cn("rounded-full p-1", statusDisplay.bgColor)}>
                                  <div className={statusDisplay.color}>{statusDisplay.icon}</div>
                                </div>
                              ) : (
                                <Circle className="h-6 w-6 text-muted-foreground" />
                              )}
                            </div>

                            {/* Item Name */}
                            <div className="flex-1 min-w-0">
                              <p className={cn(
                                "font-medium",
                                item.status !== "not_inspected" && "text-muted-foreground"
                              )}>
                                {item.name}
                              </p>
                              {hasNote && (
                                <p className="text-sm text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                                  <MessageSquare className="h-3 w-3" />
                                  {itemNotes[item.id]}
                                </p>
                              )}
                            </div>

                            {/* Quick Status Buttons (visible on row) */}
                            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                              {statusOptions.map((option) => (
                                <button
                                  key={option.status}
                                  onClick={() => handleStatusChange(item.id, option.status)}
                                  className={cn(
                                    "p-2 rounded-lg border transition-all",
                                    item.status === option.status
                                      ? option.bgColor
                                      : "bg-background hover:bg-muted border-transparent"
                                  )}
                                  title={option.label}
                                >
                                  <div className={item.status === option.status ? option.color : "text-muted-foreground"}>
                                    {option.icon}
                                  </div>
                                </button>
                              ))}
                            </div>

                            {/* Expand Chevron */}
                            <ChevronRight
                              className={cn(
                                "h-5 w-5 text-muted-foreground transition-transform",
                                isExpanded && "rotate-90"
                              )}
                            />
                          </div>

                          {/* Expanded Item Details */}
                          {isExpanded && (
                            <div className="px-4 pb-4 pt-2 bg-muted/20 border-t space-y-3">
                              {/* Notes Input */}
                              <div>
                                <label className="text-sm font-medium text-muted-foreground mb-1 block">
                                  Notes
                                </label>
                                <Textarea
                                  placeholder="Add notes about this item..."
                                  value={itemNotes[item.id] || ""}
                                  onChange={(e) => handleNoteChange(item.id, e.target.value)}
                                  className="resize-none"
                                  rows={2}
                                />
                              </div>

                              {/* Action Buttons */}
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1"
                                  onClick={() => handleTakePhoto(item.id)}
                                >
                                  <Camera className="mr-2 h-4 w-4" />
                                  Photo
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1"
                                  onClick={() => handleAddDefect(item.id)}
                                >
                                  <AlertTriangle className="mr-2 h-4 w-4" />
                                  Defect
                                </Button>
                              </div>

                              {/* Placeholder for photos */}
                              {/*
                              <div className="flex items-center gap-2 overflow-x-auto py-1">
                                <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                  <Image className="h-6 w-6 text-muted-foreground" />
                                </div>
                              </div>
                              */}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Bottom Spacer for Navigation */}
            <div className="h-24" />
          </div>
        </div>

        {/* Room Navigation - Fixed at bottom */}
        <div className="sticky bottom-0 border-t bg-background px-6 py-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <Button
              variant="outline"
              size="lg"
              className="flex-1 h-12"
              disabled={!prevRoom}
              onClick={() => handleNavigate("prev")}
            >
              <ChevronLeft className="mr-2 h-5 w-5" />
              {prevRoom?.name || "Previous"}
            </Button>

            {progressPercent === 100 ? (
              <Button
                size="lg"
                className="flex-1 h-12 bg-green-600 hover:bg-green-700"
                onClick={() => handleNavigate("next")}
                disabled={!nextRoom}
              >
                <CheckCircle className="mr-2 h-5 w-5" />
                {nextRoom ? `Next: ${nextRoom.name}` : "Complete Room"}
              </Button>
            ) : (
              <Button
                variant="outline"
                size="lg"
                className="flex-1 h-12"
                disabled={!nextRoom}
                onClick={() => handleNavigate("next")}
              >
                {nextRoom?.name || "Next"}
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </InspectorShell>
  );
}
