class MockEmailProvider {
    constructor(name, failureRate = 0.2) {
        this.name = name;
        this.failureRate = failureRate;
    }

    async sendEmail(to, subject, body) {
        await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate network delay
        if (Math.random() < this.failureRate) {
            throw new Error(`${this.name} failed to send email`);
        }
        return true;
    }
}

module.exports = MockEmailProvider;
