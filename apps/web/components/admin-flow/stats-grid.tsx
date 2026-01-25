import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type StatsGridItem = {
  label: string;
  value: number | string;
  description?: string;
};

type StatsGridProps = {
  stats: StatsGridItem[];
  cols?: 1 | 2 | 3 | 4 | 5 | 6;
};

type StatsGridColumnCount = NonNullable<StatsGridProps["cols"]>;

const responsiveColsMap: Record<StatsGridColumnCount, string> = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
  5: "md:grid-cols-5",
  6: "md:grid-cols-6",
};

export function StatsGrid({ stats, cols = 3 }: StatsGridProps) {
  const baseCols =
    cols === 1
      ? "grid-cols-1"
      : cols === 2
        ? "grid-cols-2"
        : cols === 3
          ? "grid-cols-3"
          : cols === 4
            ? "grid-cols-4"
            : cols === 5
              ? "grid-cols-5"
              : "grid-cols-6";
  const responsiveClass = responsiveColsMap[cols];

  return (
    <div className={`grid gap-3 ${baseCols} ${responsiveClass}`}>
      {stats.map((item) => (
        <Card key={item.label}>
          <CardHeader className="pb-2 space-y-1">
            <CardTitle className="text-sm font-semibold text-muted-foreground">{item.label}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-2xl font-semibold">{item.value}</p>
            {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
