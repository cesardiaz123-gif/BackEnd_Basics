import express from "express";
import path, {dirname} from "path";
import { fileURLToPath } from "url";
import authRoutes from './routes/authRoutes.js'
import todoRoutes from './routes/toDoRoutes.js'

const app = express();
const PORT = process.env.PORT || 5000;

//obtener la direccion del archivo desde la URL del modulo 
const __filename = fileURLToPath(import.meta.url)
//obtener el nombre del directorio desde la ruta del archivo 
const __dirname = dirname(__filename)

//MIDDLEWARE
app.use(express.json())
//Da el HTML desde el directorio /public
//le dice a express de dar todos los archivos de la carpeta /public como estaticos
app.use(express.static(path.join(__dirname, '../public')))

//Para obtener el html desde el directorio de Public
app.get('/', (req,res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

//ROUTES
app.use('auth',authRoutes)
app.use('todos',todoRoutes)

app.listen(PORT, () => {
  console.log("Server is running live on PORT: " + PORT);
});
