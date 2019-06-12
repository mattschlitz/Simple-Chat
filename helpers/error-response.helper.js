class ErrorResponse {
    constructor(error, statusCode = 500){
        this.error = error;
        this.statusCode = statusCode;
    }
}
module.exports = ErrorResponse;