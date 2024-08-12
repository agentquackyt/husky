//import { Output, Husky, Router } from "husky-routing";/
import { Output, Husky, Router, JWT } from "./src/index";

const server = new Husky({
    port: 8080
})

JWT.setSecret("AGUAaQBuAHMAegB3AGUAaQBkAHIAZQBpADIAMwA0ADEAMgAzAHoAMQBoADIAaQB1AGUAegBoAGcAMQB1AGkAMgBlAHQANABnAHoAMQ==");

server.use(new Router("")
    .get("/", (req) => {
        return new Response("Hello World");
    })
    .get("/hello/:name", (req, params) => {
        let token = JWT.sign({name: params.name, time: Date.now(), sub: "test"});

        return new Response(`Hello ${params.name}: ${token}`);
    })
);


server.start({callback: (port) => {
    Output.info(`Server started on port ${port}`);
}});