import type { Price, RenewalPeriod } from "@/domain/domain";
import { tags } from "typia";
  
export interface RestProviderDTO {
  id: string & tags.Format<'uuid'>,
  name: string
}