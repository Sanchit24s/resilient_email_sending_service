class CircuitBreaker {
    constructor(threshold = 5, timeout = 30000) {
        this.failures = 0;
        this.lastFailureTime = 0;
        this.state = "CLOSED";
        this.threshold = threshold;
        this.timeout = timeout;
    }

    async execute(action) {
        if (this.state === "OPEN") {
            if (Date.now() - this.lastFailureTime > this.timeout) {
                this.state = "HALF_OPEN";
            } else {
                throw new Error("Circuit is OPEN");
            }
        }

        try {
            const result = await action();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure();
            throw error;
        }
    }

    onSuccess() {
        this.failures = 0;
        this.state = "CLOSED";
    }

    onFailure() {
        this.failures++;
        this.lastFailureTime = Date.now();
        if (this.failures >= this.threshold) {
            this.state = "OPEN";
        }
    }
}

module.exports = CircuitBreaker;
