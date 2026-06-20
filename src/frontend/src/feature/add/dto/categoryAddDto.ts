import type { CategoryIcon } from "@/domain/subscriptionModel";

export interface CategoryAddDto {
    name: string;
    icon: CategoryIcon;
}