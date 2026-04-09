const createUsersService = (usersRepository) => ({
  getUsers: async () => usersRepository.getAll(),
  createUser: async ({ name, email }) => usersRepository.create({ name, email }),
  deleteUser: async (id) => usersRepository.deleteById(id),
  updateUser: async ({ id, name, email }) =>
    usersRepository.updateById({ id, name, email }),
});

module.exports = createUsersService;
