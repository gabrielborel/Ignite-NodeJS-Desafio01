const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;

  const userAccountExists = users.some((user) => user.username === username)

  if (!userAccountExists) {
    return response.status(404).json({ error: 'User account not exists.' })
  }

  request.username = username
  next()
}

function getUser(username) {
  const [user] = users.filter((user) => user.username === username)

  return user
}

function verifyIfTodoExists(todos, id) {
  return todos.some((todo) => todo.id === id)
}

app.post('/users', (request, response) => {
  const { name, username } = request.body;

  const userAccountAlreadyExists = users.some((user) => user.username === username)

  if (userAccountAlreadyExists) {
    return response.status(400).json({ error: 'User account already exists.' })
  } else {
    const newUser = {
      id: uuidv4(),
      name,
      username,
      todos: []
    }

    users.push(newUser)
    return response.status(201).json(newUser)
  }
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { username } = request

  const user = getUser(username)

  return response.json(user.todos)
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { username } = request
  const { title, deadline } = request.body

  const user = getUser(username)
  const newTodo = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date()
  }

  user.todos.push(newTodo)

  return response.status(201).json(newTodo)
});

app.put('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { id } = request.params
  const { title, deadline } = request.body
  const { username } = request

  const user = getUser(username)
  const todoExists = verifyIfTodoExists(user.todos, id)

  if (!todoExists) {
    return response.status(404).json({
      error: 'Todo not exists.'
    })
  }

  const updatedTodos = user.todos.map((todo) => todo.id === id ? {
    ...todo,
    title,
    deadline: new Date(deadline),
  } : { ...todo })

  user.todos = updatedTodos

  return response.send(updatedTodos.filter((todo) => todo.id === id)[0])
});

app.patch('/todos/:id/done', checksExistsUserAccount, (request, response) => {
  const { id } = request.params
  const { username } = request

  const user = getUser(username)
  const todoExists = verifyIfTodoExists(user.todos, id)

  if (!todoExists) {
    return response.status(404).json({
      error: 'Todo not exists.'
    })
  }

  const updatedTodos = user.todos.map((todo) => todo.id === id ? {
    ...todo,
    done: true
  } : { ...todo })

  user.todos = updatedTodos

  return response.send(updatedTodos.filter((todo) => todo.id === id)[0])
});

app.delete('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { id } = request.params
  const { username } = request.headers

  const user = getUser(username)
  const todoExists = verifyIfTodoExists(user.todos, id)

  if (!todoExists) {
    return response.status(404).send({
      error: 'Todo not exists.'
    })
  }

  const updatedTodos = user.todos.filter((todo) => todo.id !== id)
  user.todos = updatedTodos

  return response.status(204).send(user.todos)
});

module.exports = app;