/**
 * Continuous Authentication - Behavioral Capture Utility (Tuned Version)
 * Implements calming periods, value smoothing, and reduced frequency.
 */

class BehaviorCapture {
    constructor(userId, endpoint = "http://localhost:5005/api/collect") {
        this.userId = userId;
        this.endpoint = endpoint;
        this.sessionStart = Date.now();
        this.data = {
            typing: [],
            mouse: [],
            scroll: [],
            startTime: Date.now()
        };
        this.mouseHistory = []; // For smoothing
        this.lastKeyTime = 0;
        this.interval = 10000; // Increased frequency for better reactivity, but we'll use high thresholds
    }

    init() {
        window.addEventListener('keydown', (e) => this.handleKey(e));
        window.addEventListener('mousemove', (e) => this.handleMouse(e));
        window.addEventListener('scroll', () => this.handleScroll());
        
        setInterval(() => this.flush(), this.interval);
    }

    handleKey(e) {
        // 1. ADD CALMING PERIOD: Ignore first 8 seconds after initialization
        if (Date.now() - this.sessionStart < 8000) return;

        const now = Date.now();
        if (this.lastKeyTime > 0) {
            const flightTime = now - this.lastKeyTime;
            this.data.typing.push(flightTime);
        }
        this.lastKeyTime = now;
    }

    handleMouse(e) {
        if (Date.now() - this.sessionStart < 8000) return;

        this.data.mouse.push({
            x: e.clientX,
            y: e.clientY,
            t: Date.now()
        });
        if (this.data.mouse.length > 500) this.data.mouse.shift();
    }

    handleScroll() {
        if (Date.now() - this.sessionStart < 8000) return;
        this.data.scroll.push(Date.now());
    }

    calculateFeatures() {
        // 2. SMOOTH THE VALUES: Moving average for mouse speed
        const rawMouseSpeed = this.calculateMouseSpeed();
        this.mouseHistory.push(rawMouseSpeed);
        if (this.mouseHistory.length > 5) this.mouseHistory.shift();
        
        const avgMouse = this.mouseHistory.reduce((a, b) => a + b, 0) / this.mouseHistory.length;

        const avgFlight = this.data.typing.length > 0 
            ? this.data.typing.reduce((a, b) => a + b, 0) / this.data.typing.length 
            : 200;

        return {
            avg_typing_speed: this.data.typing.length,
            flight_time: avgFlight,
            avg_mouse_speed: avgMouse, // Sending smoothed value
            scroll_frequency: this.data.scroll.length
        };
    }

    calculateMouseSpeed() {
        if (this.data.mouse.length < 2) return 0;
        let dist = 0;
        for (let i = 1; i < this.data.mouse.length; i++) {
            const dx = this.data.mouse[i].x - this.data.mouse[i-1].x;
            const dy = this.data.mouse[i].y - this.data.mouse[i-1].y;
            dist += Math.sqrt(dx*dx + dy*dy);
        }
        return dist / (this.data.mouse.length);
    }

    getDeviceInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            screenRes: `${window.screen.width}x${window.screen.height}`,
            language: navigator.language
        };
    }

    async flush() {
        // Ignore if no activity
        if (this.data.typing.length === 0 && this.data.mouse.length === 0) return;

        const payload = {
            user_id: this.userId,
            behavior: this.calculateFeatures(),
            device: this.getDeviceInfo(),
            timestamp: new Date().toISOString()
        };

        try {
            await fetch(this.endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            this.data = {
                typing: [],
                mouse: [],
                scroll: [],
                startTime: Date.now()
            };
        } catch (err) {
            console.error("Failed to send behavioral telemetry", err);
        }
    }
}

export default BehaviorCapture;
