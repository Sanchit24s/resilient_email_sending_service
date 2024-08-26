const express = require("express");
const router = express.Router();
const EmailService = require("../services/EmailService");
const MockEmailProvider = require("../providers/MockEmailProvider");

const primaryProvider = new MockEmailProvider("Primary", 0.3);
const fallbackProvider = new MockEmailProvider("Fallback", 0.1);
const emailService = new EmailService(primaryProvider, fallbackProvider);

router.post("/send", async (req, res) => {
    const { to, subject, body } = req.body;

    if (!to || !subject || !body) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        const result = await emailService.sendEmail(to, subject, body);
        res.json(result);
    } catch (error) {
        res
            .status(500)
            .json({ error: "Failed to send email", message: error.message });
    }
});

router.get("/status/:id", (req, res) => {
    const { id } = req.params;
    const status = emailService.getAttemptStatus(id);

    if (!status) {
        return res.status(404).json({ error: "Email attempt not found" });
    }

    res.json(status);
});

router.post("/process-queue", async (req, res) => {
    try {
        await emailService.processQueue();
        res.json({ message: "Queue processed successfully" });
    } catch (error) {
        res
            .status(500)
            .json({ error: "Failed to process queue", message: error.message });
    }
});

module.exports = router;
