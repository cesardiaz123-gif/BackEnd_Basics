# Arquitectura por Capas (Layered Architecture)

## El Problema Actual

En tu app, los archivos de rutas hacen TODO a la vez:
- Reciben la petición HTTP
- Ejecutan la lógica de negocio
- Hablan directamente con la base de datos
- Envían la respuesta

Ejemplo del problema en `authRoutes.js`:
```js
router.post('/register', async (req, res) => {
    // HTTP ✓
    const { username, password } = req.body;

    // Lógica de negocio ← NO debería estar aquí
    const hashedPassword = bcript.hashSync(password, 8);

    // Acceso a DB ← NO debería estar aquí
    const user = await prisma.user.create({ ... })

    // HTTP ✓
    res.json({ token })
})
```

---

## Las 3 Capas

```
┌─────────────────────────────────────────┐
│           HTTP Request/Response          │
└──────────────────┬──────────────────────┘
                   │
         ┌─────────▼─────────┐
         │   CAPA 1: Routes   │  → Solo define las URLs y llama al Controller
         └─────────┬──────────┘
                   │
       ┌───────────▼───────────┐
       │  CAPA 2: Controllers  │  → Extrae datos del req, llama al Service, envía res
       └───────────┬───────────┘
                   │
        ┌──────────▼──────────┐
        │  CAPA 3: Services   │  → Lógica de negocio (hashear, validar, crear token)
        └──────────┬──────────┘
                   │
      ┌────────────▼────────────┐
      │  CAPA 4: Repositories  │  → Solo habla con Prisma/Base de datos
      └────────────┬────────────┘
                   │
          ┌────────▼────────┐
          │    DATABASE     │  → Postgres via Prisma
          └─────────────────┘
```

---

## Estructura de Carpetas Propuesta

```
src/
  server.js                    ← solo configura Express y monta rutas

  routes/
    authRoutes.js              ← define POST /register, POST /login
    toDoRoutes.js              ← define GET /, POST /, PUT /:id, DELETE /:id

  controllers/
    authController.js          ← register(), login()
    todoController.js          ← getTodos(), createTodo(), updateTodo(), deleteTodo()

  services/
    authService.js             ← hashPassword(), createToken(), validatePassword()
    todoService.js             ← lógica de negocio de todos

  repositories/
    userRepository.js          ← createUser(), findUserByUsername()
    todoRepository.js          ← findTodosByUser(), createTodo(), updateTodo(), deleteTodo()

  middleware/
    authMiddleware.js          ← igual que está

  prismaClient.js              ← igual que está
```

---

## Flujo Completo: POST /auth/register

### PASO 1 — Route (`authRoutes.js`)
```js
// Solo define la URL y delega al controller
router.post('/register', authController.register)
```

### PASO 2 — Controller (`authController.js`)
```js
// Extrae datos del request, llama al service, envía la respuesta
async function register(req, res) {
    const { username, password } = req.body

    try {
        const token = await authService.register(username, password)
        res.json({ token })
    } catch (err) {
        res.sendStatus(503)
    }
}
```

### PASO 3 — Service (`authService.js`)
```js
// Contiene la lógica: hashear, crear user, crear todo por defecto, generar token
async function register(username, password) {
    const hashedPassword = bcrypt.hashSync(password, 8)

    const user = await userRepository.createUser(username, hashedPassword)

    await todoRepository.createTodo('Hello, add your first to do!', user.id)

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' })
    return token
}
```

### PASO 4 — Repository (`userRepository.js`)
```js
// Solo habla con Prisma, sin lógica de negocio
async function createUser(username, password) {
    return prisma.user.create({
        data: { username, password }
    })
}

async function findUserByUsername(username) {
    return prisma.user.findUnique({
        where: { username }
    })
}
```

---

## Flujo Completo: GET /todos

```
Request GET /todos
    │
    ▼
toDoRoutes.js
    router.get('/', authMiddleware, todoController.getTodos)
    │
    ▼
todoController.js → getTodos(req, res)
    const todos = await todoService.getTodosForUser(req.userId)
    res.json(todos)
    │
    ▼
todoService.js → getTodosForUser(userId)
    return todoRepository.findByUserId(userId)
    │
    ▼
todoRepository.js → findByUserId(userId)
    return prisma.todo.findMany({ where: { userId } })
    │
    ▼
DATABASE → devuelve los todos
    │
    ▼ (regresa por las capas)
res.json(todos) → cliente
```

---

## ¿Por Qué Separar Así?

| Capa        | Responsabilidad única          | Si cambia la DB...       | Si cambia la lógica...   |
|-------------|-------------------------------|--------------------------|--------------------------|
| Route       | URLs                          | No se toca               | No se toca               |
| Controller  | HTTP in/out                   | No se toca               | No se toca               |
| Service     | Lógica de negocio             | No se toca               | Solo se toca aquí        |
| Repository  | Acceso a datos                | Solo se toca aquí        | No se toca               |

- Si mañana cambias de **Prisma a otro ORM**, solo tocas los repositories.
- Si mañana cambias la **lógica de registro** (ej: enviar email de verificación), solo tocas el service.
- Si mañana cambias el **formato de respuesta HTTP**, solo tocas el controller.

---

## Resumen de Responsabilidades

- **Routes**: `router.get('/ruta', middleware, controller.metodo)` — nada más.
- **Controllers**: destructurar `req.body/req.params`, llamar `service`, enviar `res`. Sin Prisma, sin lógica.
- **Services**: toda la lógica de negocio. Sin `req`, sin `res`, sin Prisma directo.
- **Repositories**: todas las queries de Prisma. Sin lógica de negocio.
