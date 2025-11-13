import React, { useState, useEffect } from 'react';

const OS_OPTIONS = [
  { 
    value: 'ubuntu', 
    label: 'Ubuntu', 
    versions: [
      { value: '2204', label: '22.04 LTS', ext: 'img' },
      { value: '2404', label: '24.04 LTS', ext: 'img' }
    ] 
  },
  { 
    value: 'debian', 
    label: 'Debian', 
    versions: [
      { value: '11', label: '11 Bullseye', ext: 'qcow2' },
      { value: '12', label: '12 Bookworm', ext: 'qcow2' }
    ] 
  },
  { 
    value: 'centos', 
    label: 'CentOS', 
    versions: [
      { value: '7', label: '7', ext: 'qcow2' },
      { value: '9', label: 'Stream 9', ext: 'qcow2' }
    ] 
  }
];

export default function OSVersionPicker({ value, onChange }) {
  const [selectedOS, setSelectedOS] = useState('');
  const [selectedVersion, setSelectedVersion] = useState('');
  const [versionOptions, setVersionOptions] = useState([]);

  useEffect(() => {
    if (value) {
      const [os, ver] = value.split(':');
      setSelectedOS(os);
      setSelectedVersion(ver);
      
      const osData = OS_OPTIONS.find(o => o.value === os);
      if (osData) setVersionOptions(osData.versions);
    }
  }, [value]);

  const handleOSChange = (e) => {
    const os = e.target.value;
    setSelectedOS(os);
    setSelectedVersion('');
    onChange({ os_type: os, version: '', ext: '' });
    
    const osData = OS_OPTIONS.find(o => o.value === os);
    setVersionOptions(osData ? osData.versions : []);
  };

  const handleVersionChange = (e) => {
    const ver = e.target.value;
    setSelectedVersion(ver);
    
    const osData = OS_OPTIONS.find(o => o.value === selectedOS);
    const versionData = osData?.versions.find(v => v.value === ver);
    
    onChange({ 
      os_type: selectedOS, 
      version: ver, 
      ext: versionData?.ext || 'qcow2' 
    });
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">OS</label>
        <select 
          className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-green-500"
          value={selectedOS}
          onChange={handleOSChange}
          required
        >
          <option value="">Choisir un OS</option>
          {OS_OPTIONS.map(os => (
            <option key={os.value} value={os.value}>{os.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Version</label>
        <select 
          className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-green-500"
          value={selectedVersion}
          onChange={handleVersionChange}
          required
          disabled={!selectedOS}
        >
          <option value="">{selectedOS ? 'Choisir version' : 'Sélectionnez OS'}</option>
          {versionOptions.map(ver => (
            <option key={ver.value} value={ver.value}>{ver.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}