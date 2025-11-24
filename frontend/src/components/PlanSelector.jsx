// frontend/src/components/PlanSelector.jsx
const PLANS = [
  { id: 'free', name: 'OB-1', vcpu: 1, memory: 512, disk: 10, price: 'MGA 5k/mois' },
  { id: 'basic', name: 'OB-2', vcpu: 1, memory: 1024, disk: 20, price: 'MGA 10k/mois' },
  { id: 'pro', name: 'OB-3', vcpu: 2, memory: 1536, disk: 50, price: 'MGA 15k/mois' },
  { id: 'enterprise', name: 'OB-4', vcpu: 2, memory: 2048, disk: 80, price: 'MGA 20k/mois' },
];

export default function PlanSelector({ selectedPlan, onSelect }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
      {PLANS.map((plan) => (
        <div
          key={plan.id}
          onClick={() => onSelect(plan)}
          className={`cursor-pointer bg-white border-2 rounded-lg p-4 hover:shadow-lg transition ${
            selectedPlan?.id === plan.id ? 'border-green-500 shadow-md' : 'border-gray-200'
          }`}
        >
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-bold text-lg text-gray-800">{plan.name}</h3>
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">{plan.price}</span>
          </div>
          
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>VCPU</span>
              <span className="font-medium">{plan.vcpu}</span>
            </div>
            <div className="flex justify-between">
              <span>RAM</span>
              <span className="font-medium">{plan.memory} Mo</span>
            </div>
            <div className="flex justify-between">
              <span>Disque</span>
              <span className="font-medium">{plan.disk} Go</span>
            </div>
          </div>
          
          <button 
            type="button"
            className="w-full mt-4 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
          >
            {selectedPlan?.id === plan.id ? '✓ Sélectionné' : 'Choisir'}
          </button>
        </div>
      ))}
    </div>
  );
}