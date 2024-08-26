class TokenBucket {
    constructor(capacity, fillPerSecond) {
        this.capacity = capacity;
        this.tokens = capacity;
        this.lastFilled = Date.now();
        this.fillPerSecond = fillPerSecond;
    }

    take() {
        this.refill();
        if (this.tokens > 0) {
            this.tokens--;
            return true;
        }
        return false;
    }

    refill() {
        const now = Date.now();
        const timePassed = (now - this.lastFilled) / 1000;
        const refill = timePassed * this.fillPerSecond;
        this.tokens = Math.min(this.capacity, this.tokens + refill);
        this.lastFilled = now;
    }
}

module.exports = TokenBucket;
