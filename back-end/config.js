module.exports = {
    PORT: process.env.PORT || 8000,
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.MONGO_URI,
    JWT_SECRET: process.env.JWT_SECRET || "test",
    JWT_EXPIRY: process.env.JWT_EXPIRY || "7d"
};
