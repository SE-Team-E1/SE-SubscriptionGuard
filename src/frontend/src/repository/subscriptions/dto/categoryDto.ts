import type { Price, RenewalPeriod } from "@/domain/domain";
import { tags } from "typia";

export interface RestCategoryDTO {
    id: string & tags.Format<'uuid'>,
    name: string,
    icon: string
}