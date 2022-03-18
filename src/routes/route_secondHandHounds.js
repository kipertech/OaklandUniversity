import { Router } from "express";
import fetch from "node-fetch";
import moment from "moment";

// Modules
import {
    Abort,
    Success
} from '../utils';
import { runAnimalScheduler } from "../schedulers";

let secondHandHoundsRouter = Router();

secondHandHoundsRouter.post('/startSchedulers', (request, response) => {
    runAnimalScheduler()
        .then((message) => Success(response, message));
});

export { secondHandHoundsRouter };
