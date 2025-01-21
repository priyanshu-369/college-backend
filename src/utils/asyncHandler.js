

const  asyncHandler = (requestHandler) =>{
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((error) => next(error))
    }
}






export { asyncHandler }

/*

ek higer order function banaya hai jisme hum function pass karsakte hai aur jo function return kar sakta hai
cont asyncHandler = (fn) => async (req, res, next ) =>{
    try{
        await fn(req, res, next)

    }catch (error){
      res.satus(error.code || 500).json({succes:false, message: error.message})
    }

    }

*/ 