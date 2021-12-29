const express = require('express');
const cors = require('cors');

const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;

  const user = users.find(u => u.username === username);

  if (!user) {
    return response.status(404).json({ error: 'This user dont exists!' })
  }

  request.user = user;

  return next();
}

app.post('/users', (request, response) => {
  const { name, username } = request.body;

  const userAlreadyExists = users.find(u => u.username === username);

  if (userAlreadyExists) {
    return response.status(400).json({ error: 'This username is already in use!' });
  }

  const newUser = {
    id: uuidv4(),
    name,
    username,
    todos: []
  };

  users.push(newUser);

  return response.status(201).json(newUser);
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request;

  return response.status(200).json(user.todos);
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;
  const { user } = request;

  const newTodo = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date()
  };

  const updatedUser = { ...user };
  const userIndex = users.findIndex(u => u.id === updatedUser.id);

  updatedUser.todos.push(newTodo);

  users.splice(userIndex, 1, updatedUser);

  return response.status(201).json(newTodo);
});

app.put('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;
  const { id: taskId } = request.params;
  const { user } = request;

  const updatedUser = { ...user };
  const indexOfUserToUpdate = users.findIndex(u => u.id === updatedUser.id);
  const updatedTaskIndex = updatedUser.todos.findIndex((todo) => todo.id === taskId);

  if (updatedTaskIndex < 0) {
    return response.status(404).json({ error: 'Todo item not found!' });
  }

  updatedUser.todos[updatedTaskIndex].title = title;
  updatedUser.todos[updatedTaskIndex].deadline = new Date(deadline);

  users.splice(indexOfUserToUpdate, 1, updatedUser);

  return response.status(201).json(updatedUser.todos[updatedTaskIndex]);
});

app.patch('/todos/:id/done', checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const { id: taskId } = request.params;

  const updatedUser = { ...user };
  const indexOfUserToUpdate = users.findIndex(u => u.id === updatedUser.id);
  const updatedTaskIndex = updatedUser.todos.findIndex((todo) => todo.id === taskId);

  if (updatedTaskIndex < 0) {
    return response.status(404).json({ error: 'Todo item not found!' });
  }

  updatedUser.todos[updatedTaskIndex].done = true;

  users.splice(indexOfUserToUpdate, 1, updatedUser);

  return response.status(201).json(updatedUser.todos[updatedTaskIndex]);

});

app.delete('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const { id: taskId } = request.params;

  const updatedUser = { ...user };
  const indexOfUserToUpdate = users.findIndex(u => u.id === updatedUser.id);
  const updatedTaskIndex = updatedUser.todos.findIndex((todo) => todo.id === taskId);

  if (updatedTaskIndex < 0) {
    return response.status(404).json({ error: 'Todo item not found!' });
  }

  updatedUser.todos.splice(updatedTaskIndex, 1);

  users.splice(indexOfUserToUpdate, 1, updatedUser);

  return response.status(204).send();

});

module.exports = app;