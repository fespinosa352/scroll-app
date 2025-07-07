import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface TableData {
  id: string;
  primary: string;
  secondary?: string;
  status?: string;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "ghost";
  }>;
  badges?: Array<{
    text: string;
    variant?: "default" | "secondary" | "outline";
  }>;
  metadata?: Array<{
    label: string;
    value: string;
  }>;
}

interface ResponsiveTableProps {
  data: TableData[];
  title?: string;
}

const ResponsiveTable = ({ data, title }: ResponsiveTableProps) => {
  return (
    <div className="space-y-3">
      {title && (
        <h3 className="text-lg font-semibold text-slate-900 mb-4">{title}</h3>
      )}
      
      {/* Desktop Table View - hidden on mobile */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <tbody className="divide-y divide-slate-200">
            {data.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50">
                <td className="py-4 px-4">
                  <div>
                    <div className="font-medium text-slate-900">{row.primary}</div>
                    {row.secondary && (
                      <div className="text-sm text-slate-600">{row.secondary}</div>
                    )}
                  </div>
                </td>
                {row.status && (
                  <td className="py-4 px-4">
                    <Badge variant="outline">{row.status}</Badge>
                  </td>
                )}
                {row.badges && (
                  <td className="py-4 px-4">
                    <div className="flex flex-wrap gap-1">
                      {row.badges.map((badge, index) => (
                        <Badge key={index} variant={badge.variant || "secondary"}>
                          {badge.text}
                        </Badge>
                      ))}
                    </div>
                  </td>
                )}
                {row.actions && (
                  <td className="py-4 px-4">
                    <div className="flex gap-2">
                      {row.actions.map((action, index) => (
                        <Button
                          key={index}
                          size="sm"
                          variant={action.variant || "outline"}
                          onClick={action.onClick}
                        >
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Mobile Card View - visible only on mobile */}
      <div className="md:hidden space-y-3">
        {data.map((row) => (
          <Card key={row.id}>
            <CardContent className="p-4 space-y-3">
              <div>
                <div className="font-medium text-slate-900 text-base">{row.primary}</div>
                {row.secondary && (
                  <div className="text-sm text-slate-600 mt-1">{row.secondary}</div>
                )}
              </div>
              
              {row.metadata && (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {row.metadata.map((meta, index) => (
                    <div key={index}>
                      <span className="text-slate-500">{meta.label}:</span>
                      <span className="text-slate-900 ml-1">{meta.value}</span>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex flex-col gap-3">
                {row.status && (
                  <div>
                    <Badge variant="outline">{row.status}</Badge>
                  </div>
                )}
                
                {row.badges && (
                  <div className="flex flex-wrap gap-2">
                    {row.badges.map((badge, index) => (
                      <Badge key={index} variant={badge.variant || "secondary"}>
                        {badge.text}
                      </Badge>
                    ))}
                  </div>
                )}
                
                {row.actions && (
                  <div className="flex flex-wrap gap-2">
                    {row.actions.map((action, index) => (
                      <Button
                        key={index}
                        size="touch"
                        variant={action.variant || "outline"}
                        onClick={action.onClick}
                        className="flex-1 min-w-[120px]"
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ResponsiveTable;