// src/services/EmailService.js

const { v4: uuidv4 } = require("uuid");
const CircuitBreaker = require("../utils/CircuitBreaker");
const Logger = require("../utils/Logger");
const EmailQueue = require("../utils/EmailQueue");

class EmailService {
    constructor(primaryProvider, fallbackProvider) {
        this.primaryProvider = primaryProvider;
        this.fallbackProvider = fallbackProvider;
        this.attempts = new Map();
        this.MAX_RETRIES = 3;
        this.INITIAL_BACKOFF = 1000; // 1 second
        this.sendCount = 0;
        this.lastResetTime = Date.now();
        this.RATE_LIMIT = 10; // emails per minute
        this.RATE_LIMIT_WINDOW = 60000; // 1 minute in milliseconds
        this.circuitBreaker = new CircuitBreaker();
        this.queue = new EmailQueue();
    }

    async sendEmail(to, subject, body) {
        if (!this.checkRateLimit()) {
            Logger.log("Rate limit exceeded. Queueing email.");
            const attempt = this.createEmailAttempt(to, subject, body);
            this.queue.enqueue(attempt);
            return { success: false, message: "Rate limit exceeded. Email queued." };
        }

        const id = uuidv4();
        const attempt = {
            id,
            to,
            subject,
            body,
            attempts: 0,
            status: "pending",
            lastAttempt: new Date(),
        };

        this.attempts.set(id, attempt);

        const success = await this.trySendEmail(attempt);
        return { success, id: attempt.id };
    }

    checkRateLimit() {
        const now = Date.now();
        if (now - this.lastResetTime > this.RATE_LIMIT_WINDOW) {
            this.sendCount = 0;
            this.lastResetTime = now;
        }

        if (this.sendCount >= this.RATE_LIMIT) {
            return false;
        }

        this.sendCount++;
        return true;
    }

    async trySendEmail(attempt) {
        while (attempt.attempts < this.MAX_RETRIES) {
            attempt.attempts++;
            attempt.lastAttempt = new Date();

            try {
                const success = await this.sendWithProvider(
                    this.primaryProvider,
                    attempt
                );
                if (success) {
                    attempt.status = "success";
                    return true;
                }
            } catch (error) {
                Logger.error(`Attempt ${attempt.attempts} failed:`, error);

                if (attempt.attempts === this.MAX_RETRIES) {
                    // Try fallback provider on last attempt
                    try {
                        const success = await this.sendWithProvider(
                            this.fallbackProvider,
                            attempt
                        );
                        if (success) {
                            attempt.status = "success";
                            return true;
                        }
                    } catch (fallbackError) {
                        Logger.error("Fallback provider failed:", fallbackError);
                    }
                }
            }

            // Exponential backoff
            const backoff = this.INITIAL_BACKOFF * Math.pow(2, attempt.attempts - 1);
            await new Promise((resolve) => setTimeout(resolve, backoff));
        }

        attempt.status = "failed";
        return false;
    }

    async sendWithProvider(provider, attempt) {
        return this.circuitBreaker.execute(() =>
            provider.sendEmail(attempt.to, attempt.subject, attempt.body)
        );
    }

    getAttemptStatus(id) {
        return this.attempts.get(id);
    }

    createEmailAttempt(to, subject, body) {
        const id = uuidv4();
        return {
            id,
            to,
            subject,
            body,
            attempts: 0,
            status: "pending",
            lastAttempt: new Date(),
        };
    }

    async processQueue() {
        while (!this.queue.isEmpty()) {
            const attempt = this.queue.dequeue();
            if (attempt) {
                Logger.log(`Processing queued email: ${attempt.id}`);
                await this.trySendEmail(attempt);
            }
        }
    }
}

module.exports = EmailService;
