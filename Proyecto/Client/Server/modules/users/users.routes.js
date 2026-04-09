const express = require("express");
const asyncHandler = require("../../utils/asyncHandler");
const createUsersRepository = require("./users.repository");
const createUsersService = require("./users.service");
const createUsersController = require("./users.controller");

const createUsersRouter = ({ pool }) => {
  const router = express.Router();
  const usersRepository = createUsersRepository(pool);
  const usersService = createUsersService(usersRepository);
  const usersController = createUsersController(usersService);

  router.get("/users", asyncHandler(usersController.getUsers));
  router.post("/users", asyncHandler(usersController.createUser));
  router.delete("/users/:id", asyncHandler(usersController.deleteUser));
  router.put("/users/:id", asyncHandler(usersController.updateUser));

  return router;
};

module.exports = createUsersRouter;
