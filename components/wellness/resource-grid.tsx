import { WellnessResource } from '@/types/wellness';
import { ResourceCard } from './resource-card';

interface ResourceGridProps {
  resources: WellnessResource[];
  onSelect: (resource: WellnessResource) => void;
}

export function ResourceGrid({ resources, onSelect }: ResourceGridProps) {
  if (resources.length === 0) {
    return (
      <div className="col-span-full flex items-center justify-center py-24">
        <p className="text-muted-foreground text-base text-center">
          No resources found. Try a different filter.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {resources.map((resource, index) => (
        <ResourceCard
          key={resource.id}
          resource={resource}
          index={index}
          onClick={() => onSelect(resource)}
        />
      ))}
    </div>
  );
}
