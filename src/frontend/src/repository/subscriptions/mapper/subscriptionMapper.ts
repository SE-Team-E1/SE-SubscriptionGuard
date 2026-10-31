import { Category, Provider, Subscription, EntityId } from "@/domain/subscriptionModel"
import type { RestSubscriptionDTO } from "../dto/subscriptionDto"

export function mapSubscriptionDTOtoEntity(dto: RestSubscriptionDTO, provider: Provider, categories: Category[]): Subscription {
    return Subscription.rehydrate({
      id: EntityId.fromString(dto.id),
      createdAt: new Date(dto.createdAt), // TODO discuss usage of Date type and which standard the response string follows
  
      name: dto.name,
      provider: provider,
      categories: categories,
  
      price: dto.price,
      bookingDate: new Date(dto.bookingDate),
      renewal: dto.renewal
    })
  }
  
export function mapSubscriptionEntityToDTO(subscription: Subscription): RestSubscriptionDTO {
    return {
        id: subscription.id.value,
        createdAt: subscription.createdAt.toISOString(),
        name: subscription.name,
        providerId: subscription.provider.id.value,
        categoriesId: subscription.categories.map(c => c.id.value),
        price: subscription.price,
        renewal: subscription.renewal,
        bookingDate: subscription.bookingDate.toISOString()
    }
}