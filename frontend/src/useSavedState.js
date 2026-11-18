import { useEffect, useState } from "react";

function readSaved(key, initialValue) {
    const saved = localStorage.getItem(key);
    return saved === null ? initialValue : JSON.parse(saved);
}

export function useSavedState(key, initialValue) {
    const [value, setValue] = useState(() => readSaved(key, initialValue));

    useEffect(() => {
        localStorage.setItem(key, JSON.stringify(value));
    }, [key, value]);

    return [value, setValue];
}
