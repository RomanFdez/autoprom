import { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

const PULL_THRESHOLD = 80;

export default function PullToRefresh({ onRefresh, children }) {
    const [startY, setStartY] = useState(0);
    const [pullDistance, setPullDistance] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const contentRef = useRef(null);

    const handleTouchStart = (e) => {
        if (window.scrollY === 0) {
            setStartY(e.touches[0].clientY);
        }
    };

    const handleTouchMove = (e) => {
        if (startY === 0 || window.scrollY > 0) return;

        const currentY = e.touches[0].clientY;
        const diff = currentY - startY;

        if (diff > 0) {
            // Add resistance
            const dampedDiff = Math.min(diff * 0.5, PULL_THRESHOLD * 1.5);
            setPullDistance(dampedDiff);
            // Prevent default browser refresh/scroll behavior only if we are effectively pulling
            if (e.cancelable && diff > 10) {
                // e.preventDefault(); // CAREFUL: This might block vertical scrolling if not at strict top
            }
        }
    };

    const handleTouchEnd = async () => {
        if (startY === 0) return;

        if (pullDistance > PULL_THRESHOLD) {
            setIsRefreshing(true);
            setPullDistance(PULL_THRESHOLD); // Snap to threshold
            try {
                await onRefresh();
            } finally {
                setIsRefreshing(false);
                setPullDistance(0);
            }
        } else {
            setPullDistance(0);
        }
        setStartY(0);
    };

    return (
        <div
            ref={contentRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ minHeight: '100%' }}
        >
            <div
                style={{
                    height: pullDistance,
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: isRefreshing ? 'height 0.2s' : 'height 0.2s ease-out',
                }}
            >
                <div style={{
                    transform: `rotate(${pullDistance * 3}deg)`,
                    transition: 'transform 0.2s',
                    opacity: Math.min(pullDistance / PULL_THRESHOLD, 1)
                }}>
                    <Loader2 className={isRefreshing ? "animate-spin" : ""} size={24} color="#666" />
                </div>
            </div>
            <div style={{
                transform: `translateY(${0}px)`,
                transition: 'transform 0.2s'
            }}>
                {children}
            </div>

            <style>{`
                .animate-spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
