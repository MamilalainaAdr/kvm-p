// backend/src/models/VirtualMachine.js
import { DataTypes, Model } from 'sequelize';

export class VirtualMachine extends Model {
  static initModel(sequelize) {
    return VirtualMachine.init({
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      user_id: { type: DataTypes.INTEGER, allowNull: false },
      name: { type: DataTypes.STRING, allowNull: false }, // nom user-friendly
      full_name: { type: DataTypes.STRING, allowNull: true }, // nom reel dans virsh
      os_type: DataTypes.STRING,
      version: DataTypes.STRING,
      vcpu: DataTypes.INTEGER,
      memory: DataTypes.INTEGER,
      disk_size: DataTypes.INTEGER,
      ip_address: DataTypes.STRING,   // IP interne (libvirt)
      internal_ip: DataTypes.STRING,  // alias ip_address
      public_ip: DataTypes.STRING,    // IP publique du serveur (constante)
      port: DataTypes.INTEGER,         // Port externe attribué
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