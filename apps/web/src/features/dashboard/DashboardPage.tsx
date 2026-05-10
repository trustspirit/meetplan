import { Link } from "react-router-dom";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileHeader } from "@/components/ui/MobileHeader";
import { useAuth } from "@/features/auth/useAuth";
import { useMyEvents } from "./useMyEvents";
import { EventList } from "./EventList";
import { EmptyDashboard } from "./EmptyDashboard";

export default function DashboardPage() {
  const { user, signOutUser } = useAuth();
  const events = useMyEvents();

  return (
    <div>
      {/* 모바일 앱바 */}
      <MobileHeader
        logo
        menuItems={[
          {
            icon: <LogOut size={14} />,
            label: "로그아웃",
            onClick: signOutUser,
          },
        ]}
        actions={
          <span className="text-[11px] text-white/50 max-w-[110px] truncate">
            {user?.email}
          </span>
        }
      />

      {/* 데스크탑 헤더 */}
      <div className="hidden sm:block max-w-3xl mx-auto px-6 pt-10">
        <header className="flex items-center justify-between mb-10">
          <h1 className="text-xl font-semibold">MeetPlan</h1>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={signOutUser}>로그아웃</Button>
          </div>
        </header>
      </div>

      {/* 컨텐츠 */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-0">
        {events === null ? (
          <div className="text-muted-foreground py-24 text-center">로딩 중…</div>
        ) : events.length === 0 ? (
          <EmptyDashboard />
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">내 이벤트</h2>
              <Link to="/events/new">
                <Button>+ 새 이벤트</Button>
              </Link>
            </div>
            <EventList events={events} />
          </>
        )}
      </div>
    </div>
  );
}
