import type { RestCategoryDTO } from "../dto/categoryDto";
import { Category, type CategoryIcon, EntityId } from "@/domain/subscriptionModel";

export function mapCategoryDTOtoEntity(dto: RestCategoryDTO): Category {
    return Category.rehydrate({
        id: EntityId.fromString(dto.id),
        name: dto.name,
        icon: dto.icon as CategoryIcon
    })
}

export function mapCategoryEntityToDTO(category: Category): RestCategoryDTO {
    return {
        id: category.id.value,
        name: category.name,
        icon: category.icon as string
    }
}