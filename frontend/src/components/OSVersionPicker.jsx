import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

const OPTIONS = [
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
      { value: '12', label: '12 Bookworm', ext: 'qcow2' }
    ] 
  }
];

export default function OSVersionPicker({ value, onChange }) {
  const [os, setOs] = useState('');
  const [vers, setVers] = useState('');
  const [versions, setVersions] = useState([]);

  useEffect(() => {
    if (value) {
      const [o, v] = value.split(':');
      setOs(o);
      setVers(v);
      const opt = OPTIONS.find(x => x.value === o);
      if (opt) setVersions(opt.versions);
    }
  }, [value]);

  const handleOS = (e) => {
    const val = e.target.value;
    setOs(val);
    setVers('');
    const opt = OPTIONS.find(x => x.value === val);
    setVersions(opt?.versions || []);
    onChange({ os_type: val, version: '', ext: '' });
  };

  const handleVersion = (e) => {
    const val = e.target.value;
    setVers(val);
    const opt = versions.find(x => x.value === val);
    onChange({ os_type: os, version: val, ext: opt?.ext || 'qcow2' });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 mb-8">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">OS</label>
        <div className="relative">
          <select 
            value={os} 
            onChange={handleOS} 
            required 
            className="w-full p-3 border border-muted rounded-lg appearance-none bg-white focus:ring-2 focus:ring-accent"
          >
            <option value="">Choisir</option>
            {OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <ChevronDown className="w-5 h-5 text-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Version</label>
        <div className="relative">
          <select 
            value={vers} 
            onChange={handleVersion} 
            required 
            disabled={!os}
            className="w-full p-3 border border-muted rounded-lg appearance-none bg-white focus:ring-2 focus:ring-accent disabled:opacity-50"
          >
            <option value="">{os ? 'Choisir' : 'Sélectionnez OS'}</option>
            {versions.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
          </select>
          <ChevronDown className="w-5 h-5 text-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>
    </div>
  );
}