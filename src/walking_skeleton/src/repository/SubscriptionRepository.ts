import type {SubscriptionListItemDTO} from "@/feature/list/dto/ListDTO.ts";
import {Currency, RenewalPeriodUnitEnum} from "@/domain/domain.ts";
import type {CreateSubscriptionDTO} from "@/feature/add/AddDTO.ts";

export interface TempSubscriptionResponse{
  "id": number,
  "anbieter": string,
  "preis": {
    "amount": string,
    "currency": "EUR"
  },
  "kündigungsfrist_amount"?: number,
  "kündigungsfrist_unit": "days" | "weeks" | "months" | "years"
  "buchungsdatum"?: number,
  "abschlussdatum": string
}
export interface TempSubscriptionRequest{
  "anbieter": string,
  "preis_amount": string,
  "preis_currency": "EUR"
  "kündigungsfrist_amount"?: number,
  "kündigungsfrist_unit": "days" | "weeks" | "months" | "years"
  "buchungsdatum"?: number,
  "abschlussdatum": string
}

function mapResponseToDTO(response: TempSubscriptionResponse): SubscriptionListItemDTO{
  return {
    id: response.id.toString(),
    name: response.anbieter, // gibt kein name
    provider: response.anbieter,
    price: {
      amount: Number.parseFloat(response.preis.amount),
      currency: response.preis.currency as Currency
    },
    renewalPeriod: {
      amount: response.kündigungsfrist_amount ?? 1,
      unit: response.kündigungsfrist_unit
    },
    rating: {
      value: Math.random() * 5
    }
  }
}

function mapDTOToRequest(dto: CreateSubscriptionDTO): TempSubscriptionRequest{
  return {
    anbieter: dto.provider,
    preis_amount: dto.price.amount.toString(),
    preis_currency: "EUR",//dto.price.currency.
    kündigungsfrist_amount: dto.renewalPeriod.amount,
    kündigungsfrist_unit: dto.renewalPeriod.unit,
    buchungsdatum: undefined,
    abschlussdatum: dto.startDate
  }
}

export interface SubscriptionRepository{
  getSubscriptionList(): Promise<SubscriptionListItemDTO[]>;
  createSubscription(dto: CreateSubscriptionDTO): Promise<SubscriptionListItemDTO>;
}

export class RestSubscriptionRepository implements SubscriptionRepository{
  async createSubscription(dto: CreateSubscriptionDTO): Promise<SubscriptionListItemDTO> {
    console.log(dto);
    try {
      const response = await fetch("/abos/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(mapDTOToRequest(dto)),
      });
      if(!response.ok){
        throw new Error(`Could not create new Subscription. Request status: ${response.status}`);
      }
      const result: TempSubscriptionResponse = await response.json();
      return mapResponseToDTO(result);
    }catch(error: any) {
      console.error(error.message);
      return Promise.reject(error.message);
    }
  }

  async getSubscriptionList(): Promise<SubscriptionListItemDTO[]> {
    try {
      const response = await fetch("/abos/?format=json")
      if (!response.ok) {
        throw new Error(`Could not fetch subscription list. Response status: ${response.status}`);
      }

      const result: TempSubscriptionResponse[] = await response.json();
      return result.map(mapResponseToDTO);
    }catch (error: any) {
      console.error(error.message);
      return Promise.reject(error.message);
    }
  }
}

export class DummySubscriptionRepository implements SubscriptionRepository{
  createSubscription(dto: CreateSubscriptionDTO): Promise<SubscriptionListItemDTO> {
    return Promise.resolve({
      id: 'temp-' + Math.random(),
      name: dto.name,
      price: dto.price,
      renewalPeriod: dto.renewalPeriod,
      provider: dto.provider,
    });
  }

  getSubscriptionList(): Promise<SubscriptionListItemDTO[]> {
    return Promise.resolve([
      {
        id: "0",
        name: "Spotify Premium",
        provider: "Spotify",
        price: {
          amount: 35,
          currency: Currency.EUR
        },
        renewalPeriod: {
          amount: 1,
          unit: RenewalPeriodUnitEnum.MONTHS
        },
        rating: {
          value: 4.5
        }
      },
      {
        id: "1",
        provider: "Fitnessstudio Heinze",
        renewalPeriod: {
          amount: 3,
          unit: RenewalPeriodUnitEnum.MONTHS
        },
        name: "Fitnessstudio",
        price: {
          amount: 105,
          currency: Currency.EUR
        },
        rating: {
          value: 4.0
        }
      },
      {
        id: "2",
        provider: "Xbox",
        renewalPeriod: {
          amount: 1,
          unit: RenewalPeriodUnitEnum.YEARS
        },
        name: "Game Pass",
        price: {
          amount: 155,
          currency: Currency.EUR
        },
        rating: {
          value: 3.0
        }
      }
    ]);
  }
}

export class IndexedDBSubscriptionRepository implements SubscriptionRepository{
  createSubscription(dto: CreateSubscriptionDTO): Promise<SubscriptionListItemDTO> {
    return Promise.resolve({
      id: 'temp-' + Math.random(),
      name: dto.name,
      price: dto.price,
      renewalPeriod: dto.renewalPeriod,
      provider: dto.provider,
    });
  }

  getSubscriptionList(): Promise<SubscriptionListItemDTO[]> {
    return Promise.resolve([]);
  }
}
