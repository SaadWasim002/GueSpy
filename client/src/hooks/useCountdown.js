import { useEffect, useState } from 'react';

const getReturnValues = (countDown) => {
    // Ensure we don't process negative values for display.
    const remainingTime = countDown > 0 ? countDown : 0;

    const minutes = Math.floor(remainingTime / (1000 * 60));
    const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);
    const isFinished = remainingTime <= 0;

    return { minutes, seconds, isFinished };
};

export const useCountdown = (targetTime) => {
    // Store the current time, which will be updated by the interval
    const [now, setNow] = useState(() => new Date().getTime());

    useEffect(() => {
        // If there's no target time, we don't need an interval.
        if (!targetTime) {
            return;
        }

        const interval = setInterval(() => {
            setNow(new Date().getTime());
        }, 1000);

        return () => clearInterval(interval);
    }, [targetTime]);

    // Calculate countdown directly from props and state in each render
    const countDownValue = targetTime ? targetTime - now : 0;

    return getReturnValues(countDownValue);
};