import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
const PERIOD_PRESETS = [15, 30, 45, 60];
export function BasicInfoForm({ title, onTitleChange, periodMinutes, onPeriodChange }) {
    return (_jsxs("section", { className: "flex flex-col gap-5", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "ev-title", children: "\uC774\uBCA4\uD2B8 \uC774\uB984" }), _jsx(Input, { id: "ev-title", className: "mt-2", placeholder: "\uC608: 2\uBD84\uAE30 1:1 \uBBF8\uD305", value: title, onChange: (e) => onTitleChange(e.target.value) })] }), _jsxs("div", { children: [_jsx(Label, { children: "\uBBF8\uD305 \uAE38\uC774" }), _jsx("div", { className: "mt-2 flex gap-2", children: PERIOD_PRESETS.map((p) => {
                            const on = p === periodMinutes;
                            return (_jsxs("button", { type: "button", onClick: () => onPeriodChange(p), className: "px-4 py-2 rounded-md text-sm border transition-colors " +
                                    (on
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "bg-background border-border hover:bg-muted"), children: [p, "\uBD84"] }, p));
                        }) })] })] }));
}
