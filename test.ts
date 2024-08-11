import { Output, Husky, Router } from "husky-routing";

const server = new Husky({
    port: 8080
})

server.use(new Router("")
    .get("/", (req, res) => {
        return new Response("Hello World");
    })
);


server.start({callback: (port) => {
    Output.info(`Server started on port ${port}`);
}});