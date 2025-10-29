import dotenv from 'dotenv';
dotenv.config();
import { sequelize as seq } from '../config/db.js';
import defineUser from './user.js';
import defineVM from './virtualMachine.js';

export const sequelize = seq;
export const User = defineUser(sequelize);
export const VirtualMachine = defineVM(sequelize);

User.hasMany(VirtualMachine, { foreignKey: 'user_id', onDelete: 'CASCADE' });
VirtualMachine.belongsTo(User, { foreignKey: 'user_id' });

export default sequelize;