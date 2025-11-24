import { Check } from 'lucide-react';
import { Card } from './ui/Card';

const PLANS = [
  { id: 'free', name: 'OB-1', vcpu: 1, memory: 512, disk: 10, price: 'MGA 5k/mois' },
  { id: 'basic', name: 'OB-2', vcpu: 1, memory: 1024, disk: 20, price: 'MGA 10k/mois' },
  { id: 'pro', name: 'OB-3', vcpu: 2, memory: 1536, disk: 50, price: 'MGA 15k/mois' },
  { id: 'enterprise', name: 'OB-4', vcpu: 2, memory: 2048, disk: 80, price: 'MGA 20k/mois' },
];

export default function PlanSelector({ selectedPlan, onSelect }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {PLANS.map((plan) => (
        <Card
          key={plan.id}
          onClick={() => onSelect(plan)}
          className={`cursor-pointer transition-all hover:shadow-lg ${
            selectedPlan?.id === plan.id 
              ? 'border-primary bg-primary/5' 
              : 'border-background hover:border-primary'
          }`}
        >
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-bold text-lg text-text">{plan.name}</h3>
            {selectedPlan?.id === plan.id && (
              <div className="bg-primary text-white rounded-full p-1">
                <Check className="w-4 h-4" />
              </div>
            )}
          </div>
          
          <div className="space-y-2 text-sm text-muted mb-4">
            <div className="flex justify-between">
              <span>VCPU</span>
              <span className="font-medium text-text">{plan.vcpu}</span>
            </div>
            <div className="flex justify-between">
              <span>RAM</span>
              <span className="font-medium text-text">{plan.memory} Mo</span>
            </div>
            <div className="flex justify-between">
              <span>Disque</span>
              <span className="font-medium text-text">{plan.disk} Go</span>
            </div>
          </div>
          
          <div className="text-center">
            <span className="px-3 py-1 bg-primary text-white text-sm rounded-full font-medium">
              {plan.price}
            </span>
          </div>
        </Card>
      ))}
    </div>
  );
}