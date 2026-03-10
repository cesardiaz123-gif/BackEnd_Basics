import express from 'express'
import bcript from 'bcryptjs'
import jwt from 'jsonwebtoken'
import db from '../db.js'

const router = express.Router()

router.post('/register', (req,res) => {
    const {username,password} = req.body;

    //Encriptar la contraseña con bcript
    const hashedPassword = bcript.hashSync(password, 8)
    console.log(hashedPassword)

    //guardar el usuario y la contraseña hasheada a la base de datos
    try {
        const insertUser = db.prepare(`INSERT INTO users(username, password)
        VALUES (?,?)`)
        const result = insertUser.run(username,hashedPassword)
        
        //ahora que existe un usuario vamos a añadir un to do predeterminado 
        const defaultToDo = `Hello, add your first to do!`
        const insertToDo = db.prepare(`INSERT INTO todos (user_id, task)
        VALUES (?,?)`)
        insertToDo.run(result.lastInsertRowid, defaultToDo)

        //Crear el token 
        const token = jwt.sign({id: result.lastInsertRowid}, process.env.JWT_SECRET, {expiresIn: '24h'})
        res.json({token})

    } catch (err) {
        console.log(err)
        res.sendStatus(503)
    }

})

router.post('/login', (req,res) => {
    const {username,password} = req.body;
    
    try {

        const getUser = db.prepare('SELECT * FROM users WHERE username = ?')
        const user = getUser.get(username)

        // si no hay usuario asociado al nombre de usuario
        if(!user) {return res.status(404).send({message: 'user not found'})}

        // comparar la contraseña ingresada con la hasheada del usuario 
        const passwordIsValid = bcript.compareSync(password, user.password)
        if(!passwordIsValid) {return res.status(401).send({message: 'Invalid Password'})}

        //Si llega hasta aca la autenticación fue correcta, y se envia el token de usuario
        const token = jwt.sign({id: user.id }, process.env.JWT_SECRET, {expiresIn:'24h'})
        res.json({token})

    } catch (err) {
        console.log(err)
        res.sendStatus(503)
    }
    
})

export default router;