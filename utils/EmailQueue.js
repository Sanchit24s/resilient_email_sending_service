class EmailQueue {
    constructor() {
        this.queue = [];
    }

    enqueue(attempt) {
        this.queue.push(attempt);
    }

    dequeue() {
        return this.queue.shift();
    }

    isEmpty() {
        return this.queue.length === 0;
    }
}

module.exports = EmailQueue;