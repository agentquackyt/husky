# husky
Husky Routing is meant to provide an easy, fast and customisable way to implement routing with the JavaScript Runtime Bun. Get started by installing the libray using 'bun add husky-routing' or cloning the offical template. The libray is dependency free except for Bun Standard Libary

## Key Features

- Blazing Fast: Leverages Bun's native performance for lightning-fast routing.
- Easy to Use: Intuitive API for defining routes and handling requests.
- Highly Customizable: Full control over route matching, middleware, and error handling.
- Dependency-Free: Relies solely on the Bun Standard Library for maximum efficiency.

## Install

- Install: Use 'bun add husky-routing' to install the library.
- Clone Template: Alternatively, clone the official template for a pre-configured project.

**Example - Create a basic route**
```js
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
```

## Documentation

For detailed documentation, including advanced features and customization options, please refer to the official Husky Routing repository.

## Contribute

We welcome contributions! If you have any suggestions, bug reports, or feature requests, please open an issue or submit a pull request on the repository.

Let's build amazing Bun applications together!