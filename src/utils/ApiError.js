class ApiError extends error{
    constructor(
        statusCode,
        message = "Something went wrong",
        errors = [],
        stack = ""){
            super(message)
            this.statusCode = statusCode
            this.data = null
            this.message = message
            this.success = false;
            this.errors = ßerrors

            if(statck){
                this.stack= statck
            }else{
                Error.captureStackTrace(this,this.constructor)
            }
        }
}

export {ApiError}