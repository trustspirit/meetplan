import { useParams } from "react-router-dom";

export default function EventResultStub() {
  const { eventId } = useParams();
  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold">이벤트 {eventId} 결과</h1>
      <p className="text-muted-foreground mt-2">Plan 3에서 구현 예정</p>
    </div>
  );
}
