import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CalendarPlus } from "lucide-react";

export function EmptyDashboard() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24 gap-4">
      <CalendarPlus className="w-12 h-12 text-muted-foreground/40" />
      <h2 className="text-xl font-semibold">아직 이벤트가 없어요</h2>
      <p className="text-sm text-muted-foreground max-w-sm">
        가능한 시간을 공유하고 참가자들의 응답을 모아보세요.
      </p>
      <Link to="/events/new">
        <Button size="lg">+ 첫 이벤트 만들기</Button>
      </Link>
    </div>
  );
}
