import { Button } from "@/components/ui/button";
import { Dog, Cat, Bird, Rabbit, Sparkles } from "lucide-react";

interface CategoryFilterProps {
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
}

const categories = [
  { id: null, name: "All", icon: Sparkles },
  { id: "dog", name: "Dogs", icon: Dog },
  { id: "cat", name: "Cats", icon: Cat },
  { id: "bird", name: "Birds", icon: Bird },
  { id: "rabbit", name: "Rabbits", icon: Rabbit },
];

const CategoryFilter = ({ selectedCategory, onSelectCategory }: CategoryFilterProps) => {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
      {categories.map((category) => {
        const Icon = category.icon;
        const isSelected = selectedCategory === category.id;
        
        return (
          <Button
            key={category.id || "all"}
            variant={isSelected ? "default" : "outline"}
            className={`rounded-2xl flex-shrink-0 ${
              isSelected ? "bg-gradient-primary" : ""
            }`}
            onClick={() => onSelectCategory(category.id)}
          >
            <Icon className="w-4 h-4 mr-2" />
            {category.name}
          </Button>
        );
      })}
    </div>
  );
};

export default CategoryFilter;