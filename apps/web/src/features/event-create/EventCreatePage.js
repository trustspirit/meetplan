import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/firebase";
import { useAuth } from "@/features/auth/useAuth";
import { eventCreateSchema } from "@meetplan/shared";
import { BasicInfoForm } from "./BasicInfoForm";
import { MultiDateCalendar } from "./MultiDateCalendar";
import { TimePainter } from "./TimePainter";
import { useEventCreateState } from "./useEventCreateState";
import { buildSlotsFromPaintedCells } from "./generateSlots";
// 브라우저의 IANA TZ 자동 감지, 폴백 "Asia/Seoul"
const HOST_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Seoul";
export default function EventCreatePage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const { state, setTitle, setPeriod, toggleDate, setDailyRange, setCellPainted, } = useEventCreateState();
    const slots = buildSlotsFromPaintedCells(state.paintedCells, state.periodMinutes, HOST_TZ);
    const canCreate = state.title.trim().length > 0 && slots.length > 0 && !submitting;
    const handleCreate = async () => {
        if (!user)
            return;
        setError(null);
        setSubmitting(true);
        try {
            const payload = {
                title: state.title.trim(),
                periodMinutes: state.periodMinutes,
                timezone: HOST_TZ,
                slots,
            };
            const parsed = eventCreateSchema.safeParse(payload);
            if (!parsed.success) {
                setError(parsed.error.errors[0]?.message ?? "입력 오류");
                setSubmitting(false);
                return;
            }
            const doc = await addDoc(collection(db, "events"), {
                ...parsed.data,
                ownerUid: user.uid,
                status: "open",
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
            navigate(`/events/${doc.id}/result`);
        }
        catch (e) {
            setError(e instanceof Error ? e.message : "저장 실패");
            setSubmitting(false);
        }
    };
    return (_jsxs("div", { className: "max-w-6xl mx-auto px-6 py-8", children: [_jsxs("header", { className: "flex items-center justify-between pb-6 border-b", children: [_jsx(Link, { to: "/dashboard", className: "text-sm hover:underline", children: "\u2190 \uB3CC\uC544\uAC00\uAE30" }), _jsx("h1", { className: "font-semibold", children: "\uC0C8 \uC774\uBCA4\uD2B8 \uB9CC\uB4E4\uAE30" }), _jsx(Button, { onClick: handleCreate, disabled: !canCreate, children: submitting ? "저장 중…" : "생성" })] }), _jsxs("div", { className: "py-8 flex flex-col gap-10", children: [_jsx(BasicInfoForm, { title: state.title, onTitleChange: setTitle, periodMinutes: state.periodMinutes, onPeriodChange: setPeriod }), _jsxs("section", { className: "grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start", children: [_jsx(MultiDateCalendar, { selectedDates: state.selectedDates, onToggleDate: toggleDate }), _jsx(TimePainter, { selectedDates: state.selectedDates, dailyRange: state.dailyRange, periodMinutes: state.periodMinutes, paintedCells: state.paintedCells, onSetCell: setCellPainted, onChangeRange: setDailyRange })] })] }), _jsxs("footer", { className: "sticky bottom-0 -mx-6 px-6 py-3 bg-muted/80 backdrop-blur border-t flex items-center justify-between text-sm", children: [_jsxs("div", { children: ["\uC790\uB3D9 \uC0DD\uC131\uB420 \uC2AC\uB86F: ", _jsxs("span", { className: "font-semibold text-accent", children: [slots.length, "\uAC1C"] })] }), error && _jsx("div", { className: "text-destructive", children: error })] })] }));
}
