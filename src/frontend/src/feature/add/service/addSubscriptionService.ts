import type { CategoryRepository, ProviderRepository, SubscriptionRepository } from "@/repository/subscriptions/repositories";
import { Category, Provider, Subscription } from "@/domain/subscriptionModel";
import { mapCategoryDTOtoEntity, mapCategoryEntityToDTO } from "@/repository/subscriptions/mapper/categoryMapper";
import { mapProviderDTOtoEntity, mapProviderEntityToDTO } from "@/repository/subscriptions/mapper/providerMapper";
import { mapSubscriptionDTOtoEntity, mapSubscriptionEntityToDTO } from "@/repository/subscriptions/mapper/subscriptionMapper";
import type { CategoryAddDto } from "../dto/categoryAddDto";
import type { ProviderAddDto } from "../dto/providerAddDto";
import type { SubscriptionAddDto } from "../dto/subscriptionAddDto";

export class AddSubscriptionService {
    constructor(
        private subscriptionRepository: SubscriptionRepository,
        private categoryRepository: CategoryRepository,
        private providerRepository: ProviderRepository
    ) {

    }

    async getAvailableCategories(): Promise<Category[]> {
        const categorieDtos = await this.categoryRepository.findAll();
        return categorieDtos.map(categoryDto => mapCategoryDTOtoEntity(categoryDto));
    }

    async getAvailableProviders(): Promise<Provider[]> {
        const providerDtos = await this.providerRepository.findAll();
        return providerDtos.map(providerDto => mapProviderDTOtoEntity(providerDto));
    }

    async addCategory(categoryAddDto: CategoryAddDto): Promise<Category> {

        const allCategories = await this.getAvailableCategories();
        const existingCategory = allCategories.find(category => 
            category.name === categoryAddDto.name && 
            category.icon === categoryAddDto.icon
        );
        if(existingCategory) {
            return existingCategory;
        }

        const categoryEntity = Category.create(categoryAddDto);
        const categoryRepoDto = mapCategoryEntityToDTO(categoryEntity);
        const insertedCategory = await this.categoryRepository.insert(categoryRepoDto);
        return mapCategoryDTOtoEntity(insertedCategory);
    }

    async addProvider(providerAddDto: ProviderAddDto): Promise<Provider> {
        const allProviders = await this.getAvailableProviders();
        const existingProvider = allProviders.find(provider => provider.name === providerAddDto.name);
        if(existingProvider) {
            return existingProvider;
        }

        const providerEntity = Provider.create(providerAddDto.name);
        const providerRepoDto = mapProviderEntityToDTO(providerEntity);
        const insertedProvider = await this.providerRepository.insert(providerRepoDto);
        return mapProviderDTOtoEntity(insertedProvider);
    }

    async addSubscription(subscriptionAddDto: SubscriptionAddDto): Promise<Subscription> {
        const providerEntity = await this.addProvider(subscriptionAddDto.provider);
        const subscriptionEntity = Subscription.create({
            name: subscriptionAddDto.name,
            provider: providerEntity,
            categories: subscriptionAddDto.categories,
            price: subscriptionAddDto.price,
            renewal: subscriptionAddDto.renewal,
            bookingDate: new Date(subscriptionAddDto.bookingDate)
        })

        const subscriptionRepoDto = mapSubscriptionEntityToDTO(subscriptionEntity);
        await this.subscriptionRepository.insert(subscriptionRepoDto);
        return mapSubscriptionDTOtoEntity(subscriptionRepoDto, providerEntity, subscriptionAddDto.categories);
    }
}