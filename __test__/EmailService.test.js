// __tests__/EmailService.test.js

const EmailService = require("../services/EmailService");
const MockEmailProvider = require("../providers/MockEmailProvider");

jest.mock("../utils/Logger"); // Mock the Logger to prevent console.error in tests

describe("EmailService", () => {
    let emailService;
    let primaryProvider;
    let fallbackProvider;

    beforeEach(() => {
        primaryProvider = new MockEmailProvider("Primary", 0.3);
        fallbackProvider = new MockEmailProvider("Fallback", 0.1);
        emailService = new EmailService(primaryProvider, fallbackProvider);
    });

    test("should send email successfully", async () => {
        primaryProvider.failureRate = 0; // Ensure success
        const result = await emailService.sendEmail(
            "test@example.com",
            "Test Subject",
            "Test Body"
        );
        expect(result.success).toBe(true);
        expect(result.id).toBeDefined();
    });

    test("should respect rate limiting", async () => {
        primaryProvider.failureRate = 0; // Ensure success
        // Send emails up to the rate limit
        for (let i = 0; i < emailService.RATE_LIMIT; i++) {
            await emailService.sendEmail(
                "test@example.com",
                "Test Subject",
                "Test Body"
            );
        }

        // The next email should be queued
        const result = await emailService.sendEmail(
            "test@example.com",
            "Test Subject",
            "Test Body"
        );
        expect(result.success).toBe(false);
        expect(result.message).toBe("Rate limit exceeded. Email queued.");
    });

    test("should retry on failure and succeed with fallback", async () => {
        primaryProvider.failureRate = 1; // Always fail
        fallbackProvider.failureRate = 0; // Always succeed
        const result = await emailService.sendEmail(
            "test@example.com",
            "Test Subject",
            "Test Body"
        );
        expect(result.success).toBe(true);
    });

    test("should fail after all retries", async () => {
        primaryProvider.failureRate = 1; // Always fail
        fallbackProvider.failureRate = 1; // Always fail
        const result = await emailService.sendEmail(
            "test@example.com",
            "Test Subject",
            "Test Body"
        );
        expect(result.success).toBe(false);
    }, 15000);
});
