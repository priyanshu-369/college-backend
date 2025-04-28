const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    const errors = err.errors || [];

    console.error("Error:", message); // Optional, if you still want to log in console

    res.status(statusCode).json({
        success: false,
        message,
        errors
    });
};

export default errorHandler;
