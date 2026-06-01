"use client"

import { useEffect, useState } from "react"

type ResetPassParam = {
    access: string,
    refresh: string
}

export default function ChangePasswordWatcher(params: ResetPassParam) {

    const [counter, setCounter] = useState(3);
    useEffect(() => {

        const channel = new BroadcastChannel('auth');
        channel.postMessage({ event: 'passwordReset', access: params.access, refresh: params.refresh });

        // Countdown logic
        const interval = setInterval(() => {
            setCounter((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    window.close();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            clearInterval(interval);
            channel.close();
        };

        // storage base broadcast, use storage event listener
        //localStorage.setItem('passwordReset', JSON.stringify({ access, refresh }));
    }, [params]);

    return (
        <div className="flex flex-col h-screen items-center justify-center text-muted-foreground">
            <p className="text-sm">Processing password reset...</p>
            <p className="text-lg mt-1">
                Please return to the application. This tab will close in{" "}
                <span className="font-semibold text-muted-foreground">{counter}</span>.
            </p>
        </div>
    );
}