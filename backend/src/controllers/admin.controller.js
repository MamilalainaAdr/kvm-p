import { User, VirtualMachine } from '../models/index.js';

export const listUsers = async (req, res) => {
  try {
    const users = await User.findAll({ include: [{ model: VirtualMachine }], order: [['id', 'ASC']] });
    return res.json({ users });
  } catch (err) {
    console.error('admin.listUsers', err);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const toggleRole = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
    user.role = user.role === 'admin' ? 'user' : 'admin';
    await user.save();
    return res.json({ message: 'Rôle modifié', user: { id: user.id, role: user.role } });
  } catch (err) {
    console.error('admin.toggleRole', err);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
    await user.destroy();
    return res.json({ message: 'Utilisateur supprimé' });
  } catch (err) {
    console.error('admin.deleteUser', err);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};