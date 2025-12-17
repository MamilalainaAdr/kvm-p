import { Check } from 'lucide-react';
import { Card } from './ui/Card';

const PLANS = [
  { id: 'tiny', name: 'Tiny', vcpu: 1, memory: 512, disk: 10 },
  { id: 'small', name: 'Small', vcpu: 1, memory: 1024, disk: 20 },
  { id: 'medium', name: 'Medium', vcpu: 2, memory: 1536, disk: 40 },
  { id: 'large', name: 'Large', vcpu: 2, memory: 2048, disk: 80 },
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
            <h3 className="font-bold text-lg text-primary">{plan.name}</h3>
            {selectedPlan?.id === plan.id && (
              <div className="bg-primary text-white rounded-full p-1">
                <Check className="w-4 h-4" />
              </div>
            )}
          </div>
          
          <div className="space-y-2 text-sm text-muted">
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
        </Card>
      ))}
    </div>
  );
}