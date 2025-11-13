import { sequelize } from '../config/db.js';
import { User } from './User.js';
import { VirtualMachine } from './VirtualMachine.js';

// ✅ Initialiser D'ABORD les modèles avec sequelize
User.initModel(sequelize);
VirtualMachine.initModel(sequelize);

// ✅ Ensuite définir les associations
User.hasMany(VirtualMachine, { foreignKey: 'user_id', onDelete: 'CASCADE' });
VirtualMachine.belongsTo(User, { foreignKey: 'user_id' });

export { sequelize, User, VirtualMachine };