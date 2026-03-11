import express from 'express'
//import db from '../db.js'
import prisma from '../prismaClient.js'

const router = express.Router()

router.get('/', async (req,res) => {

    const todos = prisma.todos.findMany({
        where:{
            userId:req.userId
        }
    })

    res.status(200).json(todos)

})

router.post('/', async (req,res) => {

    const {task} = req.body;

    const todo = await prisma.todos.create({
        data:{
            task,
            userId:req.userId
        }
    })

    res.json({todo})
})

router.put('/:id', async (req,res) => {

    const {completed} = req.body
    const {id} = req.params

    const updatedTodo = await prisma.todo.update({
        where:{
            id:parseInt(id),
            userId: req.userId
        },
        data:{
            completed: !!completed
        }

    })

    res.json(updatedTodo)
})

router.delete('/:id', async  (req,res) => {
    
    const {id} = req.params
    const userId = req.userId

    await prisma.todo.delete({
        where:{
            id:parseInt(id),
            userId
        }
    })
    
    res.send({message: 'todo Deleted'})
    
})

export default router;