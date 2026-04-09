const createUsersController = (usersService) => ({
  getUsers: async (req, res) => {
    const users = await usersService.getUsers();
    res.json(users);
  },

  createUser: async (req, res) => {
    const { name, email } = req.body;
    const user = await usersService.createUser({ name, email });
    res.json(user);
  },

  deleteUser: async (req, res) => {
    const { id } = req.params;
    await usersService.deleteUser(id);
    res.send("Usuario eliminado");
  },

  updateUser: async (req, res) => {
    const { id } = req.params;
    const { name, email } = req.body;
    const user = await usersService.updateUser({ id, name, email });
    res.json(user);
  },
});

module.exports = createUsersController;
