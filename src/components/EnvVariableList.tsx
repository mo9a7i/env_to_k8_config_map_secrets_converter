/** @jsxImportSource react */
import { Checkbox } from "@/components/ui/checkbox";

interface EnvLine {
  key: string;
  value: string;
  isSecret: boolean;
}

interface EnvVariableListProps {
  envLines: EnvLine[];
  onToggleSecret: (index: number) => void;
}

export function EnvVariableList({ envLines, onToggleSecret }: EnvVariableListProps) {
  return (
    <div className="space-y-2">
      {envLines.map((line, index) => (
        <div key={index} className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded">
          <Checkbox
            checked={line.isSecret}
            onCheckedChange={() => onToggleSecret(index)}
            className="h-4 w-4"
          />
          <span className="font-mono text-sm">{line.key}</span>
          <span className="font-mono text-sm text-gray-500 ml-2">= {line.value}</span>
        </div>
      ))}
    </div>
  );
} 