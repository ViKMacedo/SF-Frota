"use client";

import { useCallback, useState } from "react";

export type ToastType = "error" | "success" | "warning";

export interface ToastMessage {
    message: string;
    type: ToastType;
}

export function useToast() {
    const [toast, setToast] = useState<ToastMessage | null>(null);

    const showToast = useCallback(
        (message: string, type: ToastType = "error") => {
            setToast({ message, type });
            setTimeout(() => setToast(null), 3500);
        },
        [],
    );

    const clearToast = useCallback(() => setToast(null), []);

    return { toast, showToast, clearToast };
}
