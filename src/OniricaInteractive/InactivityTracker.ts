import * as THREE from 'three';

interface InactiveEvent{
    inactive: { message: string };
    active: { message: string };

}
class InactivityTracker extends THREE.EventDispatcher<InactiveEvent> {

    private static instance: InactivityTracker;
    private inactivityTimeout: NodeJS.Timeout | undefined;
    private isUserActive: boolean;
    // private dispatcher = new THREE.EventDispatcher<InactiveEvent>();
    private constructor() {
        super()
        this.isUserActive = false
        // Track several user activity events
        window.addEventListener("mousemove", () => this.resetTimer());
        window.addEventListener("mousedown", () => this.resetTimer());
        window.addEventListener("keypress", () => this.resetTimer());
        window.addEventListener("scroll", () => this.resetTimer());
        window.addEventListener("touchmove", () => this.resetTimer());

        this.resetTimer();
    }
    

    static getInstance(): InactivityTracker {
        if (!InactivityTracker.instance) {
            InactivityTracker.instance = new InactivityTracker();
        }
        return InactivityTracker.instance;
    }

    private resetTimer(): void {
        clearTimeout(this.inactivityTimeout);
        this.isUserActive = true;
        this.dispatchEvent({ type: "active", message: 'active' });


        this.inactivityTimeout = setTimeout(() => {
            this.isUserActive = false;
            this.dispatchEvent({ type: "inactive", message: 'inactive' });

        }, 10 * 1000); // 10 seconds
    }


    public get userIsActive(): boolean {
        return this.isUserActive;
    }
}

export default InactivityTracker;