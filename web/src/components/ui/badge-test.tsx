import { Badge } from "./badge";

export default function BadgeTest() {
  return (
    <div className="space-y-4 p-4">
      <h1 className="text-2xl font-bold">Badge Component Test</h1>
      
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Status Variants</h2>
        <div className="flex gap-2 flex-wrap">
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="error">Error</Badge>
          <Badge variant="info">Info</Badge>
          <Badge variant="neutral">Neutral</Badge>
        </div>
      </div>
      
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Priority Variants</h2>
        <div className="flex gap-2 flex-wrap">
          <Badge variant="low">Low</Badge>
          <Badge variant="medium">Medium</Badge>
          <Badge variant="high">High</Badge>
          <Badge variant="critical">Critical</Badge>
        </div>
      </div>
      
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Sizes</h2>
        <div className="flex gap-2 items-center flex-wrap">
          <Badge size="sm">Small</Badge>
          <Badge size="md">Medium</Badge>
          <Badge size="lg">Large</Badge>
        </div>
      </div>
    </div>
  );
}