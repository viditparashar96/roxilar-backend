import swaggerJSDoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.1.0",
    info: {
      title: "Transactions API ",
      version: "0.1.0",
      description: "Transactions api endpoints",
      license: {
        name: "MIT",
        url: "https://spdx.org/licenses/MIT.html",
      },
      contact: {
        name: "",
        url: "",
        email: "",
      },
    },
    servers: [
      {
        url: "https://roxiler-frontend-52q1.vercel.app/",
      },
    ],
  },
  apis: ["**/*.ts"],
};

export const specs = swaggerJSDoc(options);
