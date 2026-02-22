"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Plus, GripVertical } from "lucide-react";

interface IncludesEditorProps {
  includes: string[];
  onChange: (includes: string[]) => void;
}

export function IncludesEditor({ includes, onChange }: IncludesEditorProps) {
  const [newItem, setNewItem] = useState("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleAdd = () => {
    if (newItem.trim()) {
      onChange([...includes, newItem.trim()]);
      setNewItem("");
    }
  };

  const handleRemove = (index: number) => {
    onChange(includes.filter((_, i) => i !== index));
  };

  const handleEdit = (index: number, value: string) => {
    const updated = [...includes];
    updated[index] = value;
    onChange(updated);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const items = [...includes];
    const draggedItem = items[draggedIndex];
    items.splice(draggedIndex, 1);
    items.splice(index, 0, draggedItem);

    onChange(items);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="space-y-3">
      <Label>What&apos;s Included</Label>

      {/* List of items */}
      <div className="space-y-2">
        {includes.map((item, index) => (
          <div
            key={index}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`flex items-center gap-2 p-2 border rounded-sm bg-background ${
              draggedIndex === index ? "opacity-50" : ""
            } cursor-move hover:bg-accent/50 transition-colors`}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input
              value={item}
              onChange={(e) => handleEdit(index, e.target.value)}
              className="flex-1 h-8 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => handleRemove(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* Add new item */}
      <div className="flex gap-2">
        <Input
          placeholder="Add an item (e.g., 'Detailed photo documentation')"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
        />
        <Button type="button" variant="outline" onClick={handleAdd} disabled={!newItem.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {includes.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No items yet. Add what&apos;s included in this service or package.
        </p>
      )}
    </div>
  );
}
