import { DataTypes, Model } from 'sequelize';

export class VirtualMachine extends Model {
  static initModel(sequelize) {
    return VirtualMachine.init({
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      user_id: { type: DataTypes.INTEGER, allowNull: false },
      name: { type: DataTypes.STRING, allowNull: false }, // Nom "user-friendly"
      full_name: { type: DataTypes.STRING, allowNull: true }, // ✅ Nom réel virsh (avec timestamp)
      os_type: DataTypes.STRING,
      version: DataTypes.STRING,
      vcpu: DataTypes.INTEGER,
      memory: DataTypes.INTEGER,
      disk_size: DataTypes.INTEGER,
      ip_address: DataTypes.STRING,
      status: { type: DataTypes.STRING, defaultValue: 'pending' },
      tf_dir: DataTypes.STRING,
      ssh_key: { type: DataTypes.TEXT, allowNull: true }
    }, {
      sequelize,
      modelName: 'VirtualMachine',
      tableName: 'virtual_machines',
      indexes: [{ unique: true, fields: ['user_id', 'name'] }]
    });
  }
}