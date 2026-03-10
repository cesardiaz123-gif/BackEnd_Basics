const express = require("express");
const app = express();

const PORT = 2323;

let data = ['andres']

//Middleware
app.use(express.json())

//HTTP verbs && Routes (Paths)
/* El metodo informa la naturaleza de la petición que se haga, y la ruta es el
subdirectorio (basicamente a donde se dirige la petición, el cuerpo de codigo 
que responde apropiadamente y esas rutas son lo que se le llama endpoints)
 */

// Type 1 - Website Endpoints
app.get("/", (req, res) => {
  res.send(`<body>
        <h1> DATA </h1>
        <p> ${JSON.stringify(data)}</p> 
        </body>`);
});

app.get("/dashboard", (req, res) => {
  res.send("<h1> Dashboard </h1>");
});

// Type 2 - API Endpoints
// CRUD -> Create(post), Read(Get), Update(put), Delete(delete)

app.get("/api/data", (req, res) => {
  res.send(data);
});

app.post('/api/data', (req,res) => {
    //when someone wants to create an user 
    const newData = req.body;
    console.log(newData);
    data.push(newData.name)
    res.sendStatus(201);
})

app.delete('/api/endpoint', (req,res) => {
    data.pop;
    console.log("we deleted the element at the end of the array");
    res.sendStatus(203);
})

app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});
