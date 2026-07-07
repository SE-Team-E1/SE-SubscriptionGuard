import { EntityId, Provider } from "@/domain/subscriptionModel";
import type { RestProviderDTO } from "../dto/providerDto";

export function mapProviderDTOtoEntity(dto: RestProviderDTO): Provider {
    return Provider.rehydrate({
        id: EntityId.fromString(dto.id),
        name: dto.name
    })
}

export function mapProviderEntityToDTO(provider: Provider): RestProviderDTO {
    return {
        id: provider.id.value,
        name: provider.name
    }
}