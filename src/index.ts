import { Husky } from "./server"
import { Router } from "./route"
import { JWT } from "./jwt"
import { Color, Output } from "./logging"

export default {
    Husky,
    Router,
    JWT,
    Console: {
        Output,
        Color
    }
}