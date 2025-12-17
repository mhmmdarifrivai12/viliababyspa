import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

// Daftar area di Lampung
const LAMPUNG_AREAS = [
  // Kota
  { value: "bandar-lampung", label: "Kota Bandar Lampung", group: "Kota" },
  { value: "metro", label: "Kota Metro", group: "Kota" },
  // Kabupaten
  { value: "lampung-selatan", label: "Lampung Selatan", group: "Kabupaten" },
  { value: "lampung-tengah", label: "Lampung Tengah", group: "Kabupaten" },
  { value: "lampung-utara", label: "Lampung Utara", group: "Kabupaten" },
  { value: "lampung-barat", label: "Lampung Barat", group: "Kabupaten" },
  { value: "lampung-timur", label: "Lampung Timur", group: "Kabupaten" },
  { value: "tanggamus", label: "Tanggamus", group: "Kabupaten" },
  { value: "tulang-bawang", label: "Tulang Bawang", group: "Kabupaten" },
  { value: "tulang-bawang-barat", label: "Tulang Bawang Barat", group: "Kabupaten" },
  { value: "pesawaran", label: "Pesawaran", group: "Kabupaten" },
  { value: "pringsewu", label: "Pringsewu", group: "Kabupaten" },
  { value: "mesuji", label: "Mesuji", group: "Kabupaten" },
  { value: "way-kanan", label: "Way Kanan", group: "Kabupaten" },
  { value: "pesisir-barat", label: "Pesisir Barat", group: "Kabupaten" },
  // Kecamatan Bandar Lampung
  { value: "sukarame", label: "Kec. Sukarame", group: "Kecamatan Bandar Lampung" },
  { value: "sukabumi", label: "Kec. Sukabumi", group: "Kecamatan Bandar Lampung" },
  { value: "tanjung-karang-barat", label: "Kec. Tanjung Karang Barat", group: "Kecamatan Bandar Lampung" },
  { value: "tanjung-karang-pusat", label: "Kec. Tanjung Karang Pusat", group: "Kecamatan Bandar Lampung" },
  { value: "tanjung-karang-timur", label: "Kec. Tanjung Karang Timur", group: "Kecamatan Bandar Lampung" },
  { value: "teluk-betung-barat", label: "Kec. Teluk Betung Barat", group: "Kecamatan Bandar Lampung" },
  { value: "teluk-betung-selatan", label: "Kec. Teluk Betung Selatan", group: "Kecamatan Bandar Lampung" },
  { value: "teluk-betung-timur", label: "Kec. Teluk Betung Timur", group: "Kecamatan Bandar Lampung" },
  { value: "teluk-betung-utara", label: "Kec. Teluk Betung Utara", group: "Kecamatan Bandar Lampung" },
  { value: "panjang", label: "Kec. Panjang", group: "Kecamatan Bandar Lampung" },
  { value: "kedaton", label: "Kec. Kedaton", group: "Kecamatan Bandar Lampung" },
  { value: "rajabasa", label: "Kec. Rajabasa", group: "Kecamatan Bandar Lampung" },
  { value: "tanjung-senang", label: "Kec. Tanjung Senang", group: "Kecamatan Bandar Lampung" },
  { value: "labuhan-ratu", label: "Kec. Labuhan Ratu", group: "Kecamatan Bandar Lampung" },
  { value: "way-halim", label: "Kec. Way Halim", group: "Kecamatan Bandar Lampung" },
  { value: "langkapura", label: "Kec. Langkapura", group: "Kecamatan Bandar Lampung" },
  { value: "enggal", label: "Kec. Enggal", group: "Kecamatan Bandar Lampung" },
  { value: "kemiling", label: "Kec. Kemiling", group: "Kecamatan Bandar Lampung" },
  { value: "bumi-waras", label: "Kec. Bumi Waras", group: "Kecamatan Bandar Lampung" },
  { value: "kedamaian", label: "Kec. Kedamaian", group: "Kecamatan Bandar Lampung" },
];

interface MultiSelectAreasProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

export function MultiSelectAreas({
  value,
  onChange,
  placeholder = "Pilih area layanan...",
}: MultiSelectAreasProps) {
  const [open, setOpen] = React.useState(false);

  const selectedLabels = value
    .map((v) => LAMPUNG_AREAS.find((area) => area.value === v)?.label || v)
    .filter(Boolean);

  const groupedAreas = LAMPUNG_AREAS.reduce((acc, area) => {
    if (!acc[area.group]) {
      acc[area.group] = [];
    }
    acc[area.group].push(area);
    return acc;
  }, {} as Record<string, typeof LAMPUNG_AREAS>);

  const handleSelect = (selectedValue: string) => {
    if (value.includes(selectedValue)) {
      onChange(value.filter((v) => v !== selectedValue));
    } else {
      onChange([...value, selectedValue]);
    }
  };

  const handleRemove = (valueToRemove: string) => {
    onChange(value.filter((v) => v !== valueToRemove));
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-auto min-h-10"
          >
            <span className="text-muted-foreground font-normal">
              {value.length > 0
                ? `${value.length} area dipilih`
                : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0 bg-popover z-50" align="start">
          <Command>
            <CommandInput placeholder="Cari area..." />
            <CommandList className="max-h-64">
              <CommandEmpty>Area tidak ditemukan.</CommandEmpty>
              {Object.entries(groupedAreas).map(([group, areas]) => (
                <CommandGroup key={group} heading={group}>
                  {areas.map((area) => (
                    <CommandItem
                      key={area.value}
                      value={area.label}
                      onSelect={() => handleSelect(area.value)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value.includes(area.value)
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      {area.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {value.map((v) => {
            const area = LAMPUNG_AREAS.find((a) => a.value === v);
            return (
              <Badge
                key={v}
                variant="secondary"
                className="text-xs"
              >
                {area?.label || v}
                <button
                  type="button"
                  className="ml-1 hover:text-destructive"
                  onClick={() => handleRemove(v)}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Helper untuk convert antara array dan string comma-separated
export function areasToString(areas: string[]): string {
  return areas
    .map((v) => LAMPUNG_AREAS.find((a) => a.value === v)?.label || v)
    .join(", ");
}

export function stringToAreas(str: string): string[] {
  if (!str) return [];
  const labels = str.split(",").map((s) => s.trim());
  return labels.map((label) => {
    const area = LAMPUNG_AREAS.find((a) => a.label === label);
    return area?.value || label;
  });
}
