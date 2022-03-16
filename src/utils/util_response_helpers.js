export function Success(res, message, data, code = 200, pagination = {})
{
    res.status(code).send(Object.assign({ message, data }, pagination));
}

export function Abort(res, message, code = 500, errorData = null, extraData = null)
{
    res.status(code).send({
        message,
        error: errorData,
        extraData
    });
}
