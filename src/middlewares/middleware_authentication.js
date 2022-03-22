import { Abort } from "../utils";

export function sloppyAuthenticate(request, response, next)
{
    // Sloppy authentication
    let token = request.header('x-auth-token');
    if (!token)
    {
        Abort(response, 'Token is required');
    }
    else
    {
        if (token !== process.env.TOKEN)
        {
            Abort(response, 'Invalid token');
        }
        else next();
    }
}
