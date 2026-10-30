import {
  mdiBookOpenVariant,
  mdiCar,
  mdiCloud,
  mdiDumbbell,
  mdiGamepadVariant,
  mdiHeartPulse,
  mdiHome,
  mdiMovie,
  mdiMusic,
  mdiNewspaper,
  mdiShopping,
  mdiTagOutline,
  mdiWifi,
} from '@mdi/js'

export interface CategoryIconOption {
  label: string
  value: string
}

export const CATEGORY_ICON_OPTIONS: CategoryIconOption[] = [
  { label: 'Music', value: mdiMusic },
  { label: 'Film', value: mdiMovie },
  { label: 'Health', value: mdiHeartPulse },
  { label: 'Fitness', value: mdiDumbbell },
  { label: 'Gaming', value: mdiGamepadVariant },
  { label: 'Cloud', value: mdiCloud },
  { label: 'Internet', value: mdiWifi },
  { label: 'Shopping', value: mdiShopping },
  { label: 'News', value: mdiNewspaper },
  { label: 'Books', value: mdiBookOpenVariant },
  { label: 'Home', value: mdiHome },
  { label: 'Transport', value: mdiCar },
]

export const DEFAULT_CATEGORY_ICON = mdiTagOutline

export function getDefaultCategoryIcon(): string {
  return DEFAULT_CATEGORY_ICON
}
