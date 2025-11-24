export const Card = ({ children, className = '', ...props }) => {
  return (
    <div 
      className={[
        'bg-surface rounded-xl shadow-sm border border-background',
        'p-6',
        className
      ].join(' ')}
      {...props}
    >
      {children}
    </div>
  );
};