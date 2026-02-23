import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

export type SelectOption = {
  value: string;
  label: string;
};

type FilterToolbarProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  selectOptions?: SelectOption[];
  selectedValue?: string;
  onSelectChange?: (value: string) => void;
  selectPlaceholder?: string;
  clearLabel?: string;
  onClear?: () => void;
  children?: ReactNode;
  searchPlaceholder?: string;
};

export function FilterToolbar({
  searchValue,
  onSearchChange,
  selectOptions,
  selectedValue,
  onSelectChange,
  selectPlaceholder = "Filter by type",
  clearLabel = "Clear",
  onClear,
  children,
  searchPlaceholder = "Search...",
}: FilterToolbarProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={searchPlaceholder}
              className="pl-9"
            />
          </div>

          {selectOptions && onSelectChange && (
            <Select value={selectedValue} onValueChange={onSelectChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={selectPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                {selectOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {children}

          {onClear && (
            <Button variant="ghost" onClick={onClear}>
              {clearLabel}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
