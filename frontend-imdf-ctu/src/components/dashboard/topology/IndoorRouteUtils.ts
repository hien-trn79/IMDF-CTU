import type { IndoorRouteResponse } from '../../../model/IndoorRoute.model'

/**
 * Giá trị đưa vào đường dẫn của GET/PUT/DELETE /indoor-routes/{indoorRouteId}.
 * Mặc định dùng id dạng số. Nếu Swagger ghi kiểu của {indoorRouteId} là string thì đổi thành
 * `route.indoorRouteId`.
 */
export const routePathId = (route: IndoorRouteResponse): number | string => route.id
