"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { InspectorShell } from "@/components/layout/inspector-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CheckCircle,
  Circle,
  PlayCircle,
  ChevronRight,
  Camera,
  AlertTriangle,
  Home,
  Zap,
  Droplets,
  Flame,
  Car,
  Sun,
  Bath,
  Bed,
  UtensilsCrossed,
  Sofa,
  WashingMachine,
  FileText,
  Plus,
  Search,
  PenLine,
} from "lucide-react";
import Link from "next/link";
import { getInspectionById, getRoomsForInspection, standardRoomTypes, mockInspector, Room, RoomStatus } from "@/lib/mock-data";
import { impactLight, impactMedium } from "@/services/haptics";
import { cn } from "@/lib/utils";

// Icon mapping for room types
const roomIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  exterior_front: Home,
  exterior_back: Home,
  exterior_left: Home,
  exterior_right: Home,
  roof: Sun,
  garage: Car,
  living_room: Sofa,
  kitchen: UtensilsCrossed,
  dining_room: UtensilsCrossed,
  master_bedroom: Bed,
  master_bathroom: Bath,
  bedroom_2: Bed,
  bedroom_3: Bed,
  bedroom_4: Bed,
  bathroom_2: Bath,
  bathroom_3: Bath,
  laundry: WashingMachine,
  attic: Home,
  hvac: Flame,
  electrical: Zap,
  plumbing: Droplets,
  water_heater: Flame,
};

function getRoomIcon(roomType: string) {
  return roomIcons[roomType] || Home;
}

function getStatusIcon(status: RoomStatus) {
  switch (status) {
    case "completed":
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case "in_progress":
      return <PlayCircle className="h-5 w-5 text-amber-500" />;
    default:
      return <Circle className="h-5 w-5 text-muted-foreground" />;
  }
}

function getStatusBadge(status: RoomStatus) {
  switch (status) {
    case "completed":
      return <Badge className="bg-green-500">Complete</Badge>;
    case "in_progress":
      return <Badge className="bg-amber-500">In Progress</Badge>;
    default:
      return null;
  }
}

export default function RoomsListPage() {
  const params = useParams();
  const router = useRouter();
  const inspectionId = params.id as string;
  const inspection = getInspectionById(inspectionId);
  const baseRooms = getRoomsForInspection(inspectionId);

  // State for dynamically added rooms
  const [addedRooms, setAddedRooms] = useState<Room[]>([]);
  const [showAddRoomDialog, setShowAddRoomDialog] = useState(false);
  const [roomSearch, setRoomSearch] = useState("");
  const [customRoomName, setCustomRoomName] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Combine base rooms with added rooms
  const rooms = useMemo(() => [...baseRooms, ...addedRooms], [baseRooms, addedRooms]);

  // Get room types already in inspection
  const existingRoomTypes = useMemo(() => rooms.map(r => r.type), [rooms]);

  // Available room types to add (not already in inspection)
  const availableRoomTypes = useMemo(() => {
    return standardRoomTypes.filter(rt => !existingRoomTypes.includes(rt.type));
  }, [existingRoomTypes]);

  // Filtered room types based on search
  const filteredRoomTypes = useMemo(() => {
    if (!roomSearch.trim()) return availableRoomTypes;
    const search = roomSearch.toLowerCase();
    return availableRoomTypes.filter(rt =>
      rt.name.toLowerCase().includes(search) || rt.type.toLowerCase().includes(search)
    );
  }, [availableRoomTypes, roomSearch]);

  if (!inspection) {
    return (
      <InspectorShell title="Not Found" user={mockInspector} showBackButton onBack={() => router.back()}>
        <div className="flex flex-col items-center justify-center p-12">
          <p className="text-lg font-medium">Inspection not found</p>
        </div>
      </InspectorShell>
    );
  }

  // Calculate overall progress
  const totalItems = rooms.reduce((sum, room) => sum + room.itemsTotal, 0);
  const completedItems = rooms.reduce((sum, room) => sum + room.itemsCompleted, 0);
  const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  const completedRooms = rooms.filter(r => r.status === "completed").length;
  const totalDefects = rooms.reduce((sum, room) => sum + room.defectsCount, 0);
  const totalPhotos = rooms.reduce((sum, room) => sum + room.photosCount, 0);

  // Group rooms by category
  const exteriorRooms = rooms.filter(r => r.type.startsWith("exterior") || r.type === "roof" || r.type === "garage");
  const interiorRooms = rooms.filter(r =>
    ["living_room", "kitchen", "dining_room", "laundry", "attic"].includes(r.type) ||
    r.type.startsWith("bedroom") || r.type.startsWith("bathroom") || r.type.startsWith("master") ||
    r.type === "custom"
  );
  const systemsRooms = rooms.filter(r => ["hvac", "electrical", "plumbing", "water_heater"].includes(r.type));

  const handleRoomTap = () => {
    impactLight();
  };

  const handleOpenAddRoom = () => {
    impactLight();
    setShowAddRoomDialog(true);
    setRoomSearch("");
    setCustomRoomName("");
    setShowCustomInput(false);
  };

  const handleAddRoom = (roomType: { type: string; name: string }) => {
    impactMedium();
    const newRoom: Room = {
      id: `room_${inspectionId}_custom_${Date.now()}`,
      inspectionId,
      name: roomType.name,
      type: roomType.type,
      order: rooms.length,
      status: "not_started",
      itemsTotal: 8, // Default items for custom rooms
      itemsCompleted: 0,
      defectsCount: 0,
      photosCount: 0,
    };
    setAddedRooms(prev => [...prev, newRoom]);
    setShowAddRoomDialog(false);
  };

  const handleAddCustomRoom = () => {
    if (!customRoomName.trim()) return;
    impactMedium();
    const newRoom: Room = {
      id: `room_${inspectionId}_custom_${Date.now()}`,
      inspectionId,
      name: customRoomName.trim(),
      type: "custom",
      order: rooms.length,
      status: "not_started",
      itemsTotal: 8,
      itemsCompleted: 0,
      defectsCount: 0,
      photosCount: 0,
    };
    setAddedRooms(prev => [...prev, newRoom]);
    setShowAddRoomDialog(false);
    setCustomRoomName("");
    setShowCustomInput(false);
  };

  return (
    <InspectorShell
      title="Inspection"
      user={mockInspector}
      showBackButton
      onBack={() => router.push(`/inspector/jobs/${inspectionId}`)}
      headerActions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleOpenAddRoom}>
            <Plus className="mr-2 h-4 w-4" />
            Add Room
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/inspector/jobs/${inspectionId}/review`}>
              <FileText className="mr-2 h-4 w-4" />
              Review
            </Link>
          </Button>
        </div>
      }
    >
      <div className="p-6 max-w-4xl space-y-6">
        {/* Progress Summary */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Overall Progress</p>
                <p className="text-2xl font-semibold">{progressPercent}%</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Rooms</p>
                <p className="text-lg font-medium">{completedRooms}/{rooms.length}</p>
              </div>
            </div>
            <Progress value={progressPercent} className="h-2" />
            <div className="flex items-center gap-6 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-muted-foreground" />
                <span>{totalPhotos} photos</span>
              </div>
              {totalDefects > 0 && (
                <div className="flex items-center gap-2 text-amber-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span>{totalDefects} defects</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Property Address */}
        <div className="text-center py-2">
          <p className="text-sm text-muted-foreground">Inspecting</p>
          <p className="font-medium">{inspection.property.address}</p>
        </div>

        {/* Room Lists by Category */}
        <div className="space-y-6">
          <RoomSection
            title="Exterior & Structure"
            rooms={exteriorRooms}
            inspectionId={inspectionId}
            onTap={handleRoomTap}
          />
          <RoomSection
            title="Interior Rooms"
            rooms={interiorRooms}
            inspectionId={inspectionId}
            onTap={handleRoomTap}
          />
          <RoomSection
            title="Systems"
            rooms={systemsRooms}
            inspectionId={inspectionId}
            onTap={handleRoomTap}
          />
        </div>

        {/* Complete Inspection Button */}
        {progressPercent >= 80 && (
          <div className="sticky bottom-0 pt-4 pb-4 bg-gradient-to-t from-background via-background to-transparent">
            <Button size="lg" className="w-full h-14 text-lg" asChild>
              <Link href={`/inspector/jobs/${inspectionId}/review`}>
                <CheckCircle className="mr-2 h-5 w-5" />
                Review & Complete
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* Add Room Dialog */}
      <Dialog open={showAddRoomDialog} onOpenChange={setShowAddRoomDialog}>
        <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Add Room</DialogTitle>
            <DialogDescription>
              Select a room type or create a custom room
            </DialogDescription>
          </DialogHeader>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search rooms..."
              value={roomSearch}
              onChange={(e) => setRoomSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Room Type List */}
          <div className="flex-1 overflow-y-auto -mx-6 px-6 space-y-2">
            {filteredRoomTypes.map((roomType) => {
              const Icon = roomIcons[roomType.type] || Home;
              return (
                <button
                  key={roomType.type}
                  onClick={() => handleAddRoom(roomType)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-muted hover:border-primary/50 transition-colors text-left"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <span className="font-medium">{roomType.name}</span>
                </button>
              );
            })}

            {filteredRoomTypes.length === 0 && !showCustomInput && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No matching room types found</p>
              </div>
            )}
          </div>

          {/* Custom Room Input */}
          {showCustomInput ? (
            <div className="space-y-3 pt-3 border-t">
              <Input
                placeholder="Enter custom room name..."
                value={customRoomName}
                onChange={(e) => setCustomRoomName(e.target.value)}
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowCustomInput(false);
                    setCustomRoomName("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleAddCustomRoom}
                  disabled={!customRoomName.trim()}
                >
                  Add Room
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full mt-2"
              onClick={() => {
                impactLight();
                setShowCustomInput(true);
              }}
            >
              <PenLine className="mr-2 h-4 w-4" />
              Create Custom Room
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </InspectorShell>
  );
}

function RoomSection({
  title,
  rooms,
  inspectionId,
  onTap,
}: {
  title: string;
  rooms: Room[];
  inspectionId: string;
  onTap: () => void;
}) {
  if (rooms.length === 0) return null;

  const completedCount = rooms.filter(r => r.status === "completed").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        <span className="text-sm text-muted-foreground">
          {completedCount}/{rooms.length}
        </span>
      </div>
      <div className="grid gap-3">
        {rooms.map((room) => {
          const Icon = getRoomIcon(room.type);
          const progress = room.itemsTotal > 0 ? Math.round((room.itemsCompleted / room.itemsTotal) * 100) : 0;

          return (
            <Link
              key={room.id}
              href={`/inspector/jobs/${inspectionId}/rooms/${room.id}`}
              onClick={onTap}
            >
              <Card className={cn(
                "transition-all hover:shadow-md hover:border-primary/50",
                room.status === "completed" && "bg-green-50 border-green-200",
                room.status === "in_progress" && "bg-amber-50 border-amber-200"
              )}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Status Icon */}
                    <div className="shrink-0">
                      {getStatusIcon(room.status)}
                    </div>

                    {/* Room Icon */}
                    <div className={cn(
                      "shrink-0 flex h-10 w-10 items-center justify-center rounded-lg",
                      room.status === "completed" ? "bg-green-100" : "bg-muted"
                    )}>
                      <Icon className={cn(
                        "h-5 w-5",
                        room.status === "completed" ? "text-green-600" : "text-muted-foreground"
                      )} />
                    </div>

                    {/* Room Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{room.name}</p>
                        {getStatusBadge(room.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{room.itemsCompleted}/{room.itemsTotal} items</span>
                        {room.photosCount > 0 && (
                          <span className="flex items-center gap-1">
                            <Camera className="h-3 w-3" />
                            {room.photosCount}
                          </span>
                        )}
                        {room.defectsCount > 0 && (
                          <span className="flex items-center gap-1 text-amber-600">
                            <AlertTriangle className="h-3 w-3" />
                            {room.defectsCount}
                          </span>
                        )}
                      </div>
                      {room.status !== "not_started" && (
                        <Progress value={progress} className="h-1 mt-2" />
                      )}
                    </div>

                    {/* Chevron */}
                    <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
