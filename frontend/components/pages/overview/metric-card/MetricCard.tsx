import { ReactNode } from "react";

const MetricCard = ({
  metric,
  icon,
  label,
}: {
  metric: string;
  icon?: ReactNode;
  label: string;
}) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 w-44 h-28 flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <p>{label}</p>
        {icon}
      </div>
      <p className="text-2xl font-semibold text-gray-600">{metric}</p>
    </div>
  );
};

export default MetricCard;
