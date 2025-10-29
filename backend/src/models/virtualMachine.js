import { DataTypes, Model } from 'sequelize';

export default (sequelize) => {
  class VirtualMachine extends Model {}
  VirtualMachine.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    os_type: DataTypes.STRING,
    version: DataTypes.STRING,
    vcpu: DataTypes.INTEGER,
    memory: DataTypes.INTEGER,
    disk_size: DataTypes.INTEGER,
    ip_address: DataTypes.STRING,
    status: { type: DataTypes.STRING, defaultValue: 'pending' },
    tf_dir: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'VirtualMachine',
    tableName: 'virtual_machines',
    timestamps: true
  });
  return VirtualMachine;
};