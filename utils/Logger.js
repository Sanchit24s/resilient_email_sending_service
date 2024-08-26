class Logger {
    static log(message) {
        console.log(`[${new Date().toISOString()}] ${message}`);
    }

    static error(message, error) {
        console.error(`[${new Date().toISOString()}] ERROR: ${message}`, error);
    }
}

module.exports = Logger;