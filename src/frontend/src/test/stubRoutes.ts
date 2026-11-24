import type { RouteRecordRaw } from 'vue-router'

export const Stub = { template: '<div />' }

// Real route configuration (meta, redirects) with the views replaced by stubs.
export function withStubComponents(records: RouteRecordRaw[]): RouteRecordRaw[] {
  return records.map((record) =>
    'redirect' in record ? record : ({ ...record, component: Stub } as RouteRecordRaw),
  )
}
